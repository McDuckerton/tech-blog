# TechPulse Blog - Budget-Friendly Setup Guide

## 🚀 Quick Start (Budget Mode: $25-47/month)

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Required API Keys (Budget-Friendly)

#### Anthropic Claude API (Primary Cost: ~$8-15/month)
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create account and get API key
3. Add to `.env`: `VITE_ANTHROPIC_API_KEY=your_key_here`

#### LinkedIn API (Free)
1. Go to [LinkedIn Developers](https://developer.linkedin.com)
2. Create app for "Sign In with LinkedIn"
3. Add to `.env`:
   ```
   VITE_LINKEDIN_CLIENT_ID=your_client_id
   VITE_LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

### 3. AWS Infrastructure Deployment

```bash
# Make deploy script executable
chmod +x infrastructure/deploy.sh

# Deploy to AWS (requires AWS CLI configured)
cd infrastructure
./deploy.sh dev

# This creates:
# - Cognito User Pool (Free)
# - DynamoDB Tables (Free tier: 25GB)
# - Lambda Functions (Free tier: 1M requests)
# - S3 Bucket (Free tier: 5GB)
```

### 4. Create Admin User

```bash
# After deployment, create admin user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin \
  --user-attributes Name=email,Value=your-email@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

### 5. Start Development

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

## 🎯 Budget-Friendly Features

### Free Content Sources
- ✅ **RSS Feeds**: 20+ tech blogs and news sites
- ✅ **Reddit API**: Community trends and discussions
- ✅ **Hacker News**: Top tech stories
- ✅ **No paid News API required**

### Optimized AI Usage
- ✅ **Claude 3.5 Sonnet**: High-quality content generation
- ✅ **Smart token management**: ~4k tokens per post
- ✅ **Batch processing**: Multiple trends per request
- ✅ **Caching**: Avoid duplicate API calls

### AWS Free Tier Benefits
- ✅ **DynamoDB**: 25GB free storage
- ✅ **Lambda**: 1M free requests/month
- ✅ **S3**: 5GB free storage
- ✅ **Cognito**: 50k free MAUs

## 📊 Usage Scenarios

### Light Usage (10 posts/month): ~$12/month
- Claude API: $4
- AWS: $6
- LinkedIn: Free
- Sources: Free

### Medium Usage (30 posts/month): ~$18/month
- Claude API: $12
- AWS: $6
- LinkedIn: Free
- Sources: Free

### Heavy Usage (60 posts/month): ~$30/month
- Claude API: $24
- AWS: $6
- LinkedIn: Free
- Sources: Free

## 🔧 Configuration Tips

### 1. Optimize Claude Usage
```javascript
// In claude.ts, use efficient prompts
const prompt = `Write a ${wordCount}-word blog post about ${topic}...`;
// Instead of: "Write a comprehensive detailed analysis..."
```

### 2. Smart Content Scheduling
- Run agents during off-peak hours
- Batch multiple topics per API call
- Cache trending topics for reuse

### 3. Free Source Rotation
```javascript
// Rotate RSS feeds to avoid rate limits
const feeds = shuffleArray(allFeeds).slice(0, 3);
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free)
```bash
npm run build
# Deploy to Vercel with environment variables
```

### Option 2: AWS Amplify
```bash
# Connect GitHub repo to Amplify
# Auto-deploy on push
```

### Option 3: Netlify (Free)
```bash
npm run build
# Deploy dist/ folder to Netlify
```

## 📈 Scaling Strategy

### Month 1-3: Validate ($25/month)
- 20-30 posts/month
- Build audience
- Test engagement

### Month 4-6: Optimize ($35/month)
- 40-50 posts/month
- Add newsletter
- Monetize with affiliates

### Month 7+: Scale ($50+/month)
- 60+ posts/month
- Sponsored content
- Premium features

## 🎯 Success Metrics

### Content Quality
- Average read time: 3-5 minutes
- Social shares: 10+ per post
- Comments/engagement: 5+ per post

### Traffic Growth
- Month 1: 1,000 visitors
- Month 3: 5,000 visitors
- Month 6: 15,000 visitors

### Revenue Targets
- Month 3: Break-even ($25)
- Month 6: $200/month profit
- Month 12: $1,000/month profit

## 🔍 Troubleshooting

### Common Issues

1. **Claude API Errors**
   ```bash
   # Check API key
   curl -H "x-api-key: $VITE_ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
   ```

2. **AWS Permissions**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   ```

3. **CORS Issues**
   ```javascript
   // Add to vite.config.ts
   server: {
     proxy: {
       '/api': 'http://localhost:3001'
     }
   }
   ```

## 📞 Support

- **Documentation**: Check README.md
- **Issues**: Create GitHub issue
- **Community**: Join Discord (link in README)

---

**Ready to launch your AI-powered tech blog for just $25/month!** 🚀