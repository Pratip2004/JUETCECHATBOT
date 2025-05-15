import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Cpu, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import LogoutModal from '../auth/LogoutModal';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  // Update scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // NavLinks component
  const NavLinks: React.FC<{ mobile?: boolean }> = ({ mobile = false }) => {
    const baseClasses = mobile
      ? "block py-3 px-4 text-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
      : "px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800";

    const activeClasses = mobile
      ? "text-primary-700 dark:text-primary-400 font-semibold"
      : "text-primary-700 dark:text-primary-400 font-semibold";

    return (
      <>
        <Link 
          to="/" 
          className={`${baseClasses} ${location.pathname === '/' ? activeClasses : ''}`}
        >
          Home
        </Link>
        <Link
          to="/about"
          className={`${baseClasses} ${location.pathname === '/about' ? activeClasses : ''}`}
        >
          About
        </Link>
        {isAuthenticated && (
          <>
            <Link 
              to="/chat" 
              className={`${baseClasses} ${location.pathname === '/chat' ? activeClasses : ''}`}
            >
              Chat
            </Link>
            <Link 
              to="/profile" 
              className={`${baseClasses} ${location.pathname === '/profile' ? activeClasses : ''}`}
            >
              Profile
            </Link>
          </>
        )}
        <Link 
          to="/contact" 
          className={`${baseClasses} ${location.pathname === '/contact' ? activeClasses : ''}`}
        >
          Contact
        </Link>
        {isAuthenticated ? (
          <button 
            onClick={handleLogoutClick} 
            className={baseClasses}
          >
            Logout
          </button>
        ) : (
          <Link 
            to="/auth" 
            className={`${baseClasses} ${location.pathname === '/auth' ? activeClasses : ''}`}
          >
            Login/SignUp
          </Link>
        )}
      </>
    );
  };

  return (
    <>
      <nav className={`navbar transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className="container-custom">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full">
                <Cpu className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="font-bold text-lg text-gray-900 dark:text-white">EchoLearn</div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              <div className="flex space-x-1 mr-4">
                <NavLinks />
              </div>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {/* Profile Icon (if authenticated) */}
              {isAuthenticated && (
                <Link 
                  to="/profile"
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 ml-2"
                  aria-label="Profile"
                >
                  <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button 
                onClick={toggleTheme}
                className="p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          className="md:hidden pt-2 pb-4"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="container-custom space-y-1">
            <NavLinks mobile />
          </div>
        </motion.div>
      )}

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default Navbar;