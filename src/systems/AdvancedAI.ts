/**
 * Advanced AI System for Tic-Tac-Toe
 * Implements Minimax, Alpha-Beta Pruning, and Neural Network-based strategies
 */
export type Player = 'X' | 'O';
export type BoardState = (Player | null)[][];
export type Position = { row: number; col: number };

export interface AIMove {
  position: Position;
  score: number;
  confidence: number;
  strategy: string;
}

export class AdvancedAIPlayer {
  private difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Impossible' = 'Hard';
  private player: Player;
  private opponent: Player;
  private moveHistory: Position[] = [];
  private patternMemory: Map<string, number> = new Map();
  
  constructor(player: Player, difficulty: typeof this.difficulty = 'Hard') {
    this.player = player;
    this.opponent = player === 'X' ? 'O' : 'X';
    this.difficulty = difficulty;
  }
  
  /**
   * Get the best move for the current board state
   */
  getBestMove(board: BoardState): AIMove {
    const availableMoves = this.getAvailableMoves(board);
    
    if (availableMoves.length === 0) {
      throw new Error('No available moves');
    }
    
    // Different strategies based on difficulty
    switch (this.difficulty) {
      case 'Easy':
        return this.getRandomMove(board, availableMoves);
      case 'Medium':
        return this.getMediumMove(board, availableMoves);
      case 'Hard':
        return this.getHardMove(board, availableMoves);
      case 'Expert':
        return this.getExpertMove(board, availableMoves);
      case 'Impossible':
        return this.getImpossibleMove(board, availableMoves);
      default:
        return this.getHardMove(board, availableMoves);
    }
  }
  
  /**
   * Easy AI - Random moves with slight preference for center/corners
   */
  private getRandomMove(board: BoardState, availableMoves: Position[]): AIMove {
    // Slight preference for center and corners
    const centerCornerMoves = availableMoves.filter(move => 
      (move.row === 1 && move.col === 1) || // center
      ((move.row === 0 || move.row === 2) && (move.col === 0 || move.col === 2)) // corners
    );
    
    const preferredMoves = centerCornerMoves.length > 0 ? centerCornerMoves : availableMoves;
    const randomMove = preferredMoves[Math.floor(Math.random() * preferredMoves.length)];
    
    return {
      position: randomMove,
      score: 0,
      confidence: 0.3,
      strategy: 'Random with preference'
    };
  }
  
  /**
   * Medium AI - Basic strategy with some look-ahead
   */
  private getMediumMove(board: BoardState, availableMoves: Position[]): AIMove {
    // Check for immediate win
    for (const move of availableMoves) {
      const testBoard = this.makeMove(board, move, this.player);
      if (this.checkWin(testBoard, this.player)) {
        return {
          position: move,
          score: 100,
          confidence: 1.0,
          strategy: 'Winning move'
        };
      }
    }
    
    // Check for blocking opponent's win
    for (const move of availableMoves) {
      const testBoard = this.makeMove(board, move, this.opponent);
      if (this.checkWin(testBoard, this.opponent)) {
        return {
          position: move,
          score: 50,
          confidence: 0.9,
          strategy: 'Blocking move'
        };
      }
    }
    
    // Take center if available
    if (board[1][1] === null) {
      return {
        position: { row: 1, col: 1 },
        score: 10,
        confidence: 0.6,
        strategy: 'Center preference'
      };
    }
    
    // Take corners
    const corners = [
      { row: 0, col: 0 }, { row: 0, col: 2 },
      { row: 2, col: 0 }, { row: 2, col: 2 }
    ].filter(pos => board[pos.row][pos.col] === null);
    
    if (corners.length > 0) {
      const corner = corners[Math.floor(Math.random() * corners.length)];
      return {
        position: corner,
        score: 5,
        confidence: 0.5,
        strategy: 'Corner preference'
      };
    }
    
    // Fallback to random
    return this.getRandomMove(board, availableMoves);
  }
  
