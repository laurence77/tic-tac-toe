/**
 * Advanced Game Feel System for Tic-Tac-Toe
 * Implements cutting-edge juice techniques and visual enhancements
 */
export class GameFeelManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }
  
  /**
   * Subtle screen shake for moves and wins
   */
  screenShake(intensity: number = 5, duration: number = 100): void {
    if (this.camera.isShaking) return;
    
    this.camera.shake(duration, intensity * 0.005, false);
  }
  
  /**
   * Cell highlight effect on hover
   */
  highlightCell(x: number, y: number, cellSize: number, color: number = 0xffffff, alpha: number = 0.1): Phaser.GameObjects.Rectangle {
    const highlight = this.scene.add.rectangle(x, y, cellSize * 0.9, cellSize * 0.9, color, alpha);
    highlight.setStrokeStyle(2, color, 0.3);
    
    // Subtle pulse animation
    this.scene.tweens.add({
      targets: highlight,
      alpha: alpha * 2,
      scale: 1.05,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    return highlight;
  }
  
  /**
   * Mark placement animation with anticipation
   */
  async placeMark(x: number, y: number, mark: string, color: number, size: number = 64): Promise<Phaser.GameObjects.Text> {
    // Anticipation - slight scale down first
    const text = this.scene.add.text(x, y, mark, {
      fontSize: `${size}px`,
      color: Phaser.Display.Color.IntegerToColorObject(color).rgba,
      fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.1).setAlpha(0);
    
    // Pop in animation
    this.scene.tweens.add({
      targets: text,
      scale: 1.3,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut'
    });
    
    // Settle animation
    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 200,
      delay: 150,
      ease: 'Elastic.easeOut'
    });
    
    // Particle burst
    this.createMarkParticles(x, y, color);
    
    return text;
  }
  
  /**
   * Create particles when placing marks
   */
  private createMarkParticles(x: number, y: number, color: number): void {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(30, 60);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.8);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: 0.5,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }
  
  /**
   * Winning line animation
   */
  animateWinningLine(startX: number, startY: number, endX: number, endY: number, color: number = 0x00ff00): void {
    const line = this.scene.add.graphics();
    line.lineStyle(6, color, 1);
    line.lineBetween(startX, startY, startX, startY);
    
    // Animate line drawing
    let progress = 0;
    const tween = this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: 500,
      ease: 'Power2',
      onUpdate: () => {
        const currentProgress = tween.getValue();
        const currentEndX = startX + (endX - startX) * currentProgress;
        const currentEndY = startY + (endY - startY) * currentProgress;
        
        line.clear();
        line.lineStyle(6, color, 1);
        line.lineBetween(startX, startY, currentEndX, currentEndY);
      }
    });
    
    // Glow effect
    this.scene.tweens.add({
      targets: line,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 2,
      delay: 500
    });
  }
  
  /**
   * Victory celebration effect
   */
  victoryEffect(winner: string, color: number): void {
    // Screen flash
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color, 0.3
    );
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    
    // Confetti burst
    this.createConfetti(color);
    
    // Camera punch
    this.cameraPunch(1.02, 200);
    
    // Screen shake
    this.screenShake(8, 200);
  }
  
  /**
   * Create confetti particles
   */
  private createConfetti(primaryColor: number): void {
    const colors = [primaryColor, 0xffd700, 0xff6b6b, 0x4ecdc4, 0xffe66d];
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(100, 200);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 50; // Slight upward bias
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(4, 8);
      const particle = this.scene.add.rectangle(centerX, centerY, size, size, color);
      
      // Rotation
      particle.setRotation(Math.random() * Math.PI * 2);
      
      this.scene.tweens.add({
        targets: particle,
        x: centerX + vx,
        y: centerY + vy + 300, // Gravity effect
        rotation: particle.rotation + Math.PI * 4,
        alpha: 0,
        duration: Phaser.Math.Between(800, 1200),
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }
  
  /**
   * Camera punch effect
   */
  cameraPunch(scale: number = 1.02, duration: number = 150): void {
    const originalZoom = this.camera.zoom;
    
    this.scene.tweens.add({
      targets: this.camera,
      zoom: originalZoom * scale,
      duration: duration * 0.3,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.camera.setZoom(originalZoom);
      }
    });
  }
  
  /**
   * Button press effect
   */
  buttonPress(button: Phaser.GameObjects.GameObject): void {
    this.scene.tweens.add({
      targets: button,
      scale: 0.95,
      duration: 50,
      yoyo: true,
      ease: 'Power2'
    });
  }
  
  /**
   * Hover effect for interactive elements
   */
  hoverEffect(target: Phaser.GameObjects.GameObject, scale: number = 1.05): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale: scale,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  /**
   * Unhover effect
   */
  unhoverEffect(target: Phaser.GameObjects.GameObject): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale: 1,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  /**
   * Draw animation
   */
  drawEffect(): void {
    // Neutral flash
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xffff00, 0.2
    );
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });
    
    // Subtle shake
    this.screenShake(4, 150);
  }
  
  /**
   * AI thinking indicator
   */
  createThinkingIndicator(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create dots
    const dots: Phaser.GameObjects.Circle[] = [];
    for (let i = 0; i < 3; i++) {
      const dot = this.scene.add.circle(i * 15 - 15, 0, 3, 0xffffff, 0.8);
      dots.push(dot);
      container.add(dot);
    }
    
    // Animate dots
    dots.forEach((dot, index) => {
      this.scene.tweens.add({
        targets: dot,
        alpha: 0.2,
        duration: 400,
        delay: index * 133,
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });
    });
    
    return container;
  }
  
  /**
   * Cell grid animation on game start
   */
  animateGridAppearance(cellPositions: { x: number; y: number }[], cellSize: number): void {
    cellPositions.forEach((pos, index) => {
      // Create temporary highlight for animation
      const highlight = this.scene.add.rectangle(pos.x, pos.y, cellSize * 0.9, cellSize * 0.9, 0xffffff, 0);
      highlight.setStrokeStyle(2, 0xffffff, 0);
      
      this.scene.tweens.add({
        targets: highlight,
        alpha: 0.1,
        strokeAlpha: 0.3,
        scale: 1.05,
        duration: 300,
        delay: index * 50,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Fade out
          this.scene.tweens.add({
            targets: highlight,
            alpha: 0,
            strokeAlpha: 0,
            scale: 1,
            duration: 200,
            onComplete: () => highlight.destroy()
          });
        }
      });
    });
  }
  
  /**
   * Score update animation
   */
  animateScoreUpdate(textObject: Phaser.GameObjects.Text, newValue: number): void {
    // Pulse effect
    this.scene.tweens.add({
      targets: textObject,
      scale: 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        textObject.setText(`${newValue}`);
      }
    });
    
    // Color flash
    const originalColor = textObject.style.color;
    textObject.setColor('#00ff00');
    
    this.scene.time.delayedCall(300, () => {
      textObject.setColor(originalColor);
    });
  }
}