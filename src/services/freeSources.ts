// Free news and trend sources - no API costs!

export class FreeSourcesService {
  // Free RSS feeds for each category
  private rssSources = {
    'agentic-ai': [
      'https://ai.googleblog.com/feeds/posts/default',
      'https://deepmind.com/blog/feed/basic/',
      'https://blogs.microsoft.com/ai/feed/',
      'https://research.facebook.com/blog/feed/',
      'https://research.google/pubs/feed/',
    ],
    'cybersecurity': [
      'https://krebsonsecurity.com/feed/',
      'https://www.schneier.com/feed/',
      'https://feeds.feedburner.com/TheHackersNews',
      'https://www.bleepingcomputer.com/feed/',
      'https://www.securityweek.com/feed',
      'https://www.darkreading.com/rss_simple.asp',
    ],
    'coding': [
      'https://stackoverflow.blog/feed/',
      'https://github.blog/feed/',
      'https://dev.to/feed',
      'https://css-tricks.com/feed/',
      'https://www.smashingmagazine.com/feed/',
      'https://feeds.feedburner.com/oreilly/programming',
      'https://web.dev/feed.xml',
    ]
  };

  // Reddit subreddits for trending topics
  private redditSources = {
    'agentic-ai': [
      'MachineLearning',
      'artificial',
      'singularity',
      'OpenAI',
      'LocalLLaMA',
      'ArtificialIntelligence'
    ],
    'cybersecurity': [
      'netsec',
      'cybersecurity',
      'AskNetsec',
      'malware',
      'hacking',
      'InfoSecNews'
    ],
    'coding': [
      'programming',
      'webdev',
      'javascript',
      'Python',
      'reactjs',
      'learnprogramming'
    ]
  };

  async fetchRSSFeed(url: string) {
    try {
      // Use a free RSS to JSON service
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        console.warn(`RSS feed service returned ${response.status} for ${url}`);
        return [];
      }
      
      const data = await response.json();
      
      if (data.status === 'ok' && data.items && Array.isArray(data.items)) {
        return data.items.slice(0, 10).map((item: any) => ({
          title: item.title || 'Untitled',
          description: item.description || item.content || '',
          url: item.link || item.url || '',
          publishedAt: item.pubDate || new Date().toISOString(),
          source: { name: data.feed?.title || 'RSS Feed' }
        })).filter(item => item.title && item.url); // Filter out invalid items
      }
      
      console.warn(`RSS feed service returned status: ${data.status} for ${url}`);
      return [];
    } catch (error) {
      console.error(`Error fetching RSS feed ${url}:`, error);
      return [];
    }
  }

  async fetchRedditTrends(subreddit: string) {
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`);
      const data = await response.json();
      
      return data.data.children.map((post: any) => ({
        title: post.data.title,
        description: post.data.selftext || post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
        source: { name: `r/${subreddit}` },
        score: post.data.score,
        comments: post.data.num_comments
      }));
    } catch (error) {
      console.error(`Error fetching Reddit trends for ${subreddit}:`, error);
      return [];
    }
  }

  async fetchHackerNews() {
    try {
      // Get top stories
      const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStories = await topStoriesResponse.json();
      
      // Get first 20 stories
      const stories = await Promise.all(
        topStories.slice(0, 20).map(async (id: number) => {
          const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return storyResponse.json();
        })
      );

      return stories
        .filter(story => story && story.url) // Only stories with URLs
        .map(story => ({
          title: story.title,
          description: story.title, // HN doesn't have descriptions
          url: story.url,
          publishedAt: new Date(story.time * 1000).toISOString(),
          source: { name: 'Hacker News' },
          score: story.score,
          comments: story.descendants || 0
        }));
    } catch (error) {
      console.error('Error fetching Hacker News:', error);
      return [];
    }
  }

  async fetchTrendingContent(category: string) {
    const allContent: any[] = [];

    try {
      // Fetch RSS feeds
      const rssFeeds = this.rssSources[category as keyof typeof this.rssSources] || [];
      for (const feedUrl of rssFeeds.slice(0, 3)) { // Limit to 3 feeds to avoid rate limits
        const feedContent = await this.fetchRSSFeed(feedUrl);
        allContent.push(...feedContent);
      }

      // Fetch Reddit trends
      const subreddits = this.redditSources[category as keyof typeof this.redditSources] || [];
      for (const subreddit of subreddits.slice(0, 2)) { // Limit to 2 subreddits
        const redditContent = await this.fetchRedditTrends(subreddit);
        allContent.push(...redditContent);
      }

      // Fetch Hacker News (for coding category)
      if (category === 'coding') {
        const hnContent = await this.fetchHackerNews();
        allContent.push(...hnContent);
      }

      // Sort by date and return recent content
      return allContent
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 50); // Return top 50 most recent items

    } catch (error) {
      console.error(`Error fetching trending content for ${category}:`, error);
      return [];
    }
  }

  async searchContent(query: string, category: string) {
    // Simple search through fetched content
    const content = await this.fetchTrendingContent(category);
    
    return content.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get trending keywords from content
  extractTrendingKeywords(content: any[]) {
    const keywords: { [key: string]: number } = {};
    
    content.forEach(item => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      const words = text.match(/\b\w{4,}\b/g) || []; // Words with 4+ characters
      
      words.forEach(word => {
        if (!this.isStopWord(word)) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });

    return Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  private isStopWord(word: string) {
    const stopWords = ['that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'];
    return stopWords.includes(word);
  }
}

export const freeSourcesService = new FreeSourcesService();