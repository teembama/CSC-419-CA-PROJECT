import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './GlobalSearch.css';

interface SearchResult {
  id: string;
  type: 'user' | 'order' | 'result' | 'audit' | 'page';
  title: string;
  subtitle?: string;
  link: string;
}

interface GlobalSearchProps {
  userRole: 'admin' | 'technician';
  placeholder?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ userRole, placeholder = 'Search...' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigation links based on user role
  const getNavigationLinks = useCallback((): SearchResult[] => {
    if (userRole === 'admin') {
      return [
        { id: 'nav-1', type: 'page', title: 'Dashboard', subtitle: 'Admin Dashboard', link: '/admin/dashboard' },
        { id: 'nav-2', type: 'page', title: 'User Management', subtitle: 'Manage users and accounts', link: '/admin/user-management' },
        { id: 'nav-3', type: 'page', title: 'Roles & Permissions', subtitle: 'Manage roles and permissions', link: '/admin/roles-permissions' },
        { id: 'nav-4', type: 'page', title: 'Audit Logs', subtitle: 'View system activity logs', link: '/admin/audit-logs' },
        { id: 'nav-5', type: 'page', title: 'Profile', subtitle: 'Your profile settings', link: '/admin/profile' },
      ];
    } else {
      return [
        { id: 'nav-1', type: 'page', title: 'Dashboard', subtitle: 'Lab Technician Dashboard', link: '/technician/dashboard' },
        { id: 'nav-2', type: 'page', title: 'Lab Orders', subtitle: 'View and manage lab orders', link: '/technician/lab-orders' },
        { id: 'nav-3', type: 'page', title: 'Results', subtitle: 'View submitted results', link: '/technician/results' },
        { id: 'nav-4', type: 'page', title: 'Profile', subtitle: 'Your profile settings', link: '/technician/profile' },
      ];
    }
  }, [userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchTimeout = setTimeout(() => {
      // Filter navigation links based on query
      const navLinks = getNavigationLinks();
      const filteredResults = navLinks.filter(
        link =>
          link.title.toLowerCase().includes(query.toLowerCase()) ||
          (link.subtitle && link.subtitle.toLowerCase().includes(query.toLowerCase()))
      );

      setResults(filteredResults);
      setLoading(false);
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [query, getNavigationLinks]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setQuery('');
    setIsOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'order':
        return '📋';
      case 'result':
        return '📊';
      case 'audit':
        return '📝';
      case 'page':
        return '📄';
      default:
        return '🔍';
    }
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="#9ca3af" strokeWidth="2" />
          <path
            d="M13.5 13.5L17 17"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        <span className="search-shortcut">⌘K</span>
      </div>

      {isOpen && (query.trim() || results.length > 0) && (
        <div className="search-dropdown">
          {loading ? (
            <div className="search-loading">Searching...</div>
          ) : results.length === 0 && query.trim() ? (
            <div className="search-no-results">
              No results found for "{query}"
            </div>
          ) : (
            <div className="search-results">
              {results.length > 0 && (
                <div className="search-results-section">
                  <div className="search-results-header">Quick Navigation</div>
                  {results.map(result => (
                    <div
                      key={result.id}
                      className="search-result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <span className="result-icon">{getTypeIcon(result.type)}</span>
                      <div className="result-content">
                        <div className="result-title">{result.title}</div>
                        {result.subtitle && (
                          <div className="result-subtitle">{result.subtitle}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
