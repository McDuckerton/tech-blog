import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dynamoDBService } from '../services/dynamodb';
import type { BlogPost } from '../types';

const Categories = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const allPosts = await dynamoDBService.getAllPosts();
        const publishedPosts = allPosts
          .filter(post => post.status === 'published')
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .map(post => ({
            ...post,
            publishedAt: new Date(post.publishedAt),
            updatedAt: new Date(post.updatedAt),
          })) as BlogPost[];
        setPosts(publishedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = [
    {
      id: 'agentic-ai',
      name: 'Agentic AI',
      description: 'Autonomous AI systems and intelligent agents',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
      textColor: 'text-purple-400'
    },
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: 'Latest threats, defenses, and security trends',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'from-red-500 to-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      textColor: 'text-red-400'
    },
    {
      id: 'coding',
      name: 'Coding',
      description: 'Programming languages, frameworks, and best practices',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      textColor: 'text-blue-400'
    }
  ];

  const getPostsByCategory = (categoryId: string) => {
    return posts.filter(post => post.category === categoryId);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Categories</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore our content organized by technology domains
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.id} className="card p-8 animate-pulse">
                <div className="w-16 h-16 bg-gray-700 rounded-full mb-6"></div>
                <div className="h-6 bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => {
              const categoryPosts = getPostsByCategory(category.id);
              
              return (
                <div key={category.id} className="card p-8 hover:scale-105 transition-transform group">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${category.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <div className={category.textColor}>
                      {category.icon}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white text-center mb-3">
                    {category.name}
                  </h2>
                  
                  <p className="text-gray-400 text-center mb-6">
                    {category.description}
                  </p>
                  
                  <div className="text-center mb-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${category.bgColor} ${category.textColor} border ${category.borderColor}`}>
                      {categoryPosts.length} {categoryPosts.length === 1 ? 'Post' : 'Posts'}
                    </span>
                  </div>
                  
                  {categoryPosts.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                        Recent Posts
                      </h3>
                      {categoryPosts.slice(0, 3).map((post) => (
                        <Link
                          key={post.id}
                          to={`/blog/${post.id}`}
                          className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <h4 className="text-white text-sm font-medium line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{post.readTime} min read</span>
                            <span>•</span>
                            <span>{post.publishedAt.toLocaleDateString()}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center mb-6 py-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No posts yet</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Link
                      to={`/blog?category=${category.id}`}
                      className={`inline-flex items-center gap-2 bg-gradient-to-r ${category.color} text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all`}
                    >
                      View All
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Want More Content?
            </h2>
            <p className="text-gray-400 mb-6">
              Our AI agents are constantly monitoring trends and generating new insights. 
              Check out the AI Agents page to see them in action.
            </p>
            <Link
              to="/agents"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              View AI Agents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;