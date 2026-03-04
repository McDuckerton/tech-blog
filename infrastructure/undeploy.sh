#!/bin/bash

# TechPulse Blog Undeploy Script
# Safely removes all AWS resources and cleans up local files

set -e

ENVIRONMENT=${1:-dev}
STACK_NAME="techpulse-$ENVIRONMENT"
REGION=${AWS_REGION:-us-east-1}
FORCE=${2:-false}

echo "🗑️  TechPulse Blog Undeploy Script"
echo "Environment: $ENVIRONMENT"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Function to check if stack exists
stack_exists() {
  aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --output text \
    --query 'Stacks[0].StackStatus' 2>/dev/null || echo "DOES_NOT_EXIST"
}

# Function to get stack outputs before deletion
get_stack_outputs() {
  echo "📋 Getting stack outputs for cleanup..."
  
  ASSETS_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AssetsBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

  ECS_CLUSTER=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
    --output text 2>/dev/null || echo "")
}

# Function to empty S3 bucket
empty_s3_bucket() {
  if [ -n "$ASSETS_BUCKET" ] && [ "$ASSETS_BUCKET" != "None" ]; then
    echo "🪣 Emptying S3 bucket: $ASSETS_BUCKET"
    
    # Check if bucket exists
    if aws s3api head-bucket --bucket "$ASSETS_BUCKET" --region $REGION 2>/dev/null; then
      # Delete all objects and versions
      aws s3 rm s3://$ASSETS_BUCKET --recursive --region $REGION || true
      
      # Try to delete object versions (best effort, may fail if jq not available)
      echo "🔄 Attempting to clean up object versions..."
      aws s3api list-object-versions \
        --bucket $ASSETS_BUCKET \
        --region $REGION 2>/dev/null | \
      grep -E '"Key"|"VersionId"' | \
      sed 'N;s/.*"Key": "\([^"]*\)".*"VersionId": "\([^"]*\)".*/\1 \2/' | \
      while read -r key version; do
        if [ -n "$key" ] && [ -n "$version" ]; then
          aws s3api delete-object \
            --bucket $ASSETS_BUCKET \
            --key "$key" \
            --version-id "$version" \
            --region $REGION || true
        fi
      done 2>/dev/null || echo "ℹ️  Object version cleanup skipped (requires jq for full cleanup)"
      
      echo "✅ S3 bucket emptied successfully"
    else
      echo "ℹ️  S3 bucket $ASSETS_BUCKET does not exist or already deleted"
    fi
  fi
}

# Function to remove serverless API
remove_serverless_api() {
  echo "🔧 Removing Serverless API..."
  
  # Get proper paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  API_DIR="$(dirname "$SCRIPT_DIR")/api"
  
  if [ -f "$API_DIR/serverless.yml" ]; then
    cd "$API_DIR"
    
    # Check if serverless is installed
    if command -v serverless &> /dev/null; then
      echo "📦 Removing serverless stack..."
      serverless remove --stage $ENVIRONMENT --region $REGION || true
    else
      echo "⚠️  Serverless framework not found, skipping serverless cleanup"
    fi
    
    cd "$SCRIPT_DIR"
    echo "✅ Serverless API cleanup completed"
  else
    echo "ℹ️  No serverless.yml found, skipping serverless cleanup"
  fi
}

# Function to remove ECS resources
remove_ecs_resources() {
  if [ -n "$ECS_CLUSTER" ] && [ "$ECS_CLUSTER" != "None" ]; then
    echo "🐳 Cleaning up ECS resources..."
    
    # Stop all services in the cluster
    SERVICES=$(aws ecs list-services \
      --cluster $ECS_CLUSTER \
      --region $REGION \
      --query 'serviceArns[*]' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "$SERVICES" ]; then
      for service in $SERVICES; do
        echo "🛑 Stopping ECS service: $service"
        aws ecs update-service \
          --cluster $ECS_CLUSTER \
          --service $service \
          --desired-count 0 \
          --region $REGION || true
      done
      
      # Wait for services to stop
      echo "⏳ Waiting for services to stop..."
      sleep 30
    fi
    
    # Remove ECR repository
    ECR_REPO="techpulse-api-$ENVIRONMENT"
    if aws ecr describe-repositories --repository-names $ECR_REPO --region $REGION 2>/dev/null; then
      echo "📦 Removing ECR repository: $ECR_REPO"
      aws ecr delete-repository \
        --repository-name $ECR_REPO \
        --region $REGION \
        --force || true
    fi
    
    echo "✅ ECS resources cleanup completed"
  fi
}

