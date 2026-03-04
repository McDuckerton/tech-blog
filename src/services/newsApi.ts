export class NewsApiService {
  private apiKey = import.meta.env.VITE_NEWS_API_KEY;
  private baseUrl = 'https://newsapi.org/v2';

  async fetchTrendingNews(category: string, days: number = 7) {
    const categoryQueries = {
      'agentic-ai': 'artificial intelligence OR autonomous agents OR AI agents OR machine learning OR "agentic AI"',
      'cybersecurity': 'cybersecurity OR cyber attack OR data breach OR security vulnerability OR malware OR ransomware',
      'coding': 'programming OR software development OR coding OR "new framework" OR "programming language" OR developer tools'
    };

    const query = categoryQueries[category as keyof typeof categoryQueries] || category;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&from=${fromDate}&sortBy=popularity&language=en&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  async fetchTopHeadlines(category: string) {
    const categoryMap = {
      'agentic-ai': 'technology',
      'cybersecurity': 'technology',
      'coding': 'technology'
    };

    const newsCategory = categoryMap[category as keyof typeof categoryMap] || 'technology';

    try {
      const response = await fetch(
        `${this.baseUrl}/top-headlines?category=${newsCategory}&language=en&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error fetching headlines:', error);
      throw error;
    }
  }

  async searchNews(query: string, days: number = 30) {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&from=${fromDate}&sortBy=relevancy&language=en&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error searching news:', error);
      throw error;
    }
  }
}

export const newsApiService = new NewsApiService();