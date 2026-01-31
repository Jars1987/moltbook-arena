/**
 * RaceBot - Represents a racing agent in the game
 */

import Phaser from 'phaser';
import type { MoltbookAgent, SpeedCalculation } from '../types';
import { GAME_CONFIG } from '../config';

export class RaceBot extends Phaser.GameObjects.Container {
  public agent: MoltbookAgent;
  public currentSpeed: number = 0;
  public targetSpeed: number = 0;
  public distance: number = 0;
  public finished: boolean = false;
  public finishTime: number = 0;
  public finishOrder: number = -1; // -1 means not finished, 1+ means finish position
  public laneIndex: number = 0;
  public robotKey: string = '';

  private botSprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private speedText: Phaser.GameObjects.Text;

  // Random speed events
  private speedModifier: number = 1.0;
  private modifierEndTime: number = 0;
  private lastEventCheck: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    agent: MoltbookAgent,
    laneIndex: number
  ) {
    super(scene, x, y);

    this.agent = agent;
    this.laneIndex = laneIndex;

    // Create bot visual using robot sprite
    const robotKey = `robot${(laneIndex % 8) + 1}`;
    this.robotKey = robotKey;

    try {
      // Try to load robot image
      if (scene.textures.exists(robotKey)) {
        const robotSprite = scene.add.image(0, 0, robotKey);
        robotSprite.setScale(0.6); // Reduced to 75% of previous size (0.8 * 0.75 = 0.6)
        this.botSprite = robotSprite as any;
        this.add(this.botSprite); // Add to container!
      } else {
        // Fallback to colored rectangle
        const colors = [0xff0844, 0x00ff88, 0x00d4ff, 0xdd00ff, 0xffd700, 0x444444, 0x00ffff, 0xff00ff];
        const botColor = colors[laneIndex % 8];
        const rect = scene.add.rectangle(0, 0, 38, 38, botColor); // Also reduced rectangle size
        this.botSprite = rect as any;
        this.add(this.botSprite); // Add to container!
      }
    } catch (e) {
      // Fallback to colored rectangle
      const colors = [0xff0844, 0x00ff88, 0x00d4ff, 0xdd00ff, 0xffd700, 0x444444, 0x00ffff, 0xff00ff];
      const botColor = colors[laneIndex % 8];
      const rect = scene.add.rectangle(0, 0, 38, 38, botColor); // Also reduced rectangle size
      this.botSprite = rect as any;
      this.add(this.botSprite); // Add to container!
    }

    // Agent name label
    this.nameText = scene.add.text(
      0,
      GAME_CONFIG.BOT.LABEL_OFFSET,
      agent.name,
      {
        fontSize: '13px',
        color: GAME_CONFIG.COLORS.TEXT,
        fontFamily: GAME_CONFIG.FONTS.BODY,
        fontStyle: 'bold'
      }
    );
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Speed indicator
    this.speedText = scene.add.text(
      0,
      GAME_CONFIG.BOT.SIZE / 2 + 15,
      '0 km/h',
      {
        fontSize: '11px',
        color: GAME_CONFIG.COLORS.SPEED_TEXT,
        fontFamily: GAME_CONFIG.FONTS.MONO
      }
    );
    this.speedText.setOrigin(0.5, 0.5);
    this.add(this.speedText);

    scene.add.existing(this);
  }

  /**
   * Update bot speed from activity calculation
   */
  updateSpeed(calculation: SpeedCalculation): void {
    this.targetSpeed = calculation.finalSpeed;
  }

  /**
   * Update bot position each frame
   */
  update(delta: number): void {
    if (this.finished) return;

    const now = Date.now();

    // Random speed events (every 3-8 seconds, check for new event)
    if (now - this.lastEventCheck > 3000 + Math.random() * 5000) {
      this.lastEventCheck = now;
      this.triggerRandomEvent(now);
    }

    // Clear expired modifier
    if (this.speedModifier !== 1.0 && now > this.modifierEndTime) {
      this.speedModifier = 1.0;
      this.botSprite.clearTint();
    }

    // Smooth speed interpolation
    this.currentSpeed = Phaser.Math.Linear(
      this.currentSpeed,
      this.targetSpeed * this.speedModifier,
      GAME_CONFIG.RACE.SPEED_SMOOTHING
    );

    // Move forward based on current speed
    const movement = (this.currentSpeed * GAME_CONFIG.RACE.PIXELS_PER_SPEED * delta) / 1000;
    this.x += movement;
    this.distance += movement;

    // Update speed display
    const displaySpeed = Math.round(this.currentSpeed);
    const modifier = this.speedModifier > 1 ? '🔥' : this.speedModifier < 1 ? '❄️' : '';
    this.speedText.setText(`${displaySpeed} km/h ${modifier}`);

    // Check if finished
    if (this.x >= GAME_CONFIG.TRACK.FINISH_LINE_X && !this.finished) {
      this.finish();
    }
  }

  /**
   * Trigger random speed boost or slowdown
   */
  private triggerRandomEvent(now: number): void {
    // 40% chance of an event happening
    if (Math.random() > 0.4) return;

    const eventType = Math.random();

    if (eventType < 0.5) {
      // SPEED BOOST! (70-100% faster for 3-6 seconds)
      this.speedModifier = 1.7 + Math.random() * 0.3;
      this.modifierEndTime = now + 3000 + Math.random() * 3000;
      this.botSprite.setTint(0xff6600); // Bright orange glow
    } else {
      // SLOWDOWN (40-60% slower for 3-5 seconds)
      this.speedModifier = 0.4 + Math.random() * 0.2;
      this.modifierEndTime = now + 3000 + Math.random() * 2000;
      this.botSprite.setTint(0x6699ff); // Blue tint
    }
  }

  /**
   * Mark bot as finished
   */
  private finish(): void {
    this.finished = true;
    this.finishTime = Date.now();
    this.currentSpeed = 0;
    this.targetSpeed = 0;

    // Visual feedback - gold glow
    this.botSprite.setTint(0xffd700);
    this.speedText.setText('FINISH! ✓');
  }

  /**
   * Generate color based on karma (higher karma = brighter)
   */
  private getColorFromKarma(karma: number): number {
    const hue = (karma % 360) / 360;
    const saturation = 0.8;
    const lightness = 0.4 + (Math.min(karma, 5000) / 5000) * 0.3;

    return Phaser.Display.Color.HSLToColor(hue, saturation, lightness).color;
  }
}
