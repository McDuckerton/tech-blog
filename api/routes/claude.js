const express = require('express');
const fetch = require('node-fetch');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Claude API proxy endpoint
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { messages, max_tokens = 4000, temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens,
        temperature,
        messages
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API Error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'Claude API error',
        details: errorData 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Claude API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blog post generation endpoint
router.post('/blog-post', authenticateToken, async (req, res) => {
  try {
    const { category, trends, sources, customPrompt } = req.body;

    const categoryPrompts = {
      'agentic-ai': 'You are an expert AI researcher and technical writer specializing in autonomous AI systems and intelligent agents. Write a comprehensive, in-depth blog post about the latest trends in agentic AI.',
      'cybersecurity': 'You are a cybersecurity expert and technical writer. Write a comprehensive, in-depth blog post about the latest cybersecurity trends, threats, and defense strategies.',
      'coding': 'You are a senior software engineer and technical writer. Write a comprehensive, in-depth blog post about the latest coding trends, programming languages, frameworks, and best practices.'
    };

    const basePrompt = customPrompt || categoryPrompts[category];
    
    const prompt = `${basePrompt}

Based on these current trends and sources:
${trends?.map(trend => `- ${trend}`).join('\n') || 'No specific trends provided'}

Sources:
${sources?.map(source => `- ${source}`).join('\n') || 'No specific sources provided'}

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API Error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'Claude API error',
        details: errorData 
      });
    }

    const data = await response.json();
    const content = data.content[0];
    
    if (content.type === 'text') {
      const blogPost = JSON.parse(content.text);
      res.json(blogPost);
    } else {
      throw new Error('Unexpected response format from Claude');
    }

  } catch (error) {
    console.error('Blog post generation error:', error);
    res.status(500).json({ error: 'Failed to generate blog post' });
  }
});

module.exports = router;