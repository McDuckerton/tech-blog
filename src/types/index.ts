export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: 'agentic-ai' | 'cybersecurity' | 'coding';
  tags: string[];
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'scheduled';
  scheduledFor?: Date;
  readTime: number;
  views: number;
  likes: number;
  linkedinPostId?: string;
  aiGenerated: boolean;
  sources: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  category: 'agentic-ai' | 'cybersecurity' | 'coding';
  description: string;
  isActive: boolean;
  lastRun: Date;
  nextRun: Date;
  frequency: 'daily' | 'weekly' | 'monthly';
  sources: string[];
  prompt: string;
  generatedPosts: number;
}

export interface TrendData {
  id: string;
  topic: string;
  category: string;
  relevanceScore: number;
  sources: string[];
  keywords: string[];
  discoveredAt: Date;
  processed: boolean;
}

export interface LinkedInPost {
  id: string;
  blogPostId: string;
  content: string;
  postedAt: Date;
  linkedinId: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface AuthContextType {
  currentUser: any;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}