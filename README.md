# TechPulse - AI-Powered Tech Blog Platform

An intelligent blog platform that uses AI agents to automatically discover trending topics in technology and generate high-quality blog posts. Built with React, TypeScript, AWS, and Claude AI.

## 🚀 Features

- **AI Content Generation**: Automated blog post creation using Claude 3.5 Sonnet
- **Trend Discovery**: Real-time monitoring of tech trends from multiple sources
- **Multi-Category Support**: Agentic AI, Cybersecurity, and Coding topics
- **AWS Integration**: Scalable cloud infrastructure with Cognito, DynamoDB, and S3
- **Modern UI**: Responsive design with Tailwind CSS and smooth animations
- **Admin Dashboard**: Content management and user administration
- **Budget-Friendly**: Optimized for cost-effective operation ($25-47/month)

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation

### Backend Options
- **Lambda Functions** (Serverless) - Recommended for cost efficiency
- **ECS Containers** - For more control and scaling
- **Local Development** - Express.js API server

### AWS Services
- **Cognito** - User authentication and authorization
- **DynamoDB** - NoSQL database for posts and agents
- **S3** - Asset storage
- **CloudFormation** - Infrastructure as Code

### AI & Data Sources
- **Claude 3.5 Sonnet** - Content generation and analysis
- **Free RSS Feeds** - Tech news from major sources
- **Reddit API** - Community discussions and trends
- **Hacker News API** - Developer community insights

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- Anthropic API key (get from [console.anthropic.com](https://console.anthropic.com/))
- Git for version control

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd tech-blog
npm install
cd api && npm install && cd ..
```

### 2. Deploy Infrastructure
```bash
cd infrastructure
./deploy.sh dev full  # Deploys everything (infrastructure + API)
```

### 3. Create Admin User
```bash
node scripts/create-admin.js
```

### 4. Start Development
```bash
# Start backend API (in one terminal)
cd api && npm start

# Start frontend (in another terminal)
npm run dev
```

## 🛠️ Deployment Options

### Infrastructure Only
```bash
./deploy.sh dev infrastructure-only
```

### Full Stack (Infrastructure + Lambda API)
```bash
./deploy.sh dev full
# or
./deploy.sh dev lambda
```

### ECS Container Deployment
```bash
./deploy.sh dev ecs
```

### API Updates Only
```bash
./deploy.sh dev api-only
```

## 🗑️ Cleanup

Remove all AWS resources to stop charges:
```bash
cd infrastructure
./undeploy.sh dev
```

## 📁 Project Structure

```
tech-blog/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── services/          # API and external service integrations
│   └── contexts/          # React context providers
├── api/                   # Backend Express.js API
│   ├── routes/           # API route handlers
│   ├── middleware/       # Authentication and security
│   └── server.js         # Main server file
├── infrastructure/        # AWS deployment scripts
│   ├── cloudformation.yaml # Infrastructure as Code
│   ├── deploy.sh         # Deployment automation
│   └── undeploy.sh       # Cleanup automation
├── scripts/              # Utility scripts
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```bash
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=your_user_pool_id
VITE_AWS_USER_POOL_CLIENT_ID=your_client_id
VITE_AWS_IDENTITY_POOL_ID=your_identity_pool_id
VITE_AWS_DYNAMODB_TABLE_POSTS=your_posts_table
VITE_AWS_DYNAMODB_TABLE_AGENTS=your_agents_table
VITE_AWS_S3_BUCKET=your_s3_bucket
VITE_API_BASE_URL=http://localhost:3001
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Backend (api/.env)**
```bash
NODE_ENV=production
PORT=3001
REGION=us-east-1
DYNAMODB_TABLE_POSTS=your_posts_table
DYNAMODB_TABLE_AGENTS=your_agents_table
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
FRONTEND_URL=http://localhost:5174
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 💰 Cost Estimation

### Budget-Friendly Setup (Infrastructure Only)
- **DynamoDB**: ~$5-10/month (pay-per-request)
- **Cognito**: Free tier (up to 50,000 MAUs)
- **S3**: ~$1-5/month (depending on usage)
- **Total**: ~$25-47/month

### With Lambda API
- **Additional**: ~$5-15/month
- **Total**: ~$30-62/month

### With ECS API
- **Additional**: ~$15-30/month
- **Total**: ~$40-77/month

## 🔐 Security Features

- **JWT Authentication** with AWS Cognito
- **Rate Limiting** on API endpoints
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **Helmet.js** security headers
- **Environment Variable** protection

## 🤖 AI Agent Categories

### Agentic AI
- Autonomous AI systems
- Multi-agent frameworks
- AI reasoning and planning
- Tool-using AI

### Cybersecurity
- Threat intelligence
- Security tools and techniques
- Vulnerability research
- Security best practices

### Coding
- Programming languages and frameworks
- Development tools and practices
- Software architecture
- Code quality and testing

## 📚 API Documentation

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

**Posts**
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create new post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

**Claude AI**
- `POST /api/claude/generate` - Generate content (auth required)
- `POST /api/claude/blog-post` - Generate blog post (auth required)

**Agents**
- `GET /api/agents` - List AI agents
- `POST /api/agents` - Create agent (auth required)

## 🛠️ Development

### Local Development Setup
1. Start the backend API: `cd api && npm start`
2. Start the frontend: `npm run dev`
3. Access at `http://localhost:5174`

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI
- [AWS](https://aws.amazon.com/) for cloud infrastructure
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- Open source RSS feeds and APIs for content sources

## 📞 Support

For questions and support:
- Create an issue in this repository
- Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions
- Review the [COST_ESTIMATE.md](COST_ESTIMATE.md) for pricing information

---

**Built with ❤️ and AI**