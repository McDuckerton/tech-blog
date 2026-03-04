#!/bin/bash

# TechPulse Blog Full Stack Deployment Script
# Deploys both AWS infrastructure and API backend

set -e

ENVIRONMENT=${1:-dev}
DEPLOYMENT_TYPE=${2:-infrastructure-only}  # Options: infrastructure-only, lambda, ecs, full, api-only
STACK_NAME="techpulse-$ENVIRONMENT"
REGION=${AWS_REGION:-us-east-1}

# Map 'full' to 'lambda' for simplicity
if [ "$DEPLOYMENT_TYPE" = "full" ]; then
  DEPLOYMENT_TYPE="lambda"
fi

echo "🚀 Deploying TechPulse Blog Full Stack"
echo "Environment: $ENVIRONMENT"
echo "Deployment Type: $DEPLOYMENT_TYPE"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Function to deploy infrastructure
deploy_infrastructure() {
  echo "📦 Deploying CloudFormation infrastructure..."
  
  # Get the directory where this script is located
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  TEMPLATE_FILE="$SCRIPT_DIR/cloudformation.yaml"
  
  if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ CloudFormation template not found at: $TEMPLATE_FILE"
    exit 1
  fi
  
  aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT DeploymentType=$DEPLOYMENT_TYPE \
    --capabilities CAPABILITY_IAM \
    --region $REGION

  echo "✅ Infrastructure deployed successfully!"
}

# Function to get API key from user
get_api_key() {
  if [ "$DEPLOYMENT_TYPE" != "infrastructure-only" ]; then
    echo "🔑 API Key Configuration Required"
    echo ""
    echo "The API deployment requires an Anthropic API key to function."
    echo "You can get one from: https://console.anthropic.com/"
    echo ""
    
    # Check if key is already set in environment
    if [ -n "$ANTHROPIC_API_KEY" ]; then
      echo "✅ Using ANTHROPIC_API_KEY from environment"
      return 0
    fi
    
    # Check if key exists in existing .env file
    if [ -f "../api/.env" ] && grep -q "ANTHROPIC_API_KEY=" "../api/.env"; then
      EXISTING_KEY=$(grep "ANTHROPIC_API_KEY=" "../api/.env" | cut -d'=' -f2)
      if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "your_anthropic_api_key" ]; then
        echo "✅ Using existing API key from api/.env"
        ANTHROPIC_API_KEY="$EXISTING_KEY"
        return 0
      fi
    fi
    
    # Prompt user for API key
    echo "Please enter your Anthropic API key (or press Enter to skip and set later):"
    read -r ANTHROPIC_API_KEY
    
    if [ -z "$ANTHROPIC_API_KEY" ]; then
      echo "⚠️  No API key provided. The API will deploy but won't work until you:"
      echo "   1. Add your API key to api/.env"
      echo "   2. Redeploy with: ./deploy.sh $ENVIRONMENT api-only"
      ANTHROPIC_API_KEY="your_anthropic_api_key"
    else
      echo "✅ API key configured"
    fi
    echo ""
  fi
}
get_stack_outputs() {
  echo "📋 Getting stack outputs..."
  
  USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

  USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

  IDENTITY_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`IdentityPoolId`].OutputValue' \
    --output text)

  POSTS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PostsTableName`].OutputValue' \
    --output text)

  AGENTS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AgentsTableName`].OutputValue' \
    --output text)

  ASSETS_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AssetsBucketName`].OutputValue' \
    --output text)

  # Try to get API Gateway URL if it exists
  API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

  # Try to get ECS service URL if it exists
  ECS_SERVICE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ECSServiceURL`].OutputValue' \
    --output text 2>/dev/null || echo "")
}

# Function to deploy Lambda API
deploy_lambda_api() {
  echo "🔧 Deploying Lambda API..."
  
  # Check if serverless framework is installed
  if ! command -v serverless &> /dev/null; then
    echo "Installing Serverless Framework..."
    npm install -g serverless
  fi

  # Get proper paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  API_DIR="$(dirname "$SCRIPT_DIR")/api"
  
  echo "Debug: SCRIPT_DIR=$SCRIPT_DIR"
  echo "Debug: API_DIR=$API_DIR"
  
  # Verify API directory exists
  if [ ! -d "$API_DIR" ]; then
    echo "❌ API directory not found at: $API_DIR"
    exit 1
  fi
  
  # Create serverless.yml if it doesn't exist
  if [ ! -f "$API_DIR/serverless.yml" ]; then
    create_serverless_config
  fi

  # Save current directory
  ORIGINAL_DIR=$(pwd)
  
  cd "$API_DIR" || {
    echo "❌ Failed to change to API directory: $API_DIR"
    exit 1
  }
  
  # Install dependencies
  echo "📦 Installing API dependencies..."
  npm install

  # Export environment variables for serverless
  export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your_anthropic_api_key}"
  export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5174}"

  # Deploy with serverless
  echo "🚀 Deploying serverless API..."
  serverless deploy --stage $ENVIRONMENT --region $REGION

  # Return to original directory
  cd "$ORIGINAL_DIR" || {
    echo "⚠️  Warning: Failed to return to original directory"
  }
  
  echo "✅ Lambda API deployed successfully!"
}

