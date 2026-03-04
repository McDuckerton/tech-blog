const express = require('express');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const client = new DynamoDBClient({ 
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1'
});
const docClient = DynamoDBDocumentClient.from(client);

const AGENTS_TABLE = process.env.DYNAMODB_TABLE_AGENTS;

// Get all agents (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: AGENTS_TABLE
    });

    const result = await docClient.send(command);
    res.json(result.Items || []);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get single agent (authenticated)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const command = new GetCommand({
      TableName: AGENTS_TABLE,
      Key: { id }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create new agent (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const agent = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedPosts: 0
    };

    const command = new PutCommand({
      TableName: AGENTS_TABLE,
      Item: agent
    });

    await docClient.send(command);
    res.status(201).json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent (authenticated)
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
      TableName: AGENTS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    res.json(result.Attributes);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const command = new DeleteCommand({
      TableName: AGENTS_TABLE,
      Key: { id }
    });

    await docClient.send(command);
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

module.exports = router;