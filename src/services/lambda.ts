import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = new LambdaClient({ 
  region: import.meta.env.VITE_AWS_REGION,
  credentials: async () => {
    const session = await fetchAuthSession();
    return session.credentials!;
  }
});

export class LambdaService {
  async invokeContentGenerator(agentId: string, category: string) {
    const command = new InvokeCommand({
      FunctionName: 'tech-blog-content-generator',
      Payload: JSON.stringify({
        agentId,
        category,
        timestamp: new Date().toISOString()
      })
    });

    const response = await client.send(command);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    return payload;
  }

  async invokeLinkedInPublisher(postId: string, content: string) {
    const command = new InvokeCommand({
      FunctionName: 'tech-blog-linkedin-publisher',
      Payload: JSON.stringify({
        postId,
        content,
        timestamp: new Date().toISOString()
      })
    });

    const response = await client.send(command);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    return payload;
  }

  async invokeTrendAnalyzer(category: string) {
    const command = new InvokeCommand({
      FunctionName: 'tech-blog-trend-analyzer',
      Payload: JSON.stringify({
        category,
        timestamp: new Date().toISOString()
      })
    });

    const response = await client.send(command);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    return payload;
  }
}

export const lambdaService = new LambdaService();