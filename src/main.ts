import Phaser from 'phaser';

const WIDTH = 600;
const HEIGHT = 600;

type Player = 'X' | 'O';
type BoardState = (Player | null)[][];

class TicTacToeScene extends Phaser.Scene {
  private board: BoardState = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];
  private currentPlayer: Player = 'X';
  private gameOver = false;

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // Draw game board
    this.drawBoard();
    
    // Add click handler
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer.x, pointer.y);
    });

    // Add title
    this.add.text(WIDTH / 2, 50, 'Tic-Tac-Toe', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add current player indicator
    this.add.text(WIDTH / 2, HEIGHT - 50, `Current Player: ${this.currentPlayer}`, {
      fontSize: '24px',
      color: '#fbbf24'
    }).setOrigin(0.5);
  }

  private drawBoard() {
    const cellSize = 150;
    const startX = (WIDTH - cellSize * 3) / 2;
    const startY = (HEIGHT - cellSize * 3) / 2;

    // Draw grid lines
    for (let i = 0; i <= 3; i++) {
      // Vertical lines
      this.add.rectangle(startX + i * cellSize, startY + cellSize * 1.5, 4, cellSize * 3, 0xffffff);
      // Horizontal lines
      this.add.rectangle(startX + cellSize * 1.5, startY + i * cellSize, cellSize * 3, 4, 0xffffff);
    }

    // Draw board state
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;
        
        if (this.board[row][col]) {
          this.add.text(x, y, this.board[row][col]!, {
            fontSize: '64px',
            color: this.board[row][col] === 'X' ? '#ff6b6b' : '#4ecdc4'
          }).setOrigin(0.5);
        }
      }
    }
  }

  private handleClick(x: number, y: number) {
    if (this.gameOver) return;

    const cellSize = 150;
    const startX = (WIDTH - cellSize * 3) / 2;
    const startY = (HEIGHT - cellSize * 3) / 2;

    const col = Math.floor((x - startX) / cellSize);
    const row = Math.floor((y - startY) / cellSize);

    if (row >= 0 && row < 3 && col >= 0 && col < 3 && this.board[row][col] === null) {
      this.board[row][col] = this.currentPlayer;
      
      // Check for win
      if (this.checkWin()) {
        this.gameOver = true;
        this.showWinMessage(this.currentPlayer);
      } else if (this.checkDraw()) {
        this.gameOver = true;
        this.showDrawMessage();
      } else {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      }

      // Redraw the scene
      this.scene.restart();
    }
  }

  private checkWin(): boolean {
    // Check rows
    for (let row = 0; row < 3; row++) {
      if (this.board[row][0] && 
          this.board[row][0] === this.board[row][1] && 
          this.board[row][1] === this.board[row][2]) {
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      if (this.board[0][col] && 
          this.board[0][col] === this.board[1][col] && 
          this.board[1][col] === this.board[2][col]) {
        return true;
      }
    }

    // Check diagonals
    if (this.board[0][0] && 
        this.board[0][0] === this.board[1][1] && 
        this.board[1][1] === this.board[2][2]) {
      return true;
    }

    if (this.board[0][2] && 
        this.board[0][2] === this.board[1][1] && 
        this.board[1][1] === this.board[2][0]) {
      return true;
    }

    return false;
  }

  private checkDraw(): boolean {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.board[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  private showWinMessage(winner: Player) {
    this.add.text(WIDTH / 2, HEIGHT - 100, `Player ${winner} Wins!`, {
      fontSize: '28px',
      color: '#00ff00'
    }).setOrigin(0.5);
  }

  private showDrawMessage() {
    this.add.text(WIDTH / 2, HEIGHT - 100, "It's a Draw!", {
      fontSize: '28px',
      color: '#ffff00'
    }).setOrigin(0.5);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scene: TicTacToeScene
};

new Phaser.Game(config);