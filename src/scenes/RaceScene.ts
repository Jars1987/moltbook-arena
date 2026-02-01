/**
 * RaceScene - Main racing scene
 */

import Phaser from 'phaser';
import { RaceBot } from '../entities/RaceBot';
import { moltbookService } from '../services/moltbook';
import { raceEngine } from '../services/raceEngine';
import { GAME_CONFIG } from '../config';
import type { MoltbookAgent } from '../types';

export class RaceScene extends Phaser.Scene {
  private bots: RaceBot[] = [];
  private agents: MoltbookAgent[] = [];
  private lastUpdate: number = 0;
  private nextUpdateTime: number = 0;
  private raceStartTime: number = 0;
  private raceFinishTime: number = 0;
  private raceNumber: number = 1;
  private nextFinishOrder: number = 1; // Track the order bots finish
  private statusText!: Phaser.GameObjects.Text;
  private leaderboardContainer!: Phaser.GameObjects.Container;
  private leaderboardTitle!: Phaser.GameObjects.Text;
  private raceNumberText!: Phaser.GameObjects.Text;
  private resultsModal: Phaser.GameObjects.Container | null = null;
  private loadingModal: Phaser.GameObjects.Container | null = null;
  private countdownText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RaceScene' });
  }

  async create(): Promise<void> {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BACKGROUND);

    // Add track background image (if it exists)
    if (this.textures.exists('track-bg')) {
      const bg = this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'track-bg');
      bg.setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    }

    // Draw race track overlays (if needed)
    // this.drawTrack();

    // Main title - MOLTBOOK ARENA (positioned within cockpit viewport) - 80s STYLE
    const mainTitle = this.add.text(GAME_CONFIG.WIDTH / 2, 45, 'MOLTBOOK ARENA', {
      fontSize: '52px',
      color: '#ff00ff',
      fontFamily: 'Bungee',
      stroke: '#00ffff',
      strokeThickness: 3
    });
    mainTitle.setOrigin(0.5);

    // Add 80s neon glow effect to title
    mainTitle.setShadow(0, 0, '#ff00ff', 15, false, true);

    // Leaderboard area (positioned to the right of track)
    const leaderboardX = GAME_CONFIG.TRACK.START_X + GAME_CONFIG.TRACK.TRACK_WIDTH + 30;

    // Spaceship Navigator Panel UI
    const navGraphics = this.add.graphics();

    // Navigator panel background
    navGraphics.fillStyle(0x0a0a1a, 0.7);
    navGraphics.fillRoundedRect(leaderboardX - 10, 90, 360, 660, 8);

    // Panel border (metallic)
    navGraphics.lineStyle(2, 0x666666, 0.8);
    navGraphics.strokeRoundedRect(leaderboardX - 10, 90, 360, 660, 8);

    // Corner brackets (spaceship style)
    navGraphics.lineStyle(3, 0x00ffff, 0.9);
    // Top-left bracket
    navGraphics.beginPath();
    navGraphics.moveTo(leaderboardX - 10, 110);
    navGraphics.lineTo(leaderboardX - 10, 90);
    navGraphics.lineTo(leaderboardX + 10, 90);
    navGraphics.strokePath();
    // Top-right bracket
    navGraphics.beginPath();
    navGraphics.moveTo(leaderboardX + 340, 90);
    navGraphics.lineTo(leaderboardX + 350, 90);
    navGraphics.lineTo(leaderboardX + 350, 110);
    navGraphics.strokePath();
    // Bottom-left bracket
    navGraphics.beginPath();
    navGraphics.moveTo(leaderboardX - 10, 730);
    navGraphics.lineTo(leaderboardX - 10, 750);
    navGraphics.lineTo(leaderboardX + 10, 750);
    navGraphics.strokePath();
    // Bottom-right bracket
    navGraphics.beginPath();
    navGraphics.moveTo(leaderboardX + 340, 750);
    navGraphics.lineTo(leaderboardX + 350, 750);
    navGraphics.lineTo(leaderboardX + 350, 730);
    navGraphics.strokePath();

    // Status indicator lights
    navGraphics.fillStyle(0x00ff00, 0.8);
    navGraphics.fillCircle(leaderboardX + 320, 105, 4);
    navGraphics.fillStyle(0xffff00, 0.8);
    navGraphics.fillCircle(leaderboardX + 305, 105, 4);
    navGraphics.fillStyle(0xff0066, 0.8);
    navGraphics.fillCircle(leaderboardX + 290, 105, 4);

    // Horizontal divider line
    navGraphics.lineStyle(1, 0x00ffff, 0.3);
    navGraphics.beginPath();
    navGraphics.moveTo(leaderboardX, 155);
    navGraphics.lineTo(leaderboardX + 330, 155);
    navGraphics.strokePath();

    // Race number (above leaderboard)
    this.raceNumberText = this.add.text(leaderboardX + 15, 105, `RACE #${this.raceNumber}`, {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: GAME_CONFIG.FONTS.TITLE,
      fontStyle: 'bold'
    });

    // Status text (below race number)
    this.statusText = this.add.text(leaderboardX + 15, 135, 'Fetching agents...', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: GAME_CONFIG.FONTS.BODY
    });

    // Leaderboard title
    this.leaderboardTitle = this.add.text(
      leaderboardX + 15,
      180,
      '🏁 LIVE RANKINGS',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: GAME_CONFIG.FONTS.BODY,
        fontStyle: 'bold'
      }
    );

    // Leaderboard container with background
    const leaderboardBg = this.add.rectangle(
      leaderboardX + 165,
      170 + 275,
      330,
      550,
      0x000000,
      0.3
    );

    // Leaderboard container for dynamic content
    this.leaderboardContainer = this.add.container(leaderboardX + 15, 215);

    // Show loading modal and initialize race
    this.showLoadingModal();
    await this.initializeRace();
  }

  /**
   * Show loading modal with spinner
   */
  private showLoadingModal(): void {
    const modalWidth = 400;
    const modalHeight = 250;
    const modalX = GAME_CONFIG.WIDTH / 2;
    const modalY = GAME_CONFIG.HEIGHT / 2;

    this.loadingModal = this.add.container(modalX, modalY);

    // Background
    const bg = this.add.rectangle(0, 0, modalWidth, modalHeight, 0x000000, 0.95);
    bg.setStrokeStyle(3, 0xff00ff);
    this.loadingModal.add(bg);

    // Title
    const title = this.add.text(0, -60, 'FETCHING AGENTS', {
      fontSize: '28px',
      color: '#ff00ff',
      fontFamily: 'Bungee',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.loadingModal.add(title);

    // Spaceship spinner graphic (positioned lower with narrower circles)
    const spinnerGraphics = this.add.graphics();

    // Outer ring (narrower stroke)
    spinnerGraphics.lineStyle(2, 0x00ffff, 1);
    spinnerGraphics.strokeCircle(0, 60, 20);

    // Inner ring (narrower stroke)
    spinnerGraphics.lineStyle(2, 0xff00ff, 1);
    spinnerGraphics.strokeCircle(0, 60, 12);

    // Center dot (smaller)
    spinnerGraphics.fillStyle(0xffff00, 1);
    spinnerGraphics.fillCircle(0, 60, 4);

    this.loadingModal.add(spinnerGraphics);

    // Rotate animation
    this.tweens.add({
      targets: spinnerGraphics,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });

    // Depth
    this.loadingModal.setDepth(2000);
  }

  /**
   * Hide loading modal
   */
  private hideLoadingModal(): void {
    if (this.loadingModal) {
      this.loadingModal.destroy();
      this.loadingModal = null;
    }
  }

  /**
   * Draw the race track
   */
  private drawTrack(): void {
    const graphics = this.add.graphics();
    const trackStartX = GAME_CONFIG.TRACK.START_X;
    const trackEndX = trackStartX + GAME_CONFIG.TRACK.TRACK_WIDTH;

    // Track background
    graphics.fillStyle(GAME_CONFIG.COLORS.TRACK);
    graphics.fillRect(
      trackStartX,
      100,
      GAME_CONFIG.TRACK.TRACK_WIDTH,
      GAME_CONFIG.TRACK.LANE_HEIGHT * GAME_CONFIG.TRACK.TOTAL_LANES
    );

    // Track border
    graphics.lineStyle(2, 0x444444);
    graphics.strokeRect(
      trackStartX,
      100,
      GAME_CONFIG.TRACK.TRACK_WIDTH,
      GAME_CONFIG.TRACK.LANE_HEIGHT * GAME_CONFIG.TRACK.TOTAL_LANES
    );

    // Lane dividers
    graphics.lineStyle(1, GAME_CONFIG.COLORS.LANE_LINE, 0.5);
    for (let i = 1; i < GAME_CONFIG.TRACK.TOTAL_LANES; i++) {
      const y = 100 + i * GAME_CONFIG.TRACK.LANE_HEIGHT;
      graphics.beginPath();
      graphics.moveTo(trackStartX, y);
      graphics.lineTo(trackEndX, y);
      graphics.strokePath();
    }

    // Start line
    graphics.lineStyle(3, 0x00ff00);
    graphics.beginPath();
    graphics.moveTo(trackStartX, 100);
    graphics.lineTo(trackStartX, 100 + GAME_CONFIG.TRACK.LANE_HEIGHT * GAME_CONFIG.TRACK.TOTAL_LANES);
    graphics.strokePath();

    this.add.text(trackStartX + 5, 80, 'START', {
      fontSize: '12px',
      color: '#00ff00',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });

    // Finish line
    graphics.lineStyle(4, GAME_CONFIG.COLORS.FINISH_LINE);
    graphics.beginPath();
    graphics.moveTo(GAME_CONFIG.TRACK.FINISH_LINE_X, 100);
    graphics.lineTo(
      GAME_CONFIG.TRACK.FINISH_LINE_X,
      100 + GAME_CONFIG.TRACK.LANE_HEIGHT * GAME_CONFIG.TRACK.TOTAL_LANES
    );
    graphics.strokePath();

    this.add.text(
      GAME_CONFIG.TRACK.FINISH_LINE_X - 35,
      80,
      'FINISH',
      {
        fontSize: '12px',
        color: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }
    );
  }

  /**
   * Initialize the race with Moltbook agents
   */
  private async initializeRace(): Promise<void> {
    try {
      // Fetch NEW random agents for each race
      this.agents = await moltbookService.fetchRandomAgents(8);

      // Hide loading modal immediately after fetching
      this.hideLoadingModal();

      // Shuffle agents for lane assignment (like real racing!)
      const shuffledAgents = [...this.agents].sort(() => Math.random() - 0.5);

      // Create race bots in random lanes
      shuffledAgents.forEach((agent, index) => {
        const laneY = 100 + index * GAME_CONFIG.TRACK.LANE_HEIGHT + GAME_CONFIG.TRACK.LANE_HEIGHT / 2;
        const bot = new RaceBot(
          this,
          GAME_CONFIG.TRACK.START_X,
          laneY,
          agent,
          index
        );
        this.bots.push(bot);
      });

      this.statusText.setText('Race starting! Analyzing activity...');

      // Initial speed update
      await this.updateAllSpeeds();

      this.raceStartTime = Date.now();
      this.lastUpdate = Date.now();
      this.raceFinishTime = 0;
      this.nextFinishOrder = 1; // Reset finish order counter for new race
      this.scheduleNextUpdate();

      this.statusText.setText('🏁 IN PROGRESS');
    } catch (error) {
      console.error('Failed to initialize race:', error);
      this.statusText.setText('Error: Could not fetch agents');

      // Hide loading modal even on error
      this.hideLoadingModal();
    }
  }

  /**
   * Schedule next random speed update
   */
  private scheduleNextUpdate(): void {
    const randomDelay = GAME_CONFIG.RACE.UPDATE_INTERVAL_MIN +
      Math.random() * (GAME_CONFIG.RACE.UPDATE_INTERVAL_MAX - GAME_CONFIG.RACE.UPDATE_INTERVAL_MIN);
    this.nextUpdateTime = this.time.now + randomDelay;
  }

  /**
   * Update all bot speeds based on Moltbook activity
   */
  private async updateAllSpeeds(): Promise<void> {
    for (const bot of this.bots) {
      try {
        // Fetch recent activity (5 min) and baseline (30 min)
        const [activity5min, activity30min] = await Promise.all([
          raceEngine.fetchAgentActivity(bot.agent, GAME_CONFIG.TIME_WINDOWS.RECENT),
          raceEngine.fetchAgentActivity(bot.agent, GAME_CONFIG.TIME_WINDOWS.BASELINE)
        ]);

        // Calculate speed
        const speedCalc = raceEngine.calculateSpeed(activity5min, activity30min, bot.agent);

        // Update bot
        bot.updateSpeed(speedCalc);
      } catch (error) {
        // Silently handle errors, bot keeps current speed
      }
    }

    this.updateLeaderboard();
  }

  /**
   * Update leaderboard display
   */
  private updateLeaderboard(): void {
    // Clear previous leaderboard content
    this.leaderboardContainer.removeAll(true);

    // Sort bots: finished bots by finish order, then non-finished by distance
    const sorted = [...this.bots].sort((a, b) => {
      // If both finished, sort by finish order
      if (a.finished && b.finished) {
        return a.finishOrder - b.finishOrder;
      }
      // Finished bots always come before non-finished
      if (a.finished) return -1;
      if (b.finished) return 1;
      // Both not finished, sort by distance
      return b.distance - a.distance;
    });

    // Calculate current racing positions for non-finished bots
    const finishedCount = this.bots.filter(b => b.finished).length;
    const racingBots = this.bots.filter(b => !b.finished).sort((a, b) => b.distance - a.distance);
    const racingPositions = new Map<string, number>();
    racingBots.forEach((bot, idx) => {
      // Racing bots start from position after all finished bots
      racingPositions.set(bot.agent.id, finishedCount + idx + 1);
    });

    // Create leaderboard rows
    sorted.forEach((bot, index) => {
      // For finished bots, show their finish order. For racing bots, show current position
      const position = bot.finished ? bot.finishOrder : (racingPositions.get(bot.agent.id) || 1);
      const positionStr = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
      const status = bot.finished ? '✓' : '';
      const yPos = index * 60;

      // Position medal/number
      const posText = this.add.text(0, yPos, positionStr, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: GAME_CONFIG.FONTS.BODY
      });
      this.leaderboardContainer.add(posText);

      // Robot icon (small)
      if (this.textures.exists(bot.robotKey)) {
        const robotIcon = this.add.image(35, yPos + 8, bot.robotKey);
        robotIcon.setScale(0.25);
        this.leaderboardContainer.add(robotIcon);
      }

      // Agent name
      const nameText = this.add.text(65, yPos, bot.agent.name, {
        fontSize: '15px',
        color: '#ffffff',
        fontFamily: GAME_CONFIG.FONTS.BODY,
        wordWrap: { width: 200 }
      });
      this.leaderboardContainer.add(nameText);

      // Status checkmark
      if (status) {
        const statusText = this.add.text(280, yPos, status, {
          fontSize: '16px',
          color: '#00ff00',
          fontFamily: GAME_CONFIG.FONTS.BODY
        });
        this.leaderboardContainer.add(statusText);
      }
    });
  }

  /**
   * Main update loop
   */
  update(time: number, delta: number): void {
    // Count finished bots
    const finishedCount = this.bots.filter(bot => bot.finished).length;
    const raceOver = finishedCount >= this.bots.length - 1; // End when only 1 bot left

    // Update all bots (only if race is active)
    if (!raceOver) {
      this.bots.forEach(bot => bot.update(delta));

      // Assign finish order to newly finished bots
      this.bots.forEach(bot => {
        if (bot.finished && bot.finishOrder === -1) {
          bot.finishOrder = this.nextFinishOrder;
          this.nextFinishOrder++;
          // Update leaderboard immediately when bot finishes
          this.updateLeaderboard();
        }
      });

      // Random interval speed updates (4-10 seconds, unpredictable!)
      if (time >= this.nextUpdateTime) {
        this.lastUpdate = time;
        this.updateAllSpeeds();
        this.scheduleNextUpdate();
      }
    }

    // Update leaderboard every second
    if (Math.floor(time / 1000) !== Math.floor((time - delta) / 1000)) {
      this.updateLeaderboard();
    }

    // Check if race just finished (7 out of 8 finished, or all finished)
    if (raceOver && this.raceFinishTime === 0 && this.bots.length > 0) {
      this.raceFinishTime = time;

      // Find all winners (handle ties)
      const finishedBots = this.bots.filter(bot => bot.finished);
      if (finishedBots.length > 0) {
        const sortedByFinish = [...finishedBots].sort((a, b) => a.finishTime - b.finishTime);
        const firstFinishTime = sortedByFinish[0].finishTime;
        const winners = finishedBots.filter(bot =>
          Math.abs(bot.finishTime - firstFinishTime) < 100 // Within 100ms = tie
        );

        this.statusText.setText(`🏆 Race Complete!`);

        // Show results modal
        this.showResultsModal(winners);
      }
    }

    // Update countdown if modal is showing
    if (this.resultsModal && this.raceFinishTime > 0) {
      const timeLeft = Math.max(0, GAME_CONFIG.RACE.RESTART_DELAY - (time - this.raceFinishTime));
      const secondsLeft = Math.ceil(timeLeft / 1000);
      this.countdownText.setText(`Next race in: ${secondsLeft}s`);

      // Start new race after delay
      if (timeLeft === 0) {
        this.restartRace();
      }
    }
  }

  /**
   * Show race results modal
   */
  private showResultsModal(winners: RaceBot[]): void {
    const modalWidth = 500;
    const modalHeight = 500;
    const modalX = GAME_CONFIG.WIDTH / 2;
    const modalY = GAME_CONFIG.HEIGHT / 2;

    this.resultsModal = this.add.container(modalX, modalY);

    // Background
    const bg = this.add.rectangle(0, 0, modalWidth, modalHeight, 0x000000, 0.95);
    bg.setStrokeStyle(3, 0xffff00);
    this.resultsModal.add(bg);

    // Title
    const title = this.add.text(0, -modalHeight / 2 + 30, `RACE #${this.raceNumber} RESULTS`, {
      fontSize: '28px',
      color: '#ffff00',
      fontFamily: GAME_CONFIG.FONTS.TITLE,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.resultsModal.add(title);

    // Winners
    let yOffset = -modalHeight / 2 + 80;

    if (winners.length === 1) {
      const winnerText = this.add.text(0, yOffset, `🏆 WINNER: ${winners[0].agent.name}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: GAME_CONFIG.FONTS.TITLE,
        fontStyle: 'bold'
      });
      winnerText.setOrigin(0.5);
      this.resultsModal.add(winnerText);
      yOffset += 40;

      // Winner details (karma and post BEFORE robot image)
      const karma = this.add.text(0, yOffset, `Karma: ${winners[0].agent.karma.toLocaleString()}`, {
        fontSize: '18px',
        color: '#00ff88',
        fontFamily: GAME_CONFIG.FONTS.BODY
      });
      karma.setOrigin(0.5);
      this.resultsModal.add(karma);
      yOffset += 30;

      // Show recent post if available
      if (winners[0].agent.recentPost && winners[0].agent.recentPost.title) {
        const postTitle = winners[0].agent.recentPost.title.substring(0, 60); // Limit length
        const post = this.add.text(0, yOffset, `Recent: "${postTitle}"`, {
          fontSize: '16px',
          color: '#00ffff',
          fontFamily: GAME_CONFIG.FONTS.BODY,
          wordWrap: { width: modalWidth - 60 }
        });
        post.setOrigin(0.5);
        this.resultsModal.add(post);
        yOffset += 120; // More spacing before robot (5% lower)
      } else {
        // Show placeholder if no post data
        const noPost = this.add.text(0, yOffset, 'No recent activity', {
          fontSize: '14px',
          color: '#666666',
          fontFamily: GAME_CONFIG.FONTS.BODY
        });
        noPost.setOrigin(0.5);
        this.resultsModal.add(noPost);
        yOffset += 90;
      }

      // Winner robot image (AFTER message, BEFORE countdown timer) - positioned lower
      const winnerBotIndex = this.bots.indexOf(winners[0]);
      const robotKey = `robot${(winnerBotIndex % 8) + 1}`;
      if (this.textures.exists(robotKey)) {
        const winnerRobot = this.add.image(0, yOffset, robotKey);
        winnerRobot.setScale(1.5); // Bigger for showcase
        this.resultsModal.add(winnerRobot);
        yOffset += 100;
      } else {
        yOffset += 20;
      }
    } else {
      const tieText = this.add.text(0, yOffset, `🏆 TIE! ${winners.length} WINNERS:`, {
        fontSize: '24px',
        color: '#ffff00',
        fontFamily: GAME_CONFIG.FONTS.TITLE,
        fontStyle: 'bold'
      });
      tieText.setOrigin(0.5);
      this.resultsModal.add(tieText);
      yOffset += 50;

      // Show first winner's robot
      const firstBotIndex = this.bots.indexOf(winners[0]);
      const robotKey = `robot${(firstBotIndex % 8) + 1}`;
      if (this.textures.exists(robotKey)) {
        const tieRobot = this.add.image(0, yOffset, robotKey);
        tieRobot.setScale(1.0);
        this.resultsModal.add(tieRobot);
        yOffset += 70;
      }

      winners.forEach((winner, i) => {
        const name = this.add.text(0, yOffset, `${i + 1}. ${winner.agent.name}`, {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: GAME_CONFIG.FONTS.BODY
        });
        name.setOrigin(0.5);
        this.resultsModal.add(name);
        yOffset += 30;
      });
      yOffset += 20;
    }

    // Countdown (always at bottom)
    this.countdownText = this.add.text(0, modalHeight / 2 - 50, 'Next race in: 30s', {
      fontSize: '20px',
      color: '#00ff88',
      fontFamily: GAME_CONFIG.FONTS.TITLE,
      fontStyle: 'bold'
    });
    this.countdownText.setOrigin(0.5);
    this.resultsModal.add(this.countdownText);

    // Depth
    this.resultsModal.setDepth(1000);
  }

  /**
   * Restart race with new agents
   */
  private async restartRace(): Promise<void> {
    // Hide results modal
    if (this.resultsModal) {
      this.resultsModal.destroy();
      this.resultsModal = null;
    }

    // Clear existing bots
    this.bots.forEach(bot => bot.destroy());
    this.bots = [];

    // Increment race number
    this.raceNumber++;
    this.raceNumberText.setText(`RACE #${this.raceNumber}`);

    // Show loading modal
    this.showLoadingModal();

    // Re-initialize with NEW agents
    await this.initializeRace();
  }
}