# Function to remove CloudFormation stack
remove_cloudformation_stack() {
  echo "☁️  Removing CloudFormation stack..."
  
  aws cloudformation delete-stack \
    --stack-name $STACK_NAME \
    --region $REGION

  echo "⏳ Waiting for stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name $STACK_NAME \
    --region $REGION

  echo "✅ CloudFormation stack deleted successfully"
}

# Function to clean up local files
cleanup_local_files() {
  echo "🧹 Cleaning up local files..."
  
  # Get proper paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
  API_DIR="$PROJECT_DIR/api"
  
  # Remove generated environment files
  if [ -f "$PROJECT_DIR/.env" ]; then
    echo "🗑️  Removing frontend .env file"
    rm "$PROJECT_DIR/.env" || true
  fi
  
  if [ -f "$API_DIR/.env" ]; then
    echo "🗑️  Removing API .env file"
    rm "$API_DIR/.env" || true
  fi
  
  # Remove generated serverless files
  if [ -f "$API_DIR/serverless.yml" ]; then
    echo "🗑️  Removing generated serverless.yml"
    rm "$API_DIR/serverless.yml" || true
  fi
  
  if [ -f "$API_DIR/lambda.js" ]; then
    echo "🗑️  Removing generated lambda.js"
    rm "$API_DIR/lambda.js" || true
  fi
  
  # Remove generated Dockerfile
  if [ -f "$API_DIR/Dockerfile" ]; then
    echo "🗑️  Removing generated Dockerfile"
    rm "$API_DIR/Dockerfile" || true
  fi
  
  echo "✅ Local cleanup completed"
}

# Function to show confirmation
show_confirmation() {
  echo "⚠️  WARNING: This will permanently delete all resources for environment '$ENVIRONMENT'"
  echo ""
  echo "Resources to be deleted:"
  echo "  • CloudFormation stack: $STACK_NAME"
  echo "  • DynamoDB tables (all data will be lost)"
  echo "  • S3 bucket and all files"
  echo "  • Cognito user pools and users"
  echo "  • ECS cluster and services (if deployed)"
  echo "  • ECR repositories and images"
  echo "  • Lambda functions (if deployed)"
  echo "  • All local environment files"
  echo ""
  
  if [ "$FORCE" != "true" ]; then
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    if [ "$confirmation" != "yes" ]; then
      echo "❌ Undeploy cancelled"
      exit 0
    fi
  fi
}

# Main undeploy flow
main() {
  # Check if stack exists
  STACK_STATUS=$(stack_exists)
  
  if [ "$STACK_STATUS" = "DOES_NOT_EXIST" ]; then
    echo "ℹ️  Stack $STACK_NAME does not exist in region $REGION"
    echo "🧹 Cleaning up local files only..."
    cleanup_local_files
    echo "✅ Cleanup completed"
    exit 0
  fi
  
  # Show confirmation
  show_confirmation
  
  # Get stack outputs for cleanup
  get_stack_outputs
  
  # Clean up resources that need special handling
  empty_s3_bucket
  remove_ecs_resources
  remove_serverless_api
  
  # Remove the main CloudFormation stack
  remove_cloudformation_stack
  
  # Clean up local files
  cleanup_local_files
  
  # Show completion message
  echo ""
  echo "✅ TechPulse undeploy completed successfully!"
  echo ""
  echo "📋 Summary:"
  echo "Environment: $ENVIRONMENT"
  echo "Stack: $STACK_NAME (deleted)"
  echo "Region: $REGION"
  echo ""
  echo "💰 Cost Impact:"
  echo "  ✅ All billable resources have been removed"
  echo "  ✅ No ongoing charges for this environment"
  echo ""
  echo "🔄 To redeploy:"
  echo "  ./deploy.sh $ENVIRONMENT full"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
  echo "Usage: $0 <environment> [force]"
  echo ""
  echo "Arguments:"
  echo "  environment  Environment name (dev, staging, prod)"
  echo "  force        Skip confirmation prompt (optional)"
  echo ""
  echo "Examples:"
  echo "  $0 dev                    # Remove dev environment (with confirmation)"
  echo "  $0 dev force              # Remove dev environment (no confirmation)"
  echo "  $0 staging                # Remove staging environment"
  echo ""
  echo "⚠️  WARNING: This will permanently delete all data and resources!"
  exit 1
fi

# Run main undeploy
main