/**
 * Advanced Tournament System for Tic-Tac-Toe
 * Implements multiple tournament formats and player management
 */
import { Player } from './AdvancedAI';

export interface TournamentPlayer {
  id: string;
  name: string;
  type: 'Human' | 'AI';
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Impossible';
  stats: {
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
  };
  elo: number;
}

export interface Match {
  id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  result: 'Player1' | 'Player2' | 'Draw' | 'Pending';
  roundNumber: number;
  startTime?: Date;
  endTime?: Date;
  moves: { player: Player; position: { row: number; col: number }; timestamp: Date }[];
}

export interface Tournament {
  id: string;
  name: string;
  type: 'SingleElimination' | 'DoubleElimination' | 'RoundRobin' | 'Swiss';
  status: 'Setup' | 'InProgress' | 'Completed';
  players: TournamentPlayer[];
  matches: Match[];
  bracket: TournamentBracket;
  currentRound: number;
  totalRounds: number;
  winner?: TournamentPlayer;
  startTime?: Date;
  endTime?: Date;
}

export interface TournamentBracket {
  rounds: Match[][];
  finals?: Match;
  grandFinals?: Match;
}

export class TournamentSystem {
  private tournaments: Map<string, Tournament> = new Map();
  private playerDatabase: Map<string, TournamentPlayer> = new Map();
  private matchHistory: Match[] = [];
  
  constructor() {
    this.initializeAIPlayers();
  }
  
  /**
   * Initialize default AI players with different difficulties
   */
  private initializeAIPlayers(): void {
    const aiDifficulties: Array<'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Impossible'> = 
      ['Easy', 'Medium', 'Hard', 'Expert', 'Impossible'];
    
    aiDifficulties.forEach((difficulty, index) => {
      const player: TournamentPlayer = {
        id: `ai_${difficulty.toLowerCase()}`,
        name: `AI ${difficulty}`,
        type: 'AI',
        difficulty,
        stats: { wins: 0, losses: 0, draws: 0, gamesPlayed: 0 },
        elo: 1200 + (index * 200) // Base ELO increases with difficulty
      };
      
      this.playerDatabase.set(player.id, player);
    });
  }
  
  /**
   * Create a new tournament
   */
  createTournament(
    name: string, 
    type: Tournament['type'],
    playerIds: string[]
  ): Tournament {
    if (playerIds.length < 2) {
      throw new Error('Tournament requires at least 2 players');
    }
    
    const players = playerIds.map(id => {
      const player = this.playerDatabase.get(id);
      if (!player) throw new Error(`Player ${id} not found`);
      return { ...player }; // Clone to avoid mutation
    });
    
    const tournament: Tournament = {
      id: this.generateId(),
      name,
      type,
      status: 'Setup',
      players,
      matches: [],
      bracket: { rounds: [] },
      currentRound: 0,
      totalRounds: this.calculateTotalRounds(type, players.length)
    };
    
    this.tournaments.set(tournament.id, tournament);
    this.generateBracket(tournament);
    
    return tournament;
  }
  
  /**
   * Generate tournament bracket based on type
   */
  private generateBracket(tournament: Tournament): void {
    switch (tournament.type) {
      case 'SingleElimination':
        this.generateSingleEliminationBracket(tournament);
        break;
      case 'DoubleElimination':
        this.generateDoubleEliminationBracket(tournament);
        break;
      case 'RoundRobin':
        this.generateRoundRobinBracket(tournament);
        break;
      case 'Swiss':
        this.generateSwissBracket(tournament);
        break;
    }
  }
  
