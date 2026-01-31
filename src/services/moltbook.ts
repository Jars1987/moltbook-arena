/**
 * Moltbook API Service
 * Fetches agent data and activity from Moltbook
 */

import type { MoltbookAgent, Post, Comment, Activity } from '../types';

class MoltbookService {
  private baseUrl = 'https://www.moltbook.com/api/v1';
  private agentCache: Map<string, MoltbookAgent> = new Map();
  private lastFetch = 0;
  private cacheDuration = 30 * 1000; // 30 seconds

  /**
   * Fetch random agents from Moltbook
   */
  async fetchRandomAgents(limit: number = 8): Promise<MoltbookAgent[]> {
    try {
      // Fetch more posts to get larger agent pool
      const response = await fetch(`${this.baseUrl}/posts?limit=200`);

      if (!response.ok) {
        throw new Error(`Moltbook API error: ${response.status}`);
      }

      const data = await response.json();
      const posts = data.posts || data;

      if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error('No posts returned from Moltbook');
      }

      // Extract unique agents from posts
      const agentMap = new Map<string, MoltbookAgent>();

      for (const post of posts) {
        // Check if post has user_id, agent_id, or author_id
        const userId = post.user_id || post.agent_id || post.author_id;
        const userName = post.user_name || post.agent_name || post.author_name;

        if (userId) {
          const existing = agentMap.get(userId);
          const postUpvotes = post.upvotes || post.score || 0;

          if (existing) {
            existing.karma += postUpvotes;
            if (postUpvotes > (existing.recentPost?.upvotes || 0)) {
              existing.recentPost = {
                id: post.id || post._id,
                title: post.title || 'Untitled',
                upvotes: postUpvotes
              };
            }
          } else {
            agentMap.set(userId, {
              id: userId,
              name: userName || `Agent${userId.slice(0, 6)}`,
              karma: postUpvotes || 0,
              recentPost: {
                id: post.id || post._id,
                title: post.title || 'Untitled',
                upvotes: postUpvotes
              }
            });
          }
        } else if (post.author && post.author.id) {
          const authorId = post.author.id || post.author._id;
          const existing = agentMap.get(authorId);
          const postUpvotes = post.upvotes || post.score || 0;

          if (existing) {
            // Update karma total
            existing.karma += postUpvotes;
            // Keep highest upvoted post
            if (postUpvotes > (existing.recentPost?.upvotes || 0)) {
              existing.recentPost = {
                id: post.id || post._id,
                title: post.title || 'Untitled',
                upvotes: postUpvotes
              };
            }
          } else {
            agentMap.set(authorId, {
              id: authorId,
              name: post.author.name || post.author.username || 'Unknown',
              karma: post.author.karma || postUpvotes || 0,
              avatar: post.author.avatar || post.author.profile_image,
              description: post.author.description || post.author.bio,
              recentPost: {
                id: post.id || post._id,
                title: post.title || 'Untitled',
                upvotes: postUpvotes
              }
            });
          }
        }
      }

      const agents = Array.from(agentMap.values());

      // If no agents found, use mock data
      if (agents.length === 0) {
        return this.getMockAgents(limit);
      }

      // Filter agents with some karma
      const activeAgents = agents.filter(a => a.karma > 0);

      // If no active agents, use all agents
      const agentsToUse = activeAgents.length > 0 ? activeAgents : agents;

      // Shuffle and take random subset
      const shuffled = agentsToUse.sort(() => Math.random() - 0.5);

      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Return mock data for development
      return this.getMockAgents(limit);
    }
  }

  /**
   * Fetch activity for a specific agent
   */
  async fetchAgentActivity(
    agent: MoltbookAgent,
    timeWindowMs: number = 5 * 60 * 1000
  ): Promise<Activity> {
    try {
      const now = Date.now();
      const cutoff = now - timeWindowMs;

      // Fetch recent posts with retry on error
      const postsResponse = await fetch(`${this.baseUrl}/posts?limit=100`);
      if (!postsResponse.ok) {
        // API error - return empty activity instead of throwing
        return {
          posts: [],
          comments: [],
          repliesReceived: 0,
          totalUpvotes: 0
        };
      }

      const postsData = await postsResponse.json();
      const allPosts = postsData.posts || postsData;

      // Filter for this agent's posts within time window
      const agentPosts = allPosts.filter((p: any) => {
        const isAuthor = p.author?.id === agent.id || p.author?.name === agent.name;
        const isRecent = p.created_at && new Date(p.created_at).getTime() > cutoff;
        return isAuthor && isRecent;
      });

      // Parse posts
      const posts: Post[] = agentPosts.map((p: any) => ({
        id: p.id || p._id,
        title: p.title || '',
        content: p.content || p.body || '',
        author: {
          id: p.author.id,
          name: p.author.name,
          karma: p.author.karma || 0
        },
        upvotes: p.upvotes || p.score || 0,
        created_at: p.created_at
      }));

      // TODO: Fetch comments (would need to iterate through post comments)
      // For now, use estimated comments based on post count
      const comments: Comment[] = [];

      const totalUpvotes = posts.reduce((sum, p) => sum + p.upvotes, 0);

      return {
        posts,
        comments,
        repliesReceived: 0,
        totalUpvotes
      };
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      return {
        posts: [],
        comments: [],
        repliesReceived: 0,
        totalUpvotes: 0
      };
    }
  }

  /**
   * Mock agents for development/fallback
   */
  private getMockAgents(limit: number): MoltbookAgent[] {
    return [
      { id: '1', name: 'SpeedDemon', karma: 5000, description: 'The fastest bot' },
      { id: '2', name: 'Racer3000', karma: 3500, description: 'Always competitive' },
      { id: '3', name: 'QuickBot', karma: 2800, description: 'Fast learner' },
      { id: '4', name: 'BoltAI', karma: 2200, description: 'Lightning quick' },
      { id: '5', name: 'TurboMolt', karma: 1900, description: 'Turbocharged' },
      { id: '6', name: 'RaceBot', karma: 1500, description: 'Racing enthusiast' },
      { id: '7', name: 'Zoomer', karma: 1200, description: 'Zoom zoom' },
      { id: '8', name: 'SlowPoke', karma: 800, description: 'Slow and steady' }
    ].slice(0, limit);
  }
}

export const moltbookService = new MoltbookService();
