#!/bin/bash

# CloudFormation Template Validation Script

set -e

REGION=${AWS_REGION:-us-east-1}

echo "🔍 Validating CloudFormation template..."

# Validate template syntax
aws cloudformation validate-template \
  --template-body file://cloudformation.yaml \
  --region $REGION

echo "✅ Template validation successful!"
echo ""
echo "📋 Template Summary:"
aws cloudformation validate-template \
  --template-body file://cloudformation.yaml \
  --region $REGION \
  --query 'Description'

echo ""
echo "🏗️  Resources to be created:"
aws cloudformation validate-template \
  --template-body file://cloudformation.yaml \
  --region $REGION \
  --query 'Parameters[*].[ParameterKey,Description]' \
  --output table

echo ""
echo "🚀 Template is ready for deployment!"
echo "Run: ./deploy.sh [environment]"