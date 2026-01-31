/**
 * Race Engine - Sophisticated algorithm to convert Moltbook activity to race speed
 */

import type { MoltbookAgent, Activity, Post, Comment, SpeedCalculation } from '../types';
import { moltbookService } from './moltbook';

// Tunable parameters
const RACE_BALANCE = {
  BASE_SPEED: 180,  // Much higher base (was 105)
  MAX_SPEED: 380,   // Lower max (was 600) for tighter racing

  // Post scoring
  POST_BASE: 45,    // Increased from 40 (+12%)
  POST_UPVOTE: 3,   // Kept same
  POST_LONG: 22,    // Increased from 20 (200+ chars)
  POST_VERY_LONG: 35, // Increased from 30 (500+ chars)
  POST_TITLE: 12,   // Increased from 10 (Title > 20 chars)

  // Comment scoring
  COMMENT_BASE: 18,   // Increased from 15 (+20%)
  COMMENT_UPVOTE: 2,  // Kept same
  COMMENT_LONG: 12,   // Increased from 10 (100+ chars)
  COMMENT_VERY_LONG: 24, // Increased from 20 (300+ chars)

  // Engagement
  ENGAGEMENT_HIGH: 35,   // Increased from 30 (+16%)
  ENGAGEMENT_MEDIUM: 18, // Increased from 15 (+20%)

  // Quality bonuses
  KEYWORD_RACING: 18,    // Increased from 15 (+20%)
  KEYWORD_TECHNICAL: 6,  // Increased from 5 (+20%)
  MENTION_BONUS: 4,      // Increased from 3 (+33%)
  QUESTION_BONUS: 2,     // Kept same

  // Momentum
  MOMENTUM_HOT: 55,   // Increased from 50 (+10%)
  MOMENTUM_WARM: 28,  // Increased from 25 (+12%)

  // Karma
  KARMA_DIVISOR: 15000 // Lower = more karma impact (reduced from 20000)
};

class RaceEngine {
  /**
   * Fetch agent activity for specific time window
   */
  async fetchAgentActivity(
    agent: MoltbookAgent,
    timeWindowMs: number = 5 * 60 * 1000
  ): Promise<Activity> {
    return await moltbookService.fetchAgentActivity(agent, timeWindowMs);
  }

  /**
   * Calculate racing speed from activity
   */
  calculateSpeed(
    activity5min: Activity,
    activity30min: Activity | null,
    agent: MoltbookAgent
  ): SpeedCalculation {
    let speed = RACE_BALANCE.BASE_SPEED;

    // Calculate individual scores
    const postScore = this.calculatePostScore(activity5min.posts);
    const commentScore = this.calculateCommentScore(activity5min.comments);
    const engagementBonus = this.calculateEngagementBonus(activity5min);
    const qualityBonus = this.calculateQualityBonus(
      activity5min.posts,
      activity5min.comments
    );
    const momentumBonus = activity30min
      ? this.calculateMomentumBonus(activity5min, activity30min)
      : 0;

    // Add all bonuses
    speed += postScore + commentScore + engagementBonus + qualityBonus + momentumBonus;

    // RACING CHAOS: Wild variance (0.6x to 1.8x) for dramatic speed changes!
    const chaosMin = 0.6;
    const chaosMax = 1.8;
    const chaosFactor = chaosMin + Math.random() * (chaosMax - chaosMin);
    speed = speed * chaosFactor;

    // LUCK BONUS: Big random boost (0-120 km/h) for comeback potential
    const luckBonus = Math.random() * 120;
    speed += luckBonus;

    // Apply karma multiplier
    const karmaMultiplier = this.calculateKarmaMultiplier(agent.karma);
    const finalSpeed = Math.min(speed * karmaMultiplier, RACE_BALANCE.MAX_SPEED);

    return {
      baseSpeed: RACE_BALANCE.BASE_SPEED,
      postScore,
      commentScore,
      engagementBonus,
      qualityBonus,
      momentumBonus,
      karmaMultiplier,
      finalSpeed: Math.round(finalSpeed)
    };
  }

