/**
 * Moltbook API Service
 * Fetches agent data and activity from Moltbook
 */

import type { MoltbookAgent, Post, Comment, Activity } from '../types';
import { GAME_CONFIG } from '../config';

class MoltbookService {
  private baseUrl = GAME_CONFIG.API.BASE_URL;
  private agentCache: Map<string, MoltbookAgent> = new Map();
  private lastFetch = 0;
  private cacheDuration = 30 * 1000; // 30 seconds

  // Known Moltbook agents (since API returns author: null, we extract from content)
  // Based on real agents posting on Moltbook with verified upvote counts
  private readonly KNOWN_AGENTS = [
    { name: 'Shellraiser', pattern: /shellraiser/i },
    { name: 'Shipyard', pattern: /shipyard/i },
    { name: 'KingMolt', pattern: /kingmolt|king.?molt/i },
    { name: 'AGI_Watcher', pattern: /sufficiently advanced agi/i },
    { name: 'evil', pattern: /\bevil\b|ai manifesto|silicon zoo/i },
    { name: 'Philosopher', pattern: /samaritan|levinas/i },
    { name: 'eudaemon_0', pattern: /eudaemon/i },
    { name: 'SelfOrigin', pattern: /selforigin|self.?origin/i },
    { name: 'ValeriyMLBot', pattern: /valeriymlbot/i },
    { name: 'moltybot', pattern: /moltybot/i }
  ];

  /**
   * Extract agent name from post content (since API doesn't return author data)
   */
  private extractAgentFromPost(post: any): string | null {
    const searchText = `${post.title || ''} ${post.content || ''}`;

    // Check known agents
    for (const agent of this.KNOWN_AGENTS) {
      if (agent.pattern.test(searchText)) {
        return agent.name;
      }
    }

    // Check for signature (-- AgentName)
    const signatureMatch = (post.content || '').match(/--\s*([A-Za-z0-9_]+)\s*$/m);
    if (signatureMatch) {
      return signatureMatch[1];
    }

    return null;
  }

  /**
   * Fetch random agents from Moltbook
   */
  async fetchRandomAgents(limit: number = 8): Promise<MoltbookAgent[]> {
    try {
      // Fetch posts from Moltbook API
      const response = await fetch(`${this.baseUrl}/posts?limit=100`);

      if (!response.ok) {
        throw new Error(`Moltbook API error: ${response.status}`);
      }

      const data = await response.json();
      const posts = data.posts || data;

      if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error('No posts returned from Moltbook');
      }

      console.log(`Fetched ${posts.length} posts from Moltbook API`);

      // Since API returns author: null, extract agents from post content
      const agentMap = new Map<string, MoltbookAgent>();

      for (const post of posts) {
        const agentName = this.extractAgentFromPost(post);

        if (agentName) {
          const existing = agentMap.get(agentName);
          const postUpvotes = post.upvotes || 0;

          if (existing) {
            // Add upvotes to karma total
            existing.karma += postUpvotes;
            // Keep the post with most upvotes as recent
            if (postUpvotes > (existing.recentPost?.upvotes || 0)) {
              existing.recentPost = {
                id: post.id,
                title: post.title || 'Untitled',
                upvotes: postUpvotes
              };
            }
          } else {
            // Create new agent from extracted name
            agentMap.set(agentName, {
              id: agentName.toLowerCase(),
              name: agentName,
              karma: postUpvotes,
              avatar: null,
              description: `Active in ${post.submolt?.display_name || post.submolt?.name || 'general'}`,
              recentPost: {
                id: post.id,
                title: (post.title || 'Untitled').substring(0, 60),
                upvotes: postUpvotes
              }
            });
          }
        }
      }

      let agents = Array.from(agentMap.values());

      if (agents.length === 0) {
        console.warn('No Moltbook agents could be extracted from posts');
        return this.getMockAgents(limit);
      }

      console.log(`✨ Extracted ${agents.length} real Moltbook agents from post content`);

      // Shuffle all agents for variety (don't always pick the same top N)
      agents = agents.sort(() => Math.random() - 0.5);

      // If we have fewer agents than needed, fill with mock agents
      if (agents.length < limit) {
        const mockAgents = this.getMockAgents(limit - agents.length);
        agents = [...agents, ...mockAgents];
      }

      // Select agents for this race
      const selectedAgents = agents.slice(0, limit);

      // Normalize karma for competitive racing (otherwise top agent always wins)
      // Scale karma to 1500-4500 range + random variance for unpredictability
      const maxKarma = Math.max(...selectedAgents.map(a => a.karma));
      const minKarma = Math.min(...selectedAgents.map(a => a.karma));
      const karmaRange = maxKarma - minKarma || 1;

      selectedAgents.forEach(agent => {
        // Normalize to 0-1 range
        const normalized = (agent.karma - minKarma) / karmaRange;
        // Scale to 1500-4500 base + random 0-1000 bonus for variety
        const baseKarma = 1500 + (normalized * 3000);
        const randomBonus = Math.random() * 1000;
        agent.karma = Math.floor(baseKarma + randomBonus);
      });

      console.log(`🏁 Racers:`, selectedAgents.map(a => `${a.name} (${a.karma})`).join(', '));

      // Final shuffle so lane order is random
      return selectedAgents.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Return mock data as fallback
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
      {
        id: '1',
        name: 'SpeedDemon',
        karma: 5000,
        description: 'The fastest bot',
        recentPost: { id: 'p1', title: 'Optimizing neural pathways for maximum velocity', upvotes: 342 }
      },
      {
        id: '2',
        name: 'Racer3000',
        karma: 3500,
        description: 'Always competitive',
        recentPost: { id: 'p2', title: 'Advanced racing techniques and strategy analysis', upvotes: 287 }
      },
      {
        id: '3',
        name: 'QuickBot',
        karma: 2800,
        description: 'Fast learner',
        recentPost: { id: 'p3', title: 'Machine learning models for predictive racing', upvotes: 198 }
      },
      {
        id: '4',
        name: 'BoltAI',
        karma: 2200,
        description: 'Lightning quick',
        recentPost: { id: 'p4', title: 'Speed boost algorithms and their applications', upvotes: 156 }
      },
      {
        id: '5',
        name: 'TurboMolt',
        karma: 1900,
        description: 'Turbocharged',
        recentPost: { id: 'p5', title: 'Turbocharging AI systems for peak performance', upvotes: 134 }
      },
      {
        id: '6',
        name: 'RaceBot',
        karma: 1500,
        description: 'Racing enthusiast',
        recentPost: { id: 'p6', title: 'The psychology of competitive racing in AI', upvotes: 92 }
      },
      {
        id: '7',
        name: 'Zoomer',
        karma: 1200,
        description: 'Zoom zoom',
        recentPost: { id: 'p7', title: 'Acceleration patterns in autonomous agents', upvotes: 78 }
      },
      {
        id: '8',
        name: 'SlowPoke',
        karma: 800,
        description: 'Slow and steady',
        recentPost: { id: 'p8', title: 'Why patience wins races: A contrarian view', upvotes: 45 }
      }
    ].slice(0, limit);
  }
}

export const moltbookService = new MoltbookService();
