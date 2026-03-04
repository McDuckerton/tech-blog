import { useState, useEffect } from 'react';
import { dynamoDBService } from '../services/dynamodb';
import { lambdaService } from '../services/lambda';
import { freeSourcesService } from '../services/freeSources';
import { claudeService } from '../services/claude';
import type { AIAgent } from '../types';

const AIAgents = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    category: 'agentic-ai' as const,
    description: '',
    frequency: 'daily' as const,
    sources: [''],
    prompt: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const agentsData = await dynamoDBService.getAllAgents();
      const formattedAgents = agentsData.map(agent => ({
        ...agent,
        lastRun: new Date(agent.lastRun),
        nextRun: new Date(agent.nextRun),
      })) as AIAgent[];
      setAgents(formattedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    try {
      const agentData = {
        ...newAgent,
        isActive: true,
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        generatedPosts: 0,
        sources: newAgent.sources.filter(s => s.trim() !== '')
      };
      
      await dynamoDBService.createAgent(agentData);
      setShowCreateForm(false);
      setNewAgent({
        name: '',
        category: 'agentic-ai',
        description: '',
        frequency: 'daily',
        sources: [''],
        prompt: ''
      });
      fetchAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const toggleAgent = async (agentId: string, isActive: boolean) => {
    try {
      await dynamoDBService.updateAgent(agentId, { 
        isActive: !isActive,
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      fetchAgents();
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await dynamoDBService.deleteAgent(agentId);
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const runAgent = async (agentId: string, category: string) => {
    setRunningAgent(agentId);
    try {
      console.log('Running agent (budget mode):', agentId);
      
      // Step 1: Fetch trending content from free sources
      const trendingContent = await freeSourcesService.fetchTrendingContent(category);
      console.log(`Found ${trendingContent.length} trending items`);
      
      // Step 2: Extract trending topics
      const keywords = freeSourcesService.extractTrendingKeywords(trendingContent);
      const topTrends = keywords.slice(0, 5).map(k => k.word);
      
      // Step 3: Generate blog post with Claude
      const sources = trendingContent.slice(0, 10).map(item => item.url);
      const blogPost = await claudeService.generateBlogPost(category, topTrends, sources);
      
      // Step 4: Save to database
      await dynamoDBService.createPost({
        ...blogPost,
        category,
        author: 'AI Agent',
        status: 'published',
        publishedAt: new Date().toISOString(),
        aiGenerated: true,
        sources: sources,
        views: 0,
        likes: 0
      });
      
      // Step 5: Update agent stats
      await dynamoDBService.updateAgent(agentId, {
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        generatedPosts: (agents.find(a => a.id === agentId)?.generatedPosts || 0) + 1
      });
      
      alert(`✅ Blog post "${blogPost.title}" generated successfully!`);
      fetchAgents();
      
    } catch (error) {
      console.error('Error running agent:', error);
      alert('❌ Error generating content. Check console for details.');
    } finally {
      setRunningAgent(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'agentic-ai':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'cybersecurity':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'coding':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'agentic-ai':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'cybersecurity':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'coding':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI Agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">AI Agents</h1>
            <p className="text-gray-400">Manage your automated content generation agents</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
          >
            Create Agent
          </button>
        </div>

        {/* Create Agent Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Create New AI Agent</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyber-400"
                    placeholder="AI Security Researcher"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newAgent.category}
                    onChange={(e) => setNewAgent({ ...newAgent, category: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyber-400"
                  >
                    <option value="agentic-ai">Agentic AI</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyber-400"
                    rows={3}
                    placeholder="Monitors cybersecurity trends and generates in-depth analysis..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                  <select
                    value={newAgent.frequency}
                    onChange={(e) => setNewAgent({ ...newAgent, frequency: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyber-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sources</label>
                  {newAgent.sources.map((source, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={source}
                        onChange={(e) => {
                          const newSources = [...newAgent.sources];
                          newSources[index] = e.target.value;
                          setNewAgent({ ...newAgent, sources: newSources });
                        }}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyber-400"
                        placeholder="https://example.com/rss"
                      />
                      <button
                        onClick={() => {
                          const newSources = newAgent.sources.filter((_, i) => i !== index);
                          setNewAgent({ ...newAgent, sources: newSources });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewAgent({ ...newAgent, sources: [...newAgent.sources, ''] })}
                    className="text-cyber-400 hover:text-cyber-300 text-sm"
                  >
                    + Add Source
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">AI Prompt</label>
                  <textarea
                    value={newAgent.prompt}
                    onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyber-400"
                    rows={4}
                    placeholder="You are an expert cybersecurity analyst. Research the latest trends and write a comprehensive blog post..."
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={createAgent}
                  className="bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
                >
                  Create Agent
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="border border-gray-600 text-gray-300 px-6 py-2 rounded-lg font-semibold hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(agent.category)}`}>
                    {getCategoryIcon(agent.category)}
                    {agent.category.replace('-', ' ').toUpperCase()}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${agent.isActive ? 'bg-green-400 animate-pulse-glow' : 'bg-gray-500'}`}></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAgent(agent.id, agent.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      agent.isActive 
                        ? 'text-green-400 hover:bg-green-400/10' 
                        : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => runAgent(agent.id, agent.category)}
                    disabled={runningAgent === agent.id}
                    className={`p-2 rounded-lg transition-colors ${
                      runningAgent === agent.id 
                        ? 'text-yellow-400 animate-pulse' 
                        : 'text-cyber-400 hover:bg-cyber-400/10'
                    }`}
                  >
                    {runningAgent === agent.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">{agent.name}</h3>
              <p className="text-gray-400 mb-4 text-sm">{agent.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Frequency:</span>
                  <span className="text-gray-300 capitalize">{agent.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Posts Generated:</span>
                  <span className="text-gray-300">{agent.generatedPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Run:</span>
                  <span className="text-gray-300">{agent.lastRun.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Run:</span>
                  <span className="text-gray-300">{agent.nextRun.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No AI Agents Yet</h3>
            <p className="text-gray-400 mb-4">Create your first AI agent to start generating automated content</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
            >
              Create Your First Agent
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAgents;