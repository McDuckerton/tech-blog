// Direct fetch implementation to work around CORS issues with Anthropic SDK in browser
// In production, this should be moved to server-side

// Note: Using direct fetch API to work around CORS issues with Anthropic SDK in browser
// In production, this should be moved to server-side

// Mock Claude service for development - provides realistic demo content
// In production, move to server-side API calls

export class ClaudeService {
  private apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  private async makeRequest(messages: any[], maxTokens = 4000, temperature = 0.7) {
    // Check if we have a valid API key
    if (!this.apiKey || this.apiKey === 'your_anthropic_api_key') {
      console.log('Using mock Claude API for development demo');
      return this.getMockResponse(messages[0].content);
    }

    try {
      // Try to use the backend API first (avoids CORS issues)
      console.log('Using backend API for Claude requests');
      return await this.makeBackendRequest(messages, maxTokens, temperature);
    } catch (error) {
      console.error('Error calling Claude API via backend (trying direct):', error);
      
      // Fallback to direct API call (may have CORS issues)
      try {
        console.log('Trying direct Claude API call');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens,
            temperature,
            messages
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        return await response.json();
      } catch (directError) {
        console.error('Error calling Claude API (trying fallback):', directError);
        console.log('Falling back to mock responses');
        return this.getMockResponse(messages[0].content);
      }
    }
  }

