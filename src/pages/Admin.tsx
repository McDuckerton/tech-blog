import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dynamoDBService } from '../services/dynamodb';
import type { BlogPost, AIAgent } from '../types';

const Admin = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'agents'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsData, agentsData] = await Promise.all([
          dynamoDBService.getAllPosts(),
          dynamoDBService.getAllAgents()
        ]);

        const formattedPosts = postsData.map(post => ({
          ...post,
          publishedAt: new Date(post.publishedAt),
          updatedAt: new Date(post.updatedAt),
        })) as BlogPost[];

        const formattedAgents = agentsData.map(agent => ({
          ...agent,
          lastRun: new Date(agent.lastRun),
          nextRun: new Date(agent.nextRun),
        })) as AIAgent[];

        setPosts(formattedPosts);
        setAgents(formattedAgents);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await dynamoDBService.deletePost(postId);
        setPosts(posts.filter(post => post.id !== postId));
        alert('Post deleted successfully');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleTogglePostStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await dynamoDBService.updatePost(post.id, {
        ...post,
        status: newStatus
      });
      setPosts(posts.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
      alert(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Failed to update post status');
    }
  };

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.status === 'published').length,
    draftPosts: posts.filter(p => p.status === 'draft').length,
    totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    activeAgents: agents.filter(a => a.isActive).length,
    totalAgents: agents.length
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to access the admin panel.</p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your TechPulse blog content and AI agents</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-cyber-400 border-b-2 border-cyber-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-cyber-400 border-b-2 border-cyber-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'agents'
                ? 'text-cyber-400 border-b-2 border-cyber-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            AI Agents ({agents.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading admin data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-400/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
                        <p className="text-gray-400 text-sm">Total Posts</p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-400/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.publishedPosts}</p>
                        <p className="text-gray-400 text-sm">Published</p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-400/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.activeAgents}</p>
                        <p className="text-gray-400 text-sm">Active Agents</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to="/agents"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Run AI Agents
                    </Link>
                    <Link
                      to="/blog"
                      className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Blog
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Posts Yet</h3>
                    <p className="text-gray-400 mb-6">Generate your first blog post using AI agents.</p>
                    <Link
                      to="/agents"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Content
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="card p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                post.status === 'published' 
                                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                                  : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                              }`}>
                                {post.status}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                {post.category.replace('-', ' ')}
                              </span>
                              {post.aiGenerated && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyber-400/10 text-cyber-400 border border-cyber-400/20">
                                  AI Generated
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Published: {post.publishedAt.toLocaleDateString()}</span>
                              <span>Views: {post.views || 0}</span>
                              <span>Read time: {post.readTime} min</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Link
                              to={`/blog/${post.id}`}
                              className="p-2 text-gray-400 hover:text-cyber-400 transition-colors"
                              title="View Post"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleTogglePostStatus(post)}
                              className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                              title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete Post"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Agents Tab */}
            {activeTab === 'agents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">AI Agents</h2>
                  <Link
                    to="/agents"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage Agents
                  </Link>
                </div>

                {agents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Agents Configured</h3>
                    <p className="text-gray-400">AI agents will appear here once they start running.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                      <div key={agent.id} className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-3 h-3 rounded-full ${agent.isActive ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                          <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{agent.description}</p>
                        <div className="space-y-2 text-xs text-gray-500">
                          <div>Category: {agent.category.replace('-', ' ')}</div>
                          <div>Generated: {agent.generatedPosts} posts</div>
                          <div>Last run: {agent.lastRun.toLocaleDateString()}</div>
                          <div>Next run: {agent.nextRun.toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;