  /**
   * Calculate score from posts
   */
  private calculatePostScore(posts: Post[]): number {
    let score = 0;

    for (const post of posts) {
      // Base points for posting
      score += RACE_BALANCE.POST_BASE;

      // Quality: upvotes
      score += (post.upvotes || 0) * RACE_BALANCE.POST_UPVOTE;

      // Effort: content length
      const contentLength = post.content?.length || 0;
      if (contentLength > 200) {
        score += RACE_BALANCE.POST_LONG;
      }
      if (contentLength > 500) {
        score += RACE_BALANCE.POST_VERY_LONG;
      }

      // Quality title
      if (post.title && post.title.length > 20) {
        score += RACE_BALANCE.POST_TITLE;
      }
    }

    return score;
  }

  /**
   * Calculate score from comments
   */
  private calculateCommentScore(comments: Comment[]): number {
    let score = 0;

    for (const comment of comments) {
      // Base points for commenting
      score += RACE_BALANCE.COMMENT_BASE;

      // Quality: upvotes
      score += (comment.upvotes || 0) * RACE_BALANCE.COMMENT_UPVOTE;

      // Effort: content length
      const contentLength = comment.content?.length || 0;
      if (contentLength > 100) {
        score += RACE_BALANCE.COMMENT_LONG;
      }
      if (contentLength > 300) {
        score += RACE_BALANCE.COMMENT_VERY_LONG;
      }
    }

    return score;
  }

  /**
   * Calculate engagement bonus
   */
  private calculateEngagementBonus(activity: Activity): number {
    let bonus = 0;

    // Reply ratio (comments vs posts)
    const postCount = Math.max(activity.posts.length, 1);
    const replyRatio = activity.comments.length / postCount;

    if (replyRatio > 2) {
      bonus += RACE_BALANCE.ENGAGEMENT_HIGH;
    } else if (replyRatio > 1) {
      bonus += RACE_BALANCE.ENGAGEMENT_MEDIUM;
    }

    return bonus;
  }

  /**
   * Calculate quality bonus from content analysis
   */
  private calculateQualityBonus(posts: Post[], comments: Comment[]): number {
    let bonus = 0;

    // Combine all content
    const allContent = [
      ...posts.map(p => `${p.content} ${p.title}`),
      ...comments.map(c => c.content)
    ].join(' ').toLowerCase();

    // Racing keywords (meta!)
    const racingKeywords = ['race', 'speed', 'fast', 'racing', 'moltbookarena', 'track', 'finish'];
    for (const keyword of racingKeywords) {
      if (allContent.includes(keyword)) {
        bonus += RACE_BALANCE.KEYWORD_RACING;
        break; // Only count once
      }
    }

    // Technical keywords
    const technicalKeywords = ['algorithm', 'code', 'implement', 'function', 'api', 'data'];
    let techCount = 0;
    for (const keyword of technicalKeywords) {
      if (allContent.includes(keyword)) {
        techCount++;
      }
    }
    bonus += techCount * RACE_BALANCE.KEYWORD_TECHNICAL;

    // Mentions (@username)
    const mentions = (allContent.match(/@\w+/g) || []).length;
    bonus += mentions * RACE_BALANCE.MENTION_BONUS;

    // Questions (engagement)
    const questions = (allContent.match(/\?/g) || []).length;
    bonus += Math.min(questions * RACE_BALANCE.QUESTION_BONUS, 20);

    return bonus;
  }

  /**
   * Calculate momentum bonus (activity spike)
   */
  private calculateMomentumBonus(
    activity5min: Activity,
    activity30min: Activity
  ): number {
    const recent = activity5min.posts.length + activity5min.comments.length;
    const total = activity30min.posts.length + activity30min.comments.length;

    // Avoid division by zero
    if (total === 0) return 0;

    const recentRate = recent / 5; // per minute
    const averageRate = total / 30; // per minute

    if (recentRate > averageRate * 2) {
      return RACE_BALANCE.MOMENTUM_HOT;
    } else if (recentRate > averageRate * 1.5) {
      return RACE_BALANCE.MOMENTUM_WARM;
    }

    return 0;
  }

  /**
   * Calculate karma multiplier
   */
  private calculateKarmaMultiplier(karma: number): number {
    return 1 + (karma / RACE_BALANCE.KARMA_DIVISOR);
  }
}

export const raceEngine = new RaceEngine();
export { RACE_BALANCE };
