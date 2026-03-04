const express = require('express');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand,
  QueryCommand 
} = require('@aws-sdk/lib-dynamodb');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const client = new DynamoDBClient({ 
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1'
});
const docClient = DynamoDBDocumentClient.from(client);

const POSTS_TABLE = process.env.DYNAMODB_TABLE_POSTS;

// Get all posts (public endpoint)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status = 'published' } = req.query;
    
    let command;
    if (category && category !== 'all') {
      command = new QueryCommand({
        TableName: POSTS_TABLE,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        }
      });
    } else {
      command = new ScanCommand({
        TableName: POSTS_TABLE
      });
    }

    const result = await docClient.send(command);
    let posts = result.Items || [];

    // Filter by status if not authenticated or if specifically requested
    if (!req.user || status !== 'all') {
      posts = posts.filter(post => post.status === status);
    }

    // Sort by publishedAt descending
    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post (public endpoint)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const command = new GetCommand({
      TableName: POSTS_TABLE,
      Key: { id }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only return published posts for non-authenticated users
    if (!req.user && result.Item.status !== 'published') {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const post = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0
    };

    const command = new PutCommand({
      TableName: POSTS_TABLE,
      Item: post
    });

    await docClient.send(command);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    const command = new UpdateCommand({
      TableName: POSTS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    res.json(result.Attributes);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const command = new DeleteCommand({
      TableName: POSTS_TABLE,
      Key: { id }
    });

    await docClient.send(command);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Increment post views (public endpoint)
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    const command = new UpdateCommand({
      TableName: POSTS_TABLE,
      Key: { id },
      UpdateExpression: 'ADD #views :increment',
      ExpressionAttributeNames: {
        '#views': 'views'
      },
      ExpressionAttributeValues: {
        ':increment': 1
      }
    });

    await docClient.send(command);
    res.json({ message: 'View count updated' });
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

module.exports = router;