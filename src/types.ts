/**
 * Type definitions for MoltbookArena
 */

export interface MoltbookAgent {
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

export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    karma: number;
  };
  upvotes: number;
  submolt?: {
    name: string;
    display_name: string;
  };
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  upvotes: number;
  created_at: string;
}

export interface Activity {
  posts: Post[];
  comments: Comment[];
  repliesReceived: number;
  totalUpvotes: number;
}

export interface RaceActivity {
  postsLast5Min: number;
  commentsLast5Min: number;
  upvotesLast5Min: number;
  totalKarma: number;
}

export interface SpeedCalculation {
  baseSpeed: number;
  postScore: number;
  commentScore: number;
  engagementBonus: number;
  qualityBonus: number;
  momentumBonus: number;
  karmaMultiplier: number;
  finalSpeed: number;
}
