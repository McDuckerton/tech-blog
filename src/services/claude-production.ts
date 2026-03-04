// Production Claude service that uses the backend API
// Replace the existing claude.ts with this for production

export class ClaudeService {
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com/api/claude'  // Replace with your API domain
    : 'http://localhost:3001/api/claude';

  private async makeRequest(endpoint: string, data: any) {
    try {
      // Get auth token from localStorage (set during login)
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          throw new Error('Authentication expired');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Claude API ${endpoint} error:`, error);
      throw error;
    }
  }

  async generateBlogPost(category: string, trends: string[], sources: string[], customPrompt?: string) {
    return this.makeRequest('blog-post', {
      category,
      trends,
      sources,
      customPrompt
    });
  }

  async analyzeTrends(category: string, newsData: any[]) {
    return this.makeRequest('generate', {
      messages: [{
        role: 'user',
        content: `Analyze these news articles and identify the top trending topics in ${category}:

${newsData.map(article => `
Title: ${article.title}
Description: ${article.description}
Source: ${article.source?.name}
Published: ${article.publishedAt}
URL: ${article.url}
`).join('\n---\n')}

Please identify:
1. Top 5 trending topics
2. Relevance score (1-10) for each topic
3. Key themes and patterns
4. Emerging technologies or concepts
5. Industry impact assessment

Format as JSON:
{
  "trends": [
    {
      "topic": "trend name",
      "relevanceScore": 8,
      "description": "brief description",
      "keywords": ["keyword1", "keyword2"],
      "sources": ["source1", "source2"]
    }
  ],
  "summary": "Overall trend analysis summary",
  "recommendations": ["recommendation1", "recommendation2"]
}`
      }],
      max_tokens: 2000,
      temperature: 0.3
    });
  }
}

export const claudeService = new ClaudeService();