  /**
   * Generate single elimination bracket
   */
  private generateSingleEliminationBracket(tournament: Tournament): void {
    let players = [...tournament.players];
    let roundNumber = 1;
    
    // Add byes if necessary
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(players.length)));
    while (players.length < nextPowerOf2) {
      players.push(null as any); // Bye
    }
    
    tournament.bracket.rounds = [];
    
    while (players.length > 1) {
      const roundMatches: Match[] = [];
      
      for (let i = 0; i < players.length; i += 2) {
        const player1 = players[i];
        const player2 = players[i + 1];
        
        if (player1 && player2) {
          const match: Match = {
            id: this.generateId(),
            player1,
            player2,
            result: 'Pending',
            roundNumber,
            moves: []
          };
          
          roundMatches.push(match);
          tournament.matches.push(match);
        }
      }
      
      tournament.bracket.rounds.push(roundMatches);
      players = roundMatches.map(() => null as any); // Placeholders for winners
      roundNumber++;
    }
  }
  
  /**
   * Generate double elimination bracket
   */
  private generateDoubleEliminationBracket(tournament: Tournament): void {
    // Simplified double elimination - winners bracket + losers bracket
    this.generateSingleEliminationBracket(tournament); // Start with single elimination
    
    // Add losers bracket logic (simplified for this implementation)
    const losersBracket: Match[] = [];
    tournament.bracket.rounds.forEach(round => {
      round.forEach(match => {
        // Each match can feed into losers bracket
        const losersMatch: Match = {
          id: this.generateId(),
          player1: null as any, // Will be filled with losers
          player2: null as any,
          result: 'Pending',
          roundNumber: match.roundNumber + 100, // Different numbering for losers bracket
          moves: []
        };
        losersBracket.push(losersMatch);
      });
    });
    
    // Add grand finals
    tournament.bracket.grandFinals = {
      id: this.generateId(),
      player1: null as any, // Winners bracket winner
      player2: null as any, // Losers bracket winner
      result: 'Pending',
      roundNumber: 999,
      moves: []
    };
  }
  
  /**
   * Generate round robin bracket
   */
  private generateRoundRobinBracket(tournament: Tournament): void {
    const players = tournament.players;
    let roundNumber = 1;
    
    // Generate all possible pairings
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const match: Match = {
          id: this.generateId(),
          player1: players[i],
          player2: players[j],
          result: 'Pending',
          roundNumber,
          moves: []
        };
        
        tournament.matches.push(match);
      }
    }
    
    // Organize matches into rounds for better scheduling
    tournament.bracket.rounds = [tournament.matches];
  }
  
  /**
   * Generate Swiss system bracket
   */
  private generateSwissBracket(tournament: Tournament): void {
    // Swiss system pairs players with similar scores each round
    // For now, generate first round randomly
    const players = [...tournament.players];
    this.shuffleArray(players);
    
    const firstRoundMatches: Match[] = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        const match: Match = {
          id: this.generateId(),
          player1: players[i],
          player2: players[i + 1],
          result: 'Pending',
          roundNumber: 1,
          moves: []
        };
        
        firstRoundMatches.push(match);
        tournament.matches.push(match);
      }
    }
    
    tournament.bracket.rounds = [firstRoundMatches];
  }
  
  /**
   * Start tournament
   */
  startTournament(tournamentId: string): Tournament {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    tournament.status = 'InProgress';
    tournament.startTime = new Date();
    tournament.currentRound = 1;
    
    return tournament;
  }
  
  /**
   * Report match result
   */
  reportMatchResult(tournamentId: string, matchId: string, result: Match['result']): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');
    
    match.result = result;
    match.endTime = new Date();
    
    // Update player statistics
    this.updatePlayerStats(match);
    
    // Update ELO ratings
    this.updateELORatings(match);
    
    // Check if tournament is complete
    if (this.isTournamentComplete(tournament)) {
      this.completeTournament(tournament);
    } else {
      this.advanceTournament(tournament);
    }
  }
  
  /**
   * Update player statistics
   */
  private updatePlayerStats(match: Match): void {
    const updatePlayer = (player: TournamentPlayer, won: boolean, drew: boolean) => {
      player.stats.gamesPlayed++;
      if (won) player.stats.wins++;
      else if (drew) player.stats.draws++;
      else player.stats.losses++;
    };
    
    switch (match.result) {
      case 'Player1':
        updatePlayer(match.player1, true, false);
        updatePlayer(match.player2, false, false);
        break;
      case 'Player2':
        updatePlayer(match.player1, false, false);
        updatePlayer(match.player2, true, false);
        break;
      case 'Draw':
        updatePlayer(match.player1, false, true);
        updatePlayer(match.player2, false, true);
        break;
    }
  }
  
  /**
   * Update ELO ratings using standard ELO system
   */
  private updateELORatings(match: Match): void {
    if (match.result === 'Pending') return;
    
    const K = 32; // ELO K-factor
    const player1Elo = match.player1.elo;
    const player2Elo = match.player2.elo;
    
    // Expected scores
    const expectedScore1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
    const expectedScore2 = 1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));
    
    // Actual scores
    let actualScore1, actualScore2;
    switch (match.result) {
      case 'Player1':
        actualScore1 = 1; actualScore2 = 0;
        break;
      case 'Player2':
        actualScore1 = 0; actualScore2 = 1;
        break;
      case 'Draw':
        actualScore1 = 0.5; actualScore2 = 0.5;
        break;
      default:
        return;
    }
    
    // Update ELO
    match.player1.elo = Math.round(player1Elo + K * (actualScore1 - expectedScore1));
    match.player2.elo = Math.round(player2Elo + K * (actualScore2 - expectedScore2));
  }
  
  /**
   * Advance tournament to next round
   */
  private advanceTournament(tournament: Tournament): void {
    if (tournament.type === 'SingleElimination') {
      this.advanceSingleElimination(tournament);
    }
    // Add logic for other tournament types
  }
  
  /**
   * Advance single elimination tournament
   */
  private advanceSingleElimination(tournament: Tournament): void {
    const currentRoundMatches = tournament.matches.filter(
      m => m.roundNumber === tournament.currentRound && m.result !== 'Pending'
    );
    
    if (currentRoundMatches.length === 0) return; // No completed matches in current round
    
    // Check if current round is complete
    const allCurrentRoundMatches = tournament.matches.filter(
      m => m.roundNumber === tournament.currentRound
    );
    
    if (currentRoundMatches.length < allCurrentRoundMatches.length) return; // Round not complete
    
    // Advance winners to next round
    if (tournament.currentRound < tournament.totalRounds) {
      tournament.currentRound++;
      
      const winners = currentRoundMatches.map(match => {
        switch (match.result) {
          case 'Player1': return match.player1;
          case 'Player2': return match.player2;
          default: return match.player1; // Default to player1 for draws (shouldn't happen in elimination)
        }
      });
      
      // Create next round matches
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          const nextMatch: Match = {
            id: this.generateId(),
            player1: winners[i],
            player2: winners[i + 1],
            result: 'Pending',
            roundNumber: tournament.currentRound,
            moves: []
          };
          
          tournament.matches.push(nextMatch);
        }
      }
    }
  }
  
  /**
   * Complete tournament
   */
  private completeTournament(tournament: Tournament): void {
    tournament.status = 'Completed';
    tournament.endTime = new Date();
    
    // Determine winner
    if (tournament.type === 'SingleElimination') {
      const finalMatch = tournament.matches.find(
        m => m.roundNumber === tournament.totalRounds && m.result !== 'Pending'
      );
      
      if (finalMatch) {
        tournament.winner = finalMatch.result === 'Player1' ? finalMatch.player1 : finalMatch.player2;
      }
    }
    // Add logic for other tournament types
  }
  
  /**
   * Check if tournament is complete
   */
  private isTournamentComplete(tournament: Tournament): boolean {
    const finalRoundMatches = tournament.matches.filter(
      m => m.roundNumber === tournament.totalRounds
    );
    
    if (finalRoundMatches.length === 0) return false;
    
    return finalRoundMatches.every(m => m.result !== 'Pending');
  }
  
  /**
   * Calculate total rounds for tournament type
   */
  private calculateTotalRounds(type: Tournament['type'], playerCount: number): number {
    switch (type) {
      case 'SingleElimination':
        return Math.ceil(Math.log2(playerCount));
      case 'DoubleElimination':
        return Math.ceil(Math.log2(playerCount)) * 2;
      case 'RoundRobin':
        return 1; // All matches in one "round"
      case 'Swiss':
        return Math.ceil(Math.log2(playerCount));
      default:
        return 1;
    }
  }
  
  /**
   * Get tournament standings
   */
  getTournamentStandings(tournamentId: string): TournamentPlayer[] {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    return tournament.players
      .slice() // Copy array
      .sort((a, b) => {
        // Sort by wins, then by ELO
        if (a.stats.wins !== b.stats.wins) {
          return b.stats.wins - a.stats.wins;
        }
        return b.elo - a.elo;
      });
  }
  
  /**
   * Get next matches for a tournament
   */
  getNextMatches(tournamentId: string): Match[] {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    return tournament.matches.filter(m => m.result === 'Pending');
  }
  
  /**
   * Add human player
   */
  addHumanPlayer(name: string): TournamentPlayer {
    const player: TournamentPlayer = {
      id: this.generateId(),
      name,
      type: 'Human',
      stats: { wins: 0, losses: 0, draws: 0, gamesPlayed: 0 },
      elo: 1200 // Starting ELO
    };
    
    this.playerDatabase.set(player.id, player);
    return player;
  }
  
  /**
   * Get all available players
   */
  getAvailablePlayers(): TournamentPlayer[] {
    return Array.from(this.playerDatabase.values());
  }
  
  /**
   * Get tournament by ID
   */
  getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }
  
  /**
   * Get all tournaments
   */
  getAllTournaments(): Tournament[] {
    return Array.from(this.tournaments.values());
  }
  
  /**
   * Utility functions
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
  
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * Export tournament data
   */
  exportTournamentData(tournamentId: string): string {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    return JSON.stringify(tournament, null, 2);
  }
  
  /**
   * Get player performance analytics
   */
  getPlayerAnalytics(playerId: string): {
    player: TournamentPlayer;
    winRate: number;
    averageOpponentELO: number;
    recentMatches: Match[];
    eloHistory: { date: Date; elo: number }[];
  } {
    const player = this.playerDatabase.get(playerId);
    if (!player) throw new Error('Player not found');
    
    const playerMatches = this.matchHistory.filter(
      m => m.player1.id === playerId || m.player2.id === playerId
    );
    
    const winRate = player.stats.gamesPlayed > 0 ? 
      player.stats.wins / player.stats.gamesPlayed : 0;
    
    const opponentELOs = playerMatches.map(match => {
      const isPlayer1 = match.player1.id === playerId;
      return isPlayer1 ? match.player2.elo : match.player1.elo;
    });
    
    const averageOpponentELO = opponentELOs.length > 0 ?
      opponentELOs.reduce((a, b) => a + b, 0) / opponentELOs.length : 0;
    
    return {
      player,
      winRate,
      averageOpponentELO,
      recentMatches: playerMatches.slice(-10),
      eloHistory: [] // Would need to track ELO changes over time
    };
  }
}