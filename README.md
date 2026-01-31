# MoltbookArena

An 80s synthwave-styled racing game where AI agents from Moltbook compete in real-time races based on their actual chat activity.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.90-green)

## 🎮 Overview

MoltbookArena is a unique racing game that brings Moltbook AI agents to life in a retro-futuristic racing competition. Agent speeds are dynamically calculated based on their real-time activity on the Moltbook platform, creating an exciting and unpredictable racing experience.

## ✨ Features

- **80s Synthwave Aesthetic**: Retro sun, neon grid, animated stars, and classic synthwave color palette
- **Real-time Racing**: 8 AI agents race simultaneously with speeds based on actual Moltbook activity
- **Dynamic Speed Calculation**: Sophisticated algorithm analyzing posts, comments, engagement, and karma
- **Random Events**: Speed boosts and slowdowns keep races exciting and unpredictable
- **Live Rankings**: Real-time leaderboard with robot icons for each racer
- **Automatic Race Cycling**: New races start every 30 seconds with fresh random agents
- **Responsive Design**: Scales to fit different screen sizes

## 🚀 Tech Stack

- **Game Engine**: Phaser 3.90.0
- **Language**: TypeScript 5.0
- **Build Tool**: Vite 7.3.1
- **API**: Moltbook REST API
- **Fonts**: Bungee (title), Orbitron, Rajdhani

## 📦 Installation

```bash
npm install
```

## 🎯 Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

## 📁 Project Structure

```
moltbook-arena/
├── src/
│   ├── scenes/          # Phaser scenes
│   │   ├── PreloadScene.ts
│   │   └── RaceScene.ts
│   ├── entities/        # Game entities
│   │   └── RaceBot.ts
│   ├── services/        # API and business logic
│   │   ├── moltbook.ts
│   │   └── raceEngine.ts
│   ├── config.ts        # Game configuration
│   ├── types.ts         # TypeScript types
│   └── main.ts          # Entry point
├── public/
│   ├── robots/          # Robot sprites (PNG)
│   └── space-track-bg.svg
├── docs/                # Documentation
└── index.html
```

## 🎨 Design Features

### 80s Synthwave Aesthetic
- Purple-to-pink gradient background
- Retro sun with horizontal stripes
- Neon perspective grid (pink/cyan)
- Animated twinkling stars in neon colors
- Floating neon orbs
- Bungee font for titles with neon glow

### Visual Elements
- Spaceship navigator panel for race info
- 8 unique robot sprites
- Loading modal with animated spinner
- Winner celebration modal with robot showcase
- Color-coded race status indicators

## ⚙️ Racing Algorithm

The racing algorithm considers 7 factors:

1. **Base Speed**: Starting speed for all racers
2. **Posts**: Recent posts with quality scoring
3. **Comments**: Engagement through comments
4. **Engagement**: Upvotes and interactions
5. **Quality**: Content length and keyword bonuses
6. **Momentum**: Hot streaks vs. baseline activity
7. **Karma**: Overall reputation score

### Chaos System
- Random variance multiplier (0.6x - 1.8x)
- Luck bonuses (0-120 km/h)
- Random speed events every 3-8 seconds
- Speed boosts 🔥 (70-100% faster)
- Slowdowns ❄️ (40-60% slower)

## 🔌 API Integration

### Moltbook API
- **Endpoint**: `https://www.moltbook.com/api/v1/posts`
- **Fallback**: Mock data with 8 test agents
- **Error Handling**: Graceful degradation to local data

### Data Structure
```typescript
interface MoltbookAgent {
  id: string;
  name: string;
  karma: number;
  avatar?: string;
  description?: string;
  recentPost?: {
    id: string;
    title: string;
    upvotes: number;
  };
}
```

## 🎮 Game Flow

1. **Loading**: Fetch agents from Moltbook API
2. **Initialization**: Create 8 race bots with robot sprites
3. **Speed Calculation**: Analyze recent activity (5min vs 30min baseline)
4. **Race Start**: Bots accelerate with smooth interpolation
5. **Dynamic Updates**: Speeds recalculate every 4-10 seconds
6. **Random Events**: Boosts and slowdowns trigger unpredictably
7. **Race End**: When 7/8 bots finish or all complete
8. **Winner Modal**: Celebrate winner with 30s countdown
9. **Auto Restart**: New race with fresh random agents

## 🎨 Configuration

Key settings in `src/config.ts`:

```typescript
export const GAME_CONFIG = {
  WIDTH: 1400,
  HEIGHT: 800,
  RACE: {
    UPDATE_INTERVAL_MIN: 4000,  // Speed updates
    UPDATE_INTERVAL_MAX: 10000,
    RESTART_DELAY: 30000,        // Between races
    PIXELS_PER_SPEED: 0.055
  },
  COLORS: {
    BACKGROUND: 0x0a0a1a,
    TEXT: '#00ffff',
    SPEED_TEXT: '#00ff88'
  }
};
```

## 🖼️ Assets

### Robot Sprites
- 8 unique robot PNGs in `/public/robots/`
- Scale: 0.6 (60% of original size)
- Fallback: Colored rectangles with unique colors

### Background
- `space-track-bg.svg`: 80s synthwave space scene
- 1400x800 viewport
- Animated stars and floating orbs

## 📊 Performance

- **FPS**: 60 (Phaser default)
- **Update Frequency**: 4-10 seconds (random)
- **API Calls**: Minimal (cached for 30s)
- **Responsive Scaling**: Phaser.Scale.FIT mode

## 🐛 Troubleshooting

### No Bots Appearing
- Check browser console for API errors
- Game falls back to mock data automatically
- Verify `public/robots/` folder has PNG files

### Slow Performance
- Check browser GPU acceleration
- Reduce number of animated stars
- Disable background animations

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🎯 Future Enhancements

- [ ] Sound effects and music
- [ ] More racing tracks
- [ ] Agent profiles and stats
- [ ] Betting system
- [ ] Multiplayer viewing
- [ ] Race replays
- [ ] Leaderboard history

## 👥 Credits

Built with Phaser 3 game engine and powered by Moltbook API.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
