import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand,
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { fetchAuthSession } from 'aws-amplify/auth';

// Create a client that can handle both authenticated and unauthenticated requests
const createDynamoDBClient = async (requireAuth = false) => {
  try {
    if (requireAuth) {
      // For authenticated operations (create, update, delete)
      const session = await fetchAuthSession();
      return new DynamoDBClient({ 
        region: import.meta.env.VITE_AWS_REGION,
        credentials: session.credentials
      });
    } else {
      // For public read operations, use identity pool for unauthenticated access
      const session = await fetchAuthSession();
      return new DynamoDBClient({ 
        region: import.meta.env.VITE_AWS_REGION,
        credentials: session.credentials
      });
    }
  } catch (error) {
    console.log('Using unauthenticated access');
    // Fallback to unauthenticated access
    return new DynamoDBClient({ 
      region: import.meta.env.VITE_AWS_REGION
    });
  }
};

export class DynamoDBService {
  private postsTable = import.meta.env.VITE_AWS_DYNAMODB_TABLE_POSTS;
  private agentsTable = import.meta.env.VITE_AWS_DYNAMODB_TABLE_AGENTS;

  // Blog Posts
  async createPost(post: any) {
    const client = await createDynamoDBClient(true);
    const docClient = DynamoDBDocumentClient.from(client);
    const command = new PutCommand({
      TableName: this.postsTable,
      Item: {
        ...post,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
    return await docClient.send(command);
  }

  async getPost(id: string) {
    try {
      const client = await createDynamoDBClient(false);
      const docClient = DynamoDBDocumentClient.from(client);
      const command = new GetCommand({
        TableName: this.postsTable,
        Key: { id }
      });
      const result = await docClient.send(command);
      return result.Item;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  async getAllPosts() {
    try {
      const client = await createDynamoDBClient(false);
      const docClient = DynamoDBDocumentClient.from(client);
      const command = new ScanCommand({
        TableName: this.postsTable
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Return empty array if there's an error
      return [];
    }
  }

  async getPostsByCategory(category: string) {
    try {
      const client = await createDynamoDBClient(false);
      const docClient = DynamoDBDocumentClient.from(client);
      const command = new QueryCommand({
        TableName: this.postsTable,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        }
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      return [];
    }
  }

  async updatePost(id: string, updates: any) {
    const client = await createDynamoDBClient(true);
    const docClient = DynamoDBDocumentClient.from(client);
    const command = new UpdateCommand({
      TableName: this.postsTable,
      Key: { id },
      UpdateExpression: 'SET #updatedAt = :updatedAt, #title = :title, #content = :content, #status = :status',
      ExpressionAttributeNames: {
        '#updatedAt': 'updatedAt',
        '#title': 'title',
        '#content': 'content',
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':updatedAt': new Date().toISOString(),
        ':title': updates.title,
        ':content': updates.content,
        ':status': updates.status
      }
    });
    return await docClient.send(command);
  }

  async deletePost(id: string) {
    const client = await createDynamoDBClient(true);
    const docClient = DynamoDBDocumentClient.from(client);
    const command = new DeleteCommand({
      TableName: this.postsTable,
      Key: { id }
    });
    return await docClient.send(command);
  }

  // AI Agents
  async createAgent(agent: any) {
    const client = await createDynamoDBClient(true);
    const docClient = DynamoDBDocumentClient.from(client);
    const command = new PutCommand({
      TableName: this.agentsTable,
      Item: {
        ...agent,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
    return await docClient.send(command);
  }

  async getAgent(id: string) {
    try {
      const client = await createDynamoDBClient(false);
      const docClient = DynamoDBDocumentClient.from(client);
      const command = new GetCommand({
        TableName: this.agentsTable,
        Key: { id }
      });
      const result = await docClient.send(command);
      return result.Item;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return null;
    }
  }

  async getAllAgents() {
    try {
      const client = await createDynamoDBClient(false);
      const docClient = DynamoDBDocumentClient.from(client);
      const command = new ScanCommand({
        TableName: this.agentsTable
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  async updateAgent(id: string, updates: any) {
    const client = await createDynamoDBClient(true);
    const docClient = DynamoDBDocumentClient.from(client);
    
    // Build dynamic update expression based on provided updates
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    // Add other fields if they exist in updates
    if (updates.isActive !== undefined) {
      updateExpressions.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = updates.isActive;
    }
    
    if (updates.lastRun !== undefined) {
      updateExpressions.push('#lastRun = :lastRun');
      expressionAttributeNames['#lastRun'] = 'lastRun';
      expressionAttributeValues[':lastRun'] = updates.lastRun;
    }
    
    if (updates.nextRun !== undefined) {
      updateExpressions.push('#nextRun = :nextRun');
      expressionAttributeNames['#nextRun'] = 'nextRun';
      expressionAttributeValues[':nextRun'] = updates.nextRun;
    }
    
    if (updates.generatedPosts !== undefined) {
      updateExpressions.push('#generatedPosts = :generatedPosts');
      expressionAttributeNames['#generatedPosts'] = 'generatedPosts';
      expressionAttributeValues[':generatedPosts'] = updates.generatedPosts;
    }
    
    const command = new UpdateCommand({
      TableName: this.agentsTable,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    });
    
    return await docClient.send(command);
  }

  async deleteAgent(id: string) {
    const client = await createDynamoDBClient(true);
    const docClient = DynamoDBDocumentClient.from(client);
    const command = new DeleteCommand({
      TableName: this.agentsTable,
      Key: { id }
    });
    return await docClient.send(command);
  }
}

export const dynamoDBService = new DynamoDBService();