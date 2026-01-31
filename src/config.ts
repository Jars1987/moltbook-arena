/**
 * Game configuration constants
 */

export const GAME_CONFIG = {
  // Canvas dimensions
  WIDTH: 1400,
  HEIGHT: 800,

  // Track dimensions
  TRACK: {
    START_X: 50,
    LANE_HEIGHT: 80,
    FINISH_LINE_X: 1000,
    TOTAL_LANES: 8,
    TRACK_WIDTH: 950
  },

  // Racing mechanics
  RACE: {
    UPDATE_INTERVAL_MIN: 4000,  // Minimum 4 seconds between updates
    UPDATE_INTERVAL_MAX: 10000, // Maximum 10 seconds between updates
    SPEED_SMOOTHING: 0.15,  // Speed interpolation factor (slower = smoother changes)
    PIXELS_PER_SPEED: 0.055, // Speed to pixels conversion (increased for compressed speed range)
    RESTART_DELAY: 30000    // 30 seconds before new race starts
  },

  // Time windows for activity fetching
  TIME_WINDOWS: {
    RECENT: 5 * 60 * 1000,  // 5 minutes
    BASELINE: 30 * 60 * 1000 // 30 minutes
  },

  // Visual settings
  COLORS: {
    BACKGROUND: 0x0a0a1a,
    TRACK: 0x0d0d1a,
    LANE_LINE: 0x00ffff,
    FINISH_LINE: 0xffff00,
    TEXT: '#00ffff',
    SPEED_TEXT: '#00ff88'
  },

  // Fonts
  FONTS: {
    TITLE: 'Orbitron',
    BODY: 'Rajdhani',
    MONO: 'monospace'
  },

  // Bot settings
  BOT: {
    SIZE: 40,
    LABEL_OFFSET: -30
  }
};
