import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { dynamoDBService } from '../services/dynamodb';
import type { BlogPost } from '../types';

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all'
  );

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

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Tech Blog</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            AI-powered insights on the latest trends in technology, cybersecurity, and software development
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-cyber-400 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => handleCategoryChange('agentic-ai')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              selectedCategory === 'agentic-ai'
                ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {getCategoryIcon('agentic-ai')}
            Agentic AI
          </button>
          <button
            onClick={() => handleCategoryChange('cybersecurity')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              selectedCategory === 'cybersecurity'
                ? 'bg-gradient-to-r from-red-500 to-red-400 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {getCategoryIcon('cybersecurity')}
            Cybersecurity
          </button>
          <button
            onClick={() => handleCategoryChange('coding')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              selectedCategory === 'coding'
                ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {getCategoryIcon('coding')}
            Coding
          </button>
        </div>

        {/* Posts Grid */}
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
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {selectedCategory === 'all' ? 'No Posts Yet' : `No ${selectedCategory.replace('-', ' ')} Posts Yet`}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {selectedCategory === 'all' 
                ? "Your AI agents haven't generated any content yet. Visit the AI Agents page to start creating posts."
                : `No posts found in the ${selectedCategory.replace('-', ' ')} category. Try a different category or generate new content.`
              }
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <article 
                key={post.id} 
                className="card p-6 hover:scale-105 transition-transform animate-fade-in relative"
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
                <h2 className="text-xl font-semibold text-white mb-3 line-clamp-2">
                  {post.title}
                </h2>
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
    </div>
  );
};

export default Blog;