  private async makeBackendRequest(messages: any[], maxTokens: number, temperature: number) {
    const response = await fetch(`${this.baseUrl}/api/claude/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    return await response.json();
  }

  private getMockResponse(prompt: string) {
    // Determine response type based on prompt content
    if (prompt.includes('LinkedIn post')) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            content: "🚀 Just published a new deep-dive into the latest AI trends! Exploring how autonomous agents are reshaping the tech landscape. What's your take on the future of agentic AI?",
            hashtags: ["#AI", "#AgenticAI", "#TechTrends", "#Innovation", "#MachineLearning", "#Automation"]
          })
        }]
      };
    } else if (prompt.includes('trending topics')) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            trends: [
              {
                topic: "Autonomous AI Agents",
                relevanceScore: 9,
                description: "AI systems that can operate independently and make decisions",
                keywords: ["autonomous", "agents", "decision-making"],
                sources: ["TechCrunch", "Hacker News"]
              },
              {
                topic: "Large Language Models",
                relevanceScore: 8,
                description: "Advanced language models with improved reasoning capabilities",
                keywords: ["LLM", "reasoning", "language"],
                sources: ["Reddit", "ArXiv"]
              }
            ],
            summary: "AI continues to advance with more autonomous and capable systems",
            recommendations: ["Focus on practical applications", "Consider ethical implications"]
          })
        }]
      };
    } else {
      // Blog post generation
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: "The Rise of Autonomous AI Agents: Transforming the Digital Landscape",
            metaDescription: "Explore how autonomous AI agents are revolutionizing technology, from automated decision-making to intelligent task execution.",
            content: `# The Rise of Autonomous AI Agents: Transforming the Digital Landscape

## Introduction

The world of artificial intelligence is experiencing a paradigm shift. We're moving beyond simple chatbots and recommendation systems toward truly autonomous AI agents capable of independent decision-making, complex reasoning, and adaptive behavior.

## The Evolution of AI Agents

### From Reactive to Proactive Systems

Traditional AI systems have been largely reactive, responding to specific inputs with predetermined outputs. Today's autonomous agents represent a fundamental leap forward, capable of:

- **Independent Goal Setting**: Agents can establish their own objectives based on high-level directives
- **Dynamic Planning**: Real-time strategy adjustment based on changing conditions
- **Multi-step Reasoning**: Complex problem-solving across extended time horizons

### Key Technological Enablers

Several breakthrough technologies have converged to make autonomous agents possible:

1. **Advanced Language Models**: Providing natural language understanding and generation
2. **Reinforcement Learning**: Enabling agents to learn from experience and improve over time
3. **Tool Integration**: Allowing agents to interact with external systems and APIs
4. **Memory Systems**: Persistent storage of experiences and learned behaviors

## Real-World Applications

### Business Process Automation

Companies are deploying autonomous agents to handle complex workflows that previously required human intervention. These agents can:

- Analyze market data and make trading decisions
- Manage customer service interactions across multiple channels
- Coordinate supply chain operations in real-time

### Software Development

AI agents are increasingly capable of writing, testing, and deploying code with minimal human oversight. This includes:

- Automated bug detection and fixing
- Code optimization and refactoring
- End-to-end application development

## Future Implications

### The Path to Artificial General Intelligence

Autonomous agents represent a crucial stepping stone toward AGI. As these systems become more sophisticated, we can expect:

- **Increased Autonomy**: Agents handling more complex, open-ended tasks
- **Better Human-AI Collaboration**: Seamless integration between human creativity and AI efficiency
- **Ethical AI Development**: Growing focus on alignment and safety measures

### Challenges and Considerations

The rise of autonomous agents also presents significant challenges:

- **Control and Oversight**: Ensuring agents remain aligned with human values
- **Economic Impact**: Potential job displacement and the need for workforce adaptation
- **Security Concerns**: Protecting against malicious use of autonomous systems

## Conclusion

Autonomous AI agents are not just a technological curiosity—they represent the future of human-computer interaction. As these systems continue to evolve, they will fundamentally reshape how we work, create, and solve problems.

The key to success will be thoughtful development that prioritizes safety, transparency, and human benefit. Organizations that embrace this technology while addressing its challenges will be best positioned for the AI-driven future.`,
            excerpt: "Autonomous AI agents are revolutionizing technology by moving beyond reactive systems to proactive, independent decision-makers capable of complex reasoning and adaptive behavior.",
            tags: ["agentic-ai", "autonomous-systems", "artificial-intelligence", "machine-learning", "future-tech"],
            readTime: 8
          })
        }]
      };
    }
  }
  async generateBlogPost(category: string, trends: string[], sources: string[], customPrompt?: string) {
    const categoryPrompts = {
      'agentic-ai': `You are an expert AI researcher and technical writer specializing in autonomous AI systems and intelligent agents. Write a comprehensive, in-depth blog post about the latest trends in agentic AI.`,
      'cybersecurity': `You are a cybersecurity expert and technical writer. Write a comprehensive, in-depth blog post about the latest cybersecurity trends, threats, and defense strategies.`,
      'coding': `You are a senior software engineer and technical writer. Write a comprehensive, in-depth blog post about the latest coding trends, programming languages, frameworks, and best practices.`
    };

    const basePrompt = customPrompt || categoryPrompts[category as keyof typeof categoryPrompts];
    
    const prompt = `${basePrompt}

Based on these current trends and sources:
${trends.map(trend => `- ${trend}`).join('\n')}

Sources:
${sources.map(source => `- ${source}`).join('\n')}

Please write a professional blog post that includes:
1. An engaging title
2. A compelling introduction
3. 3-4 main sections with detailed analysis
4. Real-world examples and case studies
5. Future implications and predictions
6. A strong conclusion
7. SEO-friendly meta description

The post should be:
- 1500-2500 words
- Technically accurate but accessible
- Well-structured with clear headings
- Include relevant keywords naturally
- Professional and authoritative tone
- Include actionable insights

Format the response as JSON with the following structure:
{
  "title": "Blog post title",
  "metaDescription": "SEO meta description (150-160 characters)",
  "content": "Full blog post content in markdown format",
  "excerpt": "Brief excerpt (200-250 characters)",
  "tags": ["tag1", "tag2", "tag3"],
  "readTime": estimated_read_time_in_minutes
}`;

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], 4000, 0.7);

      const content = response.content[0];
      if (content.type === 'text') {
        // Clean up markdown code blocks if present
        let text = content.text.trim();
        
        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        
        return JSON.parse(text);
      }
      
      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      console.error('Error generating content with Claude:', error);
      throw error;
    }
  }

  async generateLinkedInPost(blogTitle: string, blogExcerpt: string, blogUrl: string) {
    const prompt = `Create a professional LinkedIn post to promote this blog article:

Title: ${blogTitle}
Excerpt: ${blogExcerpt}
URL: ${blogUrl}

The LinkedIn post should:
- Be engaging and professional
- Include relevant hashtags (5-8)
- Be 150-300 characters
- Include a call-to-action
- Match LinkedIn's professional tone
- Encourage engagement (likes, comments, shares)

Format as JSON:
{
  "content": "LinkedIn post content",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], 500, 0.8);

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      console.error('Error generating LinkedIn post with Claude:', error);
      throw error;
    }
  }

  async analyzeTrends(category: string, newsData: any[]) {
    const prompt = `Analyze these news articles and identify the top trending topics in ${category}:

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
}`;

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], 2000, 0.3);

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      console.error('Error analyzing trends with Claude:', error);
      throw error;
    }
  }
}

export const claudeService = new ClaudeService();