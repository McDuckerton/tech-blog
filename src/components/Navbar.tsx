import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyber-400 flex items-center justify-center animate-pulse-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">TechPulse</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-cyber-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/blog" 
              className={`text-sm font-medium transition-colors ${
                isActive('/blog') ? 'text-cyber-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Blog
            </Link>
            <Link 
              to="/categories" 
              className={`text-sm font-medium transition-colors ${
                isActive('/categories') ? 'text-cyber-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Categories
            </Link>
            {currentUser && (
              <>
                <Link 
                  to="/admin" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/admin') ? 'text-cyber-400' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Admin
                </Link>
                <Link 
                  to="/agents" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/agents') ? 'text-cyber-400' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  AI Agents
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            )}
            {!currentUser && (
              <Link 
                to="/login" 
                className="bg-gradient-to-r from-blue-500 to-cyber-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-cyber-400/50 transition-all"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-800">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/blog" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link 
              to="/categories" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Categories
            </Link>
            {currentUser && (
              <>
                <Link 
                  to="/admin" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Admin
                </Link>
                <Link 
                  to="/agents" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  AI Agents
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            )}
            {!currentUser && (
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;