import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dynamoDBService } from '../services/dynamodb';
import type { BlogPost } from '../types';

const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const posts = await dynamoDBService.getAllPosts();
        // Sort by publishedAt and take first 6
        const sortedPosts = posts
          .filter(post => post.status === 'published')
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, 6)
          .map(post => ({
            ...post,
            publishedAt: new Date(post.publishedAt),
            updatedAt: new Date(post.updatedAt),
          })) as BlogPost[];
        setFeaturedPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // For now, show empty state - posts will be created by AI agents
        setFeaturedPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'agentic-ai':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'cybersecurity':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'coding':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">TechPulse</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-powered insights on the latest trends in Agentic AI, Cybersecurity, and Coding
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/blog" 
                className="bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
              >
                Explore Articles
              </Link>
              <Link 
                to="/agents" 
                className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:border-cyber-400 hover:text-cyber-400 transition-all"
              >
                View AI Agents
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-slide-in">
              <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-gray-400">AI Monitoring</div>
            </div>
            <div className="text-center animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold gradient-text mb-2">3</div>
              <div className="text-gray-400">Specialized Agents</div>
            </div>
            <div className="text-center animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold gradient-text mb-2">Auto</div>
              <div className="text-gray-400">Content Publishing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">Latest Insights</h2>
            <Link 
              to="/blog" 
              className="text-cyber-400 hover:text-cyber-300 font-medium transition-colors"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-6 bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : featuredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Posts Yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Your AI agents haven't generated any content yet. Visit the AI Agents page to start monitoring trends and creating posts.
              </p>
              <Link 
                to="/agents" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start AI Agents
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <article 
                  key={post.id} 
                  className="card p-6 hover:scale-105 transition-transform animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(post.category)}`}>
                      {getCategoryIcon(post.category)}
                      {post.category.replace('-', ' ').toUpperCase()}
                    </span>
                    {post.aiGenerated && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-cyber-400/10 text-cyber-400 border border-cyber-400/20">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.readTime} min read</span>
                    <span>{post.publishedAt.toLocaleDateString()}</span>
                  </div>
                  <Link 
                    to={`/blog/${post.id}`}
                    className="absolute inset-0"
                  />
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Explore Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link to="/categories/agentic-ai" className="card p-8 text-center hover:scale-105 transition-transform group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-400/10 flex items-center justify-center group-hover:bg-purple-400/20 transition-colors">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Agentic AI</h3>
              <p className="text-gray-400">Autonomous AI systems and intelligent agents</p>
            </Link>
            <Link to="/categories/cybersecurity" className="card p-8 text-center hover:scale-105 transition-transform group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-400/10 flex items-center justify-center group-hover:bg-red-400/20 transition-colors">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Cybersecurity</h3>
              <p className="text-gray-400">Latest threats, defenses, and security trends</p>
            </Link>
            <Link to="/categories/coding" className="card p-8 text-center hover:scale-105 transition-transform group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-400/20 transition-colors">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Coding</h3>
              <p className="text-gray-400">Programming languages, frameworks, and best practices</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;