# Function to create serverless.yml
create_serverless_config() {
  echo "📝 Creating serverless configuration..."
  
  # Get the directory where this script is located
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  API_DIR="$(dirname "$SCRIPT_DIR")/api"
  
  # Ensure API directory exists
  if [ ! -d "$API_DIR" ]; then
    echo "❌ API directory not found at: $API_DIR"
    exit 1
  fi
  
  cat > "$API_DIR/serverless.yml" << EOF
service: techpulse-api

provider:
  name: aws
  runtime: nodejs18.x
  region: \${opt:region, 'us-east-1'}
  stage: \${opt:stage, 'dev'}
  environment:
    NODE_ENV: production
    REGION: \${self:provider.region}
    DYNAMODB_TABLE_POSTS: techpulse-\${self:provider.stage}-posts
    DYNAMODB_TABLE_AGENTS: techpulse-\${self:provider.stage}-agents
    COGNITO_USER_POOL_ID: \${cf:techpulse-\${self:provider.stage}.UserPoolId}
    COGNITO_CLIENT_ID: \${cf:techpulse-\${self:provider.stage}.UserPoolClientId}
    ANTHROPIC_API_KEY: \${env:ANTHROPIC_API_KEY, '${ANTHROPIC_API_KEY:-your_anthropic_api_key}'}
    FRONTEND_URL: \${env:FRONTEND_URL, '${FRONTEND_URL:-http://localhost:5174}'}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
      Resource:
        - arn:aws:dynamodb:\${self:provider.region}:*:table/techpulse-\${self:provider.stage}-posts
        - arn:aws:dynamodb:\${self:provider.region}:*:table/techpulse-\${self:provider.stage}-agents
        - arn:aws:dynamodb:\${self:provider.region}:*:table/techpulse-\${self:provider.stage}-posts/index/*
    - Effect: Allow
      Action:
        - cognito-idp:GetUser
      Resource: "*"

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
EOF

  # Create lambda handler
  cat > "$API_DIR/lambda.js" << EOF
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
EOF

  echo "✅ Serverless configuration created!"
}

# Function to deploy ECS API
deploy_ecs_api() {
  echo "🐳 Deploying ECS API..."
  
  # Get proper paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  API_DIR="$(dirname "$SCRIPT_DIR")/api"
  
  # Verify API directory exists
  if [ ! -d "$API_DIR" ]; then
    echo "❌ API directory not found at: $API_DIR"
    exit 1
  fi
  
  # Create Dockerfile if it doesn't exist
  if [ ! -f "$API_DIR/Dockerfile" ]; then
    create_dockerfile
  fi

  # Build and push Docker image
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ECR_REPO="techpulse-api-$ENVIRONMENT"
  IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest"

  # Create ECR repository if it doesn't exist
  aws ecr describe-repositories --repository-names $ECR_REPO --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_REPO --region $REGION

  # Login to ECR
  aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

  # Save current directory and build image
  ORIGINAL_DIR=$(pwd)
  
  cd "$API_DIR" || {
    echo "❌ Failed to change to API directory: $API_DIR"
    exit 1
  }
  
  echo "🔨 Building Docker image..."
  docker build -t $ECR_REPO .
  docker tag $ECR_REPO:latest $IMAGE_URI
  
  echo "📤 Pushing to ECR..."
  docker push $IMAGE_URI

  # Return to original directory
  cd "$ORIGINAL_DIR" || {
    echo "⚠️  Warning: Failed to return to original directory"
  }
  
  echo "✅ ECS API deployed successfully!"
}

# Function to create Dockerfile
create_dockerfile() {
  echo "📝 Creating Dockerfile..."
  
  # Get proper paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  API_DIR="$(dirname "$SCRIPT_DIR")/api"
  
  cat > "$API_DIR/Dockerfile" << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
EOF

  echo "✅ Dockerfile created!"
}

# Function to create environment files
create_env_files() {
  echo "📝 Creating environment files..."

  # Get proper paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
  API_DIR="$PROJECT_DIR/api"

  # Create frontend .env
  cat > "$PROJECT_DIR/.env" << EOF
VITE_AWS_REGION=$REGION
VITE_AWS_USER_POOL_ID=$USER_POOL_ID
VITE_AWS_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_AWS_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
VITE_AWS_DYNAMODB_TABLE_POSTS=$POSTS_TABLE
VITE_AWS_DYNAMODB_TABLE_AGENTS=$AGENTS_TABLE
VITE_AWS_S3_BUCKET=$ASSETS_BUCKET

# API Configuration
VITE_API_BASE_URL=${API_GATEWAY_URL:-${ECS_SERVICE_URL:-http://localhost:3001}}

# API Key
VITE_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your_anthropic_api_key}
EOF

  # Create API .env if deploying API
  if [ "$DEPLOYMENT_TYPE" != "infrastructure-only" ]; then
    # Set FRONTEND_URL based on environment
    if [ "$ENVIRONMENT" = "prod" ]; then
      FRONTEND_URL="https://your-production-domain.com"
    else
      FRONTEND_URL="http://localhost:5174"
    fi
    
    cat > "$API_DIR/.env" << EOF
NODE_ENV=production
PORT=3001
AWS_REGION=$REGION
DYNAMODB_TABLE_POSTS=$POSTS_TABLE
DYNAMODB_TABLE_AGENTS=$AGENTS_TABLE
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$USER_POOL_CLIENT_ID

# CORS Configuration
FRONTEND_URL=$FRONTEND_URL

# API Key
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your_anthropic_api_key}

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
  fi
}

# Main deployment flow
main() {
  # Get API key if deploying API
  get_api_key
  
  # Deploy infrastructure unless it's api-only
  if [ "$DEPLOYMENT_TYPE" != "api-only" ]; then
    deploy_infrastructure
  fi
  
  # Always get stack outputs (needed for API deployment)
  get_stack_outputs

  # Deploy API based on type
  case $DEPLOYMENT_TYPE in
    "lambda")
      deploy_lambda_api
      ;;
    "ecs")
      deploy_ecs_api
      ;;
    "api-only")
      echo "🔧 Deploying API only (assuming lambda)..."
      deploy_lambda_api
      ;;
    "infrastructure-only")
      echo "ℹ️  Skipping API deployment (infrastructure-only mode)"
      ;;
    *)
      echo "❌ Invalid deployment type: $DEPLOYMENT_TYPE"
      echo "Valid options: infrastructure-only, lambda, ecs, full, api-only"
      exit 1
      ;;
  esac

  # Create environment files
  create_env_files

  # Display summary
  echo ""
  echo "✅ TechPulse deployment completed successfully!"
  echo ""
  echo "📋 Configuration Summary:"
  echo "Environment: $ENVIRONMENT"
  echo "Deployment Type: $DEPLOYMENT_TYPE"
  echo "User Pool ID: $USER_POOL_ID"
  echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
  echo "Identity Pool ID: $IDENTITY_POOL_ID"
  echo "Posts Table: $POSTS_TABLE"
  echo "Agents Table: $AGENTS_TABLE"
  echo "Assets Bucket: $ASSETS_BUCKET"
  
  if [ -n "$API_GATEWAY_URL" ]; then
    echo "API Gateway URL: $API_GATEWAY_URL"
  fi
  
  if [ -n "$ECS_SERVICE_URL" ]; then
    echo "ECS Service URL: $ECS_SERVICE_URL"
  fi

  echo ""
  echo "🔧 Next Steps:"
  if [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "1. Add your Anthropic API key to .env files"
    echo "   Get one from: https://console.anthropic.com/"
    if [ "$DEPLOYMENT_TYPE" != "infrastructure-only" ]; then
      echo "   Then redeploy API: ./deploy.sh $ENVIRONMENT api-only"
    fi
    STEP_NUM=2
  else
    echo "1. ✅ API key configured"
    STEP_NUM=2
  fi
  
  if [ "$ENVIRONMENT" = "prod" ]; then
    echo "$STEP_NUM. Update FRONTEND_URL in api/.env with your actual domain"
    STEP_NUM=$((STEP_NUM + 1))
  fi
  
  echo "$STEP_NUM. Create admin user:"
  echo "   cd .. && node scripts/create-admin.js"
  STEP_NUM=$((STEP_NUM + 1))
  
  echo "$STEP_NUM. Start frontend development server:"
  echo "   npm run dev"
  
  if [ "$DEPLOYMENT_TYPE" = "infrastructure-only" ]; then
    echo "4. Deploy API separately:"
    echo "   ./deploy.sh $ENVIRONMENT full      # For complete deployment"
    echo "   ./deploy.sh $ENVIRONMENT api-only  # For API updates only"
    echo "   ./deploy.sh $ENVIRONMENT lambda    # For serverless"
    echo "   ./deploy.sh $ENVIRONMENT ecs       # For containers"
  fi

  echo ""
  echo "💰 Budget-Friendly Features:"
  echo "   ✅ Free RSS feeds for trend monitoring"
  echo "   ✅ Reddit API for community insights"
  echo "   ✅ Hacker News integration"
  echo "   ✅ Optimized Claude API usage"
  echo "   📊 Estimated monthly cost: $25-47 (infrastructure-only)"
  
  if [ "$DEPLOYMENT_TYPE" = "lambda" ]; then
    echo "   📊 Additional cost: ~$5-15/month (Lambda API)"
  elif [ "$DEPLOYMENT_TYPE" = "ecs" ]; then
    echo "   📊 Additional cost: ~$15-30/month (ECS API)"
  fi
  
  echo ""
  echo "🗑️  To remove all resources and stop charges:"
  echo "   ./undeploy.sh $ENVIRONMENT"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
  echo "Usage: $0 <environment> [deployment-type]"
  echo ""
  echo "Arguments:"
  echo "  environment      Environment name (dev, staging, prod)"
  echo "  deployment-type  Deployment type (infrastructure-only, lambda, ecs, full, api-only)"
  echo ""
  echo "Deployment Types:"
  echo "  infrastructure-only  Deploy only AWS resources (Cognito, DynamoDB, S3)"
  echo "  lambda              Deploy infrastructure + serverless API (recommended)"
  echo "  ecs                 Deploy infrastructure + containerized API"
  echo "  full                Same as lambda (deploy everything)"
  echo "  api-only            Deploy only the API (assumes infrastructure exists)"
  echo ""
  echo "Examples:"
  echo "  $0 dev                           # Deploy infrastructure only"
  echo "  $0 dev full                      # Deploy everything (infrastructure + API)"
  echo "  $0 dev lambda                    # Deploy infrastructure + Lambda API"
  echo "  $0 dev ecs                       # Deploy infrastructure + ECS API"
  echo "  $0 dev api-only                  # Deploy only API (faster updates)"
  echo "  $0 prod full                     # Deploy production with full stack"
  exit 1
fi

# Run main deployment
main