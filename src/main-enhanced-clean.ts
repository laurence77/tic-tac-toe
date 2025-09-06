import Phaser from 'phaser';
import { AdvancedAIPlayer, Player, BoardState } from './systems/AdvancedAI';
import { GameFeelManager } from './systems/GameFeel';
import { TournamentSystem, Tournament } from './systems/TournamentSystem';
import { PerformanceMonitor } from './systems/PerformanceMonitor';

const WIDTH = 800;
const HEIGHT = 700;

class EnhancedTicTacToeScene extends Phaser.Scene {
  private board: BoardState = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];
  private currentPlayer: Player = 'X';
  private gameOver = false;
  private gameMode: 'PvP' | 'PvAI' | 'AIvAI' | 'Tournament' = 'PvAI';
  
  private cellSize = 140;
  private boardStartX = 0;
  private boardStartY = 0;
  
  private gameFeelManager!: GameFeelManager;
  private aiPlayer!: AdvancedAIPlayer;
  private tournamentSystem!: TournamentSystem;
  private performanceMonitor!: PerformanceMonitor;
  
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private cellHighlights: Phaser.GameObjects.Rectangle[] = [];
  private markTexts: Phaser.GameObjects.Text[][] = [];
  private uiElements: { [key: string]: Phaser.GameObjects.GameObject } = {};
  private thinkingIndicator?: Phaser.GameObjects.Container;
  
  private showPerformanceMetrics = false;
  private currentTournament?: Tournament;
  private scores = { X: 0, O: 0, draws: 0 };
  private aiDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Impossible' = 'Hard';
  
  private isProcessingMove = false;
  private moveHistory: { player: Player; position: { row: number; col: number }; timestamp: Date }[] = [];
  
  init() {
    this.boardStartX = (WIDTH - this.cellSize * 3) / 2;
    this.boardStartY = 150;
  }
  
  create() {
    this.initializeSystems();
    this.setupVisuals();
    this.setupUI();
    this.setupInput();
    this.newGame();
  }
  
  private initializeSystems(): void {
    this.gameFeelManager = new GameFeelManager(this);
    this.aiPlayer = new AdvancedAIPlayer('O', this.aiDifficulty);
    this.tournamentSystem = new TournamentSystem();
    this.performanceMonitor = new PerformanceMonitor();
    
    this.performanceMonitor.addListener((metrics) => {
      this.updatePerformanceDisplay(metrics);
    });
  }
  
  private setupVisuals(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.boardGraphics = this.add.graphics();
    
    for (let row = 0; row < 3; row++) {
      this.markTexts[row] = [];
      for (let col = 0; col < 3; col++) {
        this.markTexts[row][col] = this.add.text(0, 0, '', {
          fontSize: '64px',
          color: '#ffffff'
        }).setOrigin(0.5).setVisible(false);
      }
    }
  }
  
  private setupUI(): void {
    this.uiElements.title = this.add.text(WIDTH / 2, 30, 'Enhanced Tic-Tac-Toe', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiElements.currentPlayerText = this.add.text(WIDTH / 2, 70, '', {
      fontSize: '20px',
      color: '#fbbf24'
    }).setOrigin(0.5);
    
    this.createGameModeSelector();
    this.createAIDifficultySelector();
    this.createScoreDisplay();
    
    this.uiElements.performanceText = this.add.text(WIDTH - 10, 10, '', {
      fontSize: '10px',
      color: '#888888'
    }).setOrigin(1, 0).setVisible(false);
    
    this.uiElements.instructions = this.add.text(WIDTH / 2, HEIGHT - 30, 
      'Click cells to play | P: Performance | N: New Game', {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);
  }
  
  private createGameModeSelector(): void {
    const modes = ['PvP', 'PvAI', 'AIvAI'];
    const startX = 150;
    const y = 110;
    
    modes.forEach((mode, index) => {
      const button = this.add.rectangle(
        startX + index * 100, y, 90, 30,
        mode === this.gameMode ? 0x4ecdc4 : 0x333333
      ).setStrokeStyle(1, 0x666666);
      
      const text = this.add.text(startX + index * 100, y, mode, {
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      button.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setGameMode(mode as any))
        .on('pointerover', () => this.gameFeelManager.hoverEffect(button, 1.1))
        .on('pointerout', () => this.gameFeelManager.unhoverEffect(button));
      
      this.uiElements[`mode_${mode}`] = button;
    });
  }
  
  private createAIDifficultySelector(): void {
    const difficulties: Array<'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Impossible'> = 
      ['Easy', 'Medium', 'Hard', 'Expert', 'Impossible'];
    const startX = 200;
    const y = 150;
    
    difficulties.forEach((diff, index) => {
      const button = this.add.rectangle(
        startX + index * 80, y, 70, 25,
        diff === this.aiDifficulty ? 0xff6b6b : 0x333333
      ).setStrokeStyle(1, 0x666666);
      
      const text = this.add.text(startX + index * 80, y, diff, {
        fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      button.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setAIDifficulty(diff))
        .on('pointerover', () => this.gameFeelManager.hoverEffect(button, 1.1))
        .on('pointerout', () => this.gameFeelManager.unhoverEffect(button));
      
      this.uiElements[`diff_${diff}`] = button;
    });
  }
  
  private createScoreDisplay(): void {
    const y = HEIGHT - 80;
    
    this.uiElements.scoreBG = this.add.rectangle(WIDTH / 2, y, 300, 40, 0x333333, 0.8)
      .setStrokeStyle(1, 0x666666);
    
    this.uiElements.scoreX = this.add.text(WIDTH / 2 - 80, y, 'X: 0', {
      fontSize: '16px',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiElements.scoreO = this.add.text(WIDTH / 2, y, 'O: 0', {
      fontSize: '16px',
      color: '#4ecdc4',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiElements.scoreDraw = this.add.text(WIDTH / 2 + 80, y, 'Draws: 0', {
      fontSize: '16px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
  
  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isProcessingMove) {
        this.handleBoardClick(pointer.x, pointer.y);
      }
    });
    
    this.input.keyboard.on('keydown-P', () => {
      this.showPerformanceMetrics = !this.showPerformanceMetrics;
      (this.uiElements.performanceText as Phaser.GameObjects.Text).setVisible(this.showPerformanceMetrics);
    });
    
    this.input.keyboard.on('keydown-N', () => {
      this.newGame();
    });
    
    this.setupBoardHoverEffects();
  }
  
  private setupBoardHoverEffects(): void {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellX = this.boardStartX + col * this.cellSize + this.cellSize / 2;
        const cellY = this.boardStartY + row * this.cellSize + this.cellSize / 2;
        
        const cellArea = this.add.rectangle(cellX, cellY, this.cellSize, this.cellSize, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        
        cellArea.on('pointerover', () => {
          if (!this.gameOver && this.board[row][col] === null && !this.isProcessingMove) {
            if (this.gameMode === 'PvP' || 
                (this.gameMode === 'PvAI' && this.currentPlayer === 'X')) {
              this.highlightCell(row, col, true);
            }
          }
        });
        
        cellArea.on('pointerout', () => {
          this.highlightCell(row, col, false);
        });
      }
    }
  }
  
  update(): void {
    this.performanceMonitor.update();
    
    if (!this.gameOver && !this.isProcessingMove) {
      if ((this.gameMode === 'PvAI' && this.currentPlayer === 'O') ||
          this.gameMode === 'AIvAI') {
        this.handleAIMove();
      }
    }
    
    this.performanceMonitor.setCustomMetric('gameMode', this.gameMode === 'Tournament' ? 1 : 0);
    this.performanceMonitor.setCustomMetric('aiDifficulty', this.getDifficultyValue());
    this.performanceMonitor.trackRenderCall();
    this.performanceMonitor.resetFrame();
  }
  
  private handleBoardClick(x: number, y: number): void {
    if (this.gameOver || this.isProcessingMove) return;
    
    const col = Math.floor((x - this.boardStartX) / this.cellSize);
    const row = Math.floor((y - this.boardStartY) / this.cellSize);
    
    if (row >= 0 && row < 3 && col >= 0 && col < 3 && this.board[row][col] === null) {
      if (this.gameMode === 'PvP' || 
          (this.gameMode === 'PvAI' && this.currentPlayer === 'X')) {
        this.makeMove(row, col, this.currentPlayer);
      }
    }
  }
  
  private async handleAIMove(): Promise<void> {
    if (this.isProcessingMove) return;
    
    this.isProcessingMove = true;
    
    const cellX = WIDTH / 2;
    const cellY = this.boardStartY - 30;
    this.thinkingIndicator = this.gameFeelManager.createThinkingIndicator(cellX, cellY);
    
    const thinkingTime = this.getAIThinkingTime();
    
    await new Promise(resolve => {
      this.time.delayedCall(thinkingTime, resolve);
    });
    
    if (this.thinkingIndicator) {
      this.thinkingIndicator.destroy();
      this.thinkingIndicator = undefined;
    }
    
    try {
      const aiMove = this.aiPlayer.getBestMove(this.board);
      
      if (this.showPerformanceMetrics) {
        console.log('AI Analysis:', aiMove);
      }
      
      await this.makeMove(aiMove.position.row, aiMove.position.col, this.currentPlayer);
    } catch (error) {
      console.error('AI Move Error:', error);
    }
    
    this.isProcessingMove = false;
  }
  
  private getAIThinkingTime(): number {
    switch (this.aiDifficulty) {
      case 'Easy': return 200;
      case 'Medium': return 500;
      case 'Hard': return 800;
      case 'Expert': return 1200;
      case 'Impossible': return 1500;
      default: return 500;
    }
  }
  
  private async makeMove(row: number, col: number, player: Player): Promise<void> {
    if (this.board[row][col] !== null) return;
    
    this.board[row][col] = player;
    
    this.moveHistory.push({
      player,
      position: { row, col },
      timestamp: new Date()
    });
    
    await this.animateMarkPlacement(row, col, player);
    
    if (this.checkWin(player)) {
      await this.handleWin(player);
    } else if (this.checkDraw()) {
      await this.handleDraw();
    } else {
      this.switchPlayer();
    }
  }
  
  private async animateMarkPlacement(row: number, col: number, player: Player): Promise<void> {
    const cellX = this.boardStartX + col * this.cellSize + this.cellSize / 2;
    const cellY = this.boardStartY + row * this.cellSize + this.cellSize / 2;
    
    const color = player === 'X' ? 0xff6b6b : 0x4ecdc4;
    
    const markText = await this.gameFeelManager.placeMark(cellX, cellY, player, color, 64);
    this.markTexts[row][col] = markText;
    
    this.gameFeelManager.screenShake(3, 80);
  }
  
  private async handleWin(winner: Player): Promise<void> {
    this.gameOver = true;
    
    this.scores[winner]++;
    this.updateScoreDisplay();
    
    const winningLine = this.getWinningLine(winner);
    if (winningLine) {
      this.animateWinningLine(winningLine);
    }
    
    const color = winner === 'X' ? 0xff6b6b : 0x4ecdc4;
    this.gameFeelManager.victoryEffect(winner, color);
    
    await this.showWinMessage(winner);
    
    this.time.delayedCall(2000, () => {
      this.newGame();
    });
  }
  
  private async handleDraw(): Promise<void> {
    this.gameOver = true;
    
    this.scores.draws++;
    this.updateScoreDisplay();
    
    this.gameFeelManager.drawEffect();
    
    await this.showDrawMessage();
    
    this.time.delayedCall(1500, () => {
      this.newGame();
    });
  }
  
  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.updateUI();
    
    if (this.gameMode === 'AIvAI') {
      this.aiPlayer = new AdvancedAIPlayer(this.currentPlayer, this.aiDifficulty);
    }
  }
  
  private drawBoard(): void {
    this.boardGraphics.clear();
    
    this.boardGraphics.lineStyle(4, 0xffffff, 0.8);
    
    for (let i = 1; i < 3; i++) {
      const x = this.boardStartX + i * this.cellSize;
      this.boardGraphics.lineBetween(x, this.boardStartY, x, this.boardStartY + this.cellSize * 3);
    }
    
    for (let i = 1; i < 3; i++) {
      const y = this.boardStartY + i * this.cellSize;
      this.boardGraphics.lineBetween(this.boardStartX, y, this.boardStartX + this.cellSize * 3, y);
    }
    
    this.boardGraphics.strokeRoundedRect(
      this.boardStartX - 5, 
      this.boardStartY - 5, 
      this.cellSize * 3 + 10, 
      this.cellSize * 3 + 10, 
      10
    );
  }
  
  private highlightCell(row: number, col: number, show: boolean): void {
    const index = row * 3 + col;
    
    if (show && !this.cellHighlights[index]) {
      const cellX = this.boardStartX + col * this.cellSize + this.cellSize / 2;
      const cellY = this.boardStartY + row * this.cellSize + this.cellSize / 2;
      
      this.cellHighlights[index] = this.gameFeelManager.highlightCell(
        cellX, cellY, this.cellSize, 0xffffff, 0.1
      );
    } else if (!show && this.cellHighlights[index]) {
      this.cellHighlights[index].destroy();
      this.cellHighlights[index] = null as any;
    }
  }
  
  private checkWin(player: Player): boolean {
    for (let row = 0; row < 3; row++) {
      if (this.board[row].every(cell => cell === player)) {
        return true;
      }
    }
    
    for (let col = 0; col < 3; col++) {
      if (this.board.every(row => row[col] === player)) {
        return true;
      }
    }
    
    if (this.board[0][0] === player && this.board[1][1] === player && this.board[2][2] === player) {
      return true;
    }
    
    if (this.board[0][2] === player && this.board[1][1] === player && this.board[2][0] === player) {
      return true;
    }
    
    return false;
  }
  
  private checkDraw(): boolean {
    return this.board.flat().every(cell => cell !== null);
  }
  
  private getWinningLine(player: Player): { start: { x: number; y: number }; end: { x: number; y: number } } | null {
    for (let row = 0; row < 3; row++) {
      if (this.board[row].every(cell => cell === player)) {
        return {
          start: { 
            x: this.boardStartX + this.cellSize / 2, 
            y: this.boardStartY + row * this.cellSize + this.cellSize / 2 
          },
          end: { 
            x: this.boardStartX + 2.5 * this.cellSize, 
            y: this.boardStartY + row * this.cellSize + this.cellSize / 2 
          }
        };
      }
    }
    
    for (let col = 0; col < 3; col++) {
      if (this.board.every(row => row[col] === player)) {
        return {
          start: { 
            x: this.boardStartX + col * this.cellSize + this.cellSize / 2, 
            y: this.boardStartY + this.cellSize / 2 
          },
          end: { 
            x: this.boardStartX + col * this.cellSize + this.cellSize / 2, 
            y: this.boardStartY + 2.5 * this.cellSize 
          }
        };
      }
    }
    
    if (this.board[0][0] === player && this.board[1][1] === player && this.board[2][2] === player) {
      return {
        start: { x: this.boardStartX + this.cellSize / 2, y: this.boardStartY + this.cellSize / 2 },
        end: { x: this.boardStartX + 2.5 * this.cellSize, y: this.boardStartY + 2.5 * this.cellSize }
      };
    }
    
    if (this.board[0][2] === player && this.board[1][1] === player && this.board[2][0] === player) {
      return {
        start: { x: this.boardStartX + 2.5 * this.cellSize, y: this.boardStartY + this.cellSize / 2 },
        end: { x: this.boardStartX + this.cellSize / 2, y: this.boardStartY + 2.5 * this.cellSize }
      };
    }
    
    return null;
  }
  
  private animateWinningLine(line: { start: { x: number; y: number }; end: { x: number; y: number } }): void {
    const color = this.currentPlayer === 'X' ? 0xff6b6b : 0x4ecdc4;
    this.gameFeelManager.animateWinningLine(line.start.x, line.start.y, line.end.x, line.end.y, color);
  }
  
  private async showWinMessage(winner: Player): Promise<void> {
    const color = winner === 'X' ? '#ff6b6b' : '#4ecdc4';
    const message = this.add.text(WIDTH / 2, HEIGHT / 2 - 50, `Player ${winner} Wins!`, {
      fontSize: '36px',
      color,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({
      targets: message,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
  }
  
  private async showDrawMessage(): Promise<void> {
    const message = this.add.text(WIDTH / 2, HEIGHT / 2 - 50, "It's a Draw!", {
      fontSize: '36px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({
      targets: message,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
  }
  
  private setGameMode(mode: 'PvP' | 'PvAI' | 'AIvAI' | 'Tournament'): void {
    this.gameMode = mode;
    this.updateGameModeButtons();
    this.newGame();
  }
  
  private setAIDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Impossible'): void {
    this.aiDifficulty = difficulty;
    this.aiPlayer.setDifficulty(difficulty);
    this.updateAIDifficultyButtons();
  }
  
  private updateGameModeButtons(): void {
    const modes = ['PvP', 'PvAI', 'AIvAI'];
    modes.forEach(mode => {
      const button = this.uiElements[`mode_${mode}`] as Phaser.GameObjects.Rectangle;
      button.setFillStyle(mode === this.gameMode ? 0x4ecdc4 : 0x333333);
    });
  }
  
  private updateAIDifficultyButtons(): void {
    const difficulties = ['Easy', 'Medium', 'Hard', 'Expert', 'Impossible'];
    difficulties.forEach(diff => {
      const button = this.uiElements[`diff_${diff}`] as Phaser.GameObjects.Rectangle;
      button.setFillStyle(diff === this.aiDifficulty ? 0xff6b6b : 0x333333);
    });
  }
  
  private updateUI(): void {
    const playerText = this.gameMode === 'PvP' ? `Current Player: ${this.currentPlayer}` :
                      this.gameMode === 'PvAI' ? (this.currentPlayer === 'X' ? 'Your Turn' : 'AI Thinking...') :
                      this.gameMode === 'AIvAI' ? `AI ${this.currentPlayer} Turn` :
                      'Tournament Mode';
    
    (this.uiElements.currentPlayerText as Phaser.GameObjects.Text).setText(playerText);
  }
  
  private updateScoreDisplay(): void {
    (this.uiElements.scoreX as Phaser.GameObjects.Text).setText(`X: ${this.scores.X}`);
    (this.uiElements.scoreO as Phaser.GameObjects.Text).setText(`O: ${this.scores.O}`);
    (this.uiElements.scoreDraw as Phaser.GameObjects.Text).setText(`Draws: ${this.scores.draws}`);
  }
  
  private updatePerformanceDisplay(metrics: any): void {
    if (this.showPerformanceMetrics) {
      const text = [
        `FPS: ${metrics.fps}`,
        `Frame: ${metrics.frameTime}ms`,
        `Memory: ${metrics.memoryUsage}MB`,
        `Quality: ${metrics.qualityLevel}`,
        `Mode: ${this.gameMode}`,
        `AI: ${this.aiDifficulty}`
      ].join('\n');
      
      (this.uiElements.performanceText as Phaser.GameObjects.Text).setText(text);
    }
  }
  
  private getDifficultyValue(): number {
    const values = { Easy: 1, Medium: 2, Hard: 3, Expert: 4, Impossible: 5 };
    return values[this.aiDifficulty];
  }
  
  private newGame(): void {
    this.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.isProcessingMove = false;
    this.moveHistory = [];
    
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Text && child.text.match(/[XO]|Wins|Draw/)) {
        child.destroy();
      }
    });
    
    this.cellHighlights.forEach(highlight => {
      if (highlight) highlight.destroy();
    });
    this.cellHighlights = [];
    
    this.markTexts.forEach(row => {
      row.forEach(text => {
        if (text) text.setVisible(false);
      });
    });
    
    this.aiPlayer = new AdvancedAIPlayer('O', this.aiDifficulty);
    
    this.drawBoard();
    
    const cellPositions = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        cellPositions.push({
          x: this.boardStartX + col * this.cellSize + this.cellSize / 2,
          y: this.boardStartY + row * this.cellSize + this.cellSize / 2
        });
      }
    }
    
    this.gameFeelManager.animateGridAppearance(cellPositions, this.cellSize);
    this.updateUI();
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scene: EnhancedTicTacToeScene,
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true
  }
};

new Phaser.Game(config);