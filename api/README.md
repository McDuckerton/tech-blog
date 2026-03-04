# TechPulse API Server

Production-ready backend API for the TechPulse blog platform.

## Features

- **Claude AI Integration** - Secure server-side API calls to Anthropic Claude
- **AWS Integration** - DynamoDB for data storage, Cognito for authentication
- **Security** - Helmet, CORS, rate limiting, JWT authentication
- **RESTful API** - Clean endpoints for posts, agents, and authentication
- **Error Handling** - Comprehensive error handling and logging

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_CLIENT_ID` - Cognito App Client ID
- `DYNAMODB_TABLE_POSTS` - DynamoDB posts table name
- `DYNAMODB_TABLE_AGENTS` - DynamoDB agents table name

### 3. AWS Credentials

Configure AWS credentials using one of these methods:

**Option A: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Option B: AWS CLI**
```bash
aws configure
```

**Option C: IAM Roles (recommended for production)**

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Posts
- `GET /api/posts` - Get all posts (public)
- `GET /api/posts/:id` - Get single post (public)
- `POST /api/posts` - Create post (authenticated)
- `PUT /api/posts/:id` - Update post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)
- `POST /api/posts/:id/view` - Increment view count (public)

### AI Agents
- `GET /api/agents` - Get all agents (authenticated)
- `GET /api/agents/:id` - Get single agent (authenticated)
- `POST /api/agents` - Create agent (authenticated)
- `PUT /api/agents/:id` - Update agent (authenticated)
- `DELETE /api/agents/:id` - Delete agent (authenticated)

### Claude AI
- `POST /api/claude/generate` - Generate content with Claude (authenticated)
- `POST /api/claude/blog-post` - Generate blog post (authenticated)
- `POST /api/claude/linkedin-post` - Generate LinkedIn post (authenticated)

### Health Check
- `GET /health` - Server health status

## Frontend Integration

Update your frontend Claude service to use the API:

```javascript
// src/services/claude.ts
export class ClaudeService {
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com/api/claude'
    : 'http://localhost:3001/api/claude';

  private async makeRequest(endpoint: string, data: any) {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async generateBlogPost(category: string, trends: string[], sources: string[]) {
    return this.makeRequest('blog-post', { category, trends, sources });
  }
}
```

## Deployment

### Option 1: AWS Lambda + API Gateway

Use the Serverless Framework or AWS SAM for serverless deployment.

### Option 2: AWS ECS/Fargate

Deploy as a containerized application.

### Option 3: Traditional Server

Deploy to EC2, DigitalOcean, or any VPS.

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
# ... other variables
```

## Security Considerations

- **HTTPS Only** - Always use HTTPS in production
- **Environment Variables** - Never commit secrets to version control
- **Rate Limiting** - Configured to prevent abuse
- **CORS** - Restricted to your frontend domain
- **JWT Validation** - All authenticated endpoints verify tokens
- **Input Validation** - Validate all user inputs

## Monitoring

- Health check endpoint at `/health`
- Comprehensive error logging
- Request/response logging in development

## License

MIT License - see LICENSE file for details.