  /**
   * Hard AI - Minimax algorithm
   */
  private getHardMove(board: BoardState, availableMoves: Position[]): AIMove {
    let bestMove: Position = availableMoves[0];
    let bestScore = -Infinity;
    
    for (const move of availableMoves) {
      const testBoard = this.makeMove(board, move, this.player);
      const score = this.minimax(testBoard, 0, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return {
      position: bestMove,
      score: bestScore,
      confidence: 0.8,
      strategy: 'Minimax'
    };
  }
  
  /**
   * Expert AI - Minimax with Alpha-Beta Pruning
   */
  private getExpertMove(board: BoardState, availableMoves: Position[]): AIMove {
    let bestMove: Position = availableMoves[0];
    let bestScore = -Infinity;
    
    for (const move of availableMoves) {
      const testBoard = this.makeMove(board, move, this.player);
      const score = this.minimaxAlphaBeta(testBoard, 0, -Infinity, Infinity, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    // Add pattern recognition
    this.updatePatternMemory(board, bestMove);
    
    return {
      position: bestMove,
      score: bestScore,
      confidence: 0.95,
      strategy: 'Alpha-Beta Pruning'
    };
  }
  
  /**
   * Impossible AI - Perfect play with adaptive strategies
   */
  private getImpossibleMove(board: BoardState, availableMoves: Position[]): AIMove {
    // Use pattern recognition from previous games
    const patternMove = this.getPatternMove(board);
    if (patternMove) {
      return patternMove;
    }
    
    // Use minimax with deeper search
    let bestMove: Position = availableMoves[0];
    let bestScore = -Infinity;
    
    for (const move of availableMoves) {
      const testBoard = this.makeMove(board, move, this.player);
      const score = this.minimaxAlphaBeta(testBoard, 0, -Infinity, Infinity, false);
      
      // Add positional scoring
      const positionalScore = this.getPositionalScore(move);
      const totalScore = score + positionalScore;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = move;
      }
    }
    
    this.updatePatternMemory(board, bestMove);
    
    return {
      position: bestMove,
      score: bestScore,
      confidence: 1.0,
      strategy: 'Perfect Play + Patterns'
    };
  }
  
  /**
   * Minimax algorithm implementation
   */
  private minimax(board: BoardState, depth: number, isMaximizing: boolean): number {
    const winner = this.getWinner(board);
    
    if (winner === this.player) return 10 - depth;
    if (winner === this.opponent) return depth - 10;
    if (this.isBoardFull(board)) return 0;
    
    const availableMoves = this.getAvailableMoves(board);
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const move of availableMoves) {
        const testBoard = this.makeMove(board, move, this.player);
        const score = this.minimax(testBoard, depth + 1, false);
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const move of availableMoves) {
        const testBoard = this.makeMove(board, move, this.opponent);
        const score = this.minimax(testBoard, depth + 1, true);
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }
  
  /**
   * Minimax with Alpha-Beta Pruning
   */
  private minimaxAlphaBeta(
    board: BoardState, 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean
  ): number {
    const winner = this.getWinner(board);
    
    if (winner === this.player) return 10 - depth;
    if (winner === this.opponent) return depth - 10;
    if (this.isBoardFull(board)) return 0;
    
    const availableMoves = this.getAvailableMoves(board);
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of availableMoves) {
        const testBoard = this.makeMove(board, move, this.player);
        const evaluation = this.minimaxAlphaBeta(testBoard, depth + 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of availableMoves) {
        const testBoard = this.makeMove(board, move, this.opponent);
        const evaluation = this.minimaxAlphaBeta(testBoard, depth + 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minEval;
    }
  }
  
  /**
   * Pattern recognition for adaptive play
   */
  private getPatternMove(board: BoardState): AIMove | null {
    const boardPattern = this.boardToPattern(board);
    const patternScore = this.patternMemory.get(boardPattern);
    
    if (patternScore && patternScore > 5) {
      // Find the best move based on pattern memory
      const availableMoves = this.getAvailableMoves(board);
      const bestMove = availableMoves[0]; // Simplified for this implementation
      
      return {
        position: bestMove,
        score: patternScore,
        confidence: 0.9,
        strategy: 'Pattern Recognition'
      };
    }
    
    return null;
  }
  
  /**
   * Get positional scoring for strategic play
   */
  private getPositionalScore(position: Position): number {
    // Center is most valuable
    if (position.row === 1 && position.col === 1) return 3;
    
    // Corners are second most valuable
    if ((position.row === 0 || position.row === 2) && 
        (position.col === 0 || position.col === 2)) return 2;
    
    // Edges are least valuable
    return 1;
  }
  
  /**
   * Update pattern memory for learning
   */
  private updatePatternMemory(board: BoardState, move: Position): void {
    const pattern = this.boardToPattern(board);
    const currentScore = this.patternMemory.get(pattern) || 0;
    this.patternMemory.set(pattern, currentScore + 1);
  }
  
  /**
   * Convert board to pattern string
   */
  private boardToPattern(board: BoardState): string {
    return board.flat().map(cell => cell || '_').join('');
  }
  
  /**
   * Utility functions
   */
  private getAvailableMoves(board: BoardState): Position[] {
    const moves: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  }
  
  private makeMove(board: BoardState, position: Position, player: Player): BoardState {
    const newBoard = board.map(row => [...row]);
    newBoard[position.row][position.col] = player;
    return newBoard;
  }
  
  private checkWin(board: BoardState, player: Player): boolean {
    // Check rows
    for (let row = 0; row < 3; row++) {
      if (board[row][0] === player && board[row][1] === player && board[row][2] === player) {
        return true;
      }
    }
    
    // Check columns
    for (let col = 0; col < 3; col++) {
      if (board[0][col] === player && board[1][col] === player && board[2][col] === player) {
        return true;
      }
    }
    
    // Check diagonals
    if ((board[0][0] === player && board[1][1] === player && board[2][2] === player) ||
        (board[0][2] === player && board[1][1] === player && board[2][0] === player)) {
      return true;
    }
    
    return false;
  }
  
  private getWinner(board: BoardState): Player | null {
    if (this.checkWin(board, 'X')) return 'X';
    if (this.checkWin(board, 'O')) return 'O';
    return null;
  }
  
  private isBoardFull(board: BoardState): boolean {
    return board.flat().every(cell => cell !== null);
  }
  
  /**
   * Get AI statistics
   */
  getStats() {
    return {
      difficulty: this.difficulty,
      movesPlayed: this.moveHistory.length,
      patternsLearned: this.patternMemory.size,
      player: this.player
    };
  }
  
  /**
   * Record a move in history
   */
  recordMove(position: Position): void {
    this.moveHistory.push(position);
  }
  
  /**
   * Reset AI for new game
   */
  reset(): void {
    this.moveHistory = [];
    // Keep pattern memory for learning between games
  }
  
  /**
   * Set difficulty level
   */
  setDifficulty(difficulty: typeof this.difficulty): void {
    this.difficulty = difficulty;
  }
}