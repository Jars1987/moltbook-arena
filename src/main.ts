/**
 * MoltbookArena - Main entry point
 * Racing game powered by real Moltbook agent activity
 */

import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { RaceScene } from './scenes/RaceScene';
import { GAME_CONFIG } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
  },
  scene: [PreloadScene, RaceScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

// Initialize game
const game = new Phaser.Game(config);
