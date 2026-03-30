import { useState } from 'react';
import { Search as SearchIcon, Menu, Bell, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="fixed w-full z-50 top-0 transition-colors duration-300 bg-surface/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl font-black italic tracking-tighter text-text">
                ANI<span className="text-[var(--color-brand)]">STREAM</span>
              </span>
            </Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link to="/" className="text-text hover:text-[var(--color-brand)] transition-colors">Home</Link>
              <Link to="#" className="text-text-muted hover:text-text transition-colors">Movies</Link>
              <Link to="#" className="text-text-muted hover:text-text transition-colors">TV Series</Link>
              <Link to="#" className="text-text-muted hover:text-text transition-colors">Top Anime</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden sm:flex relative group">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime..." 
                className="bg-background border border-surface-hover rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all w-64 text-text placeholder:text-text-muted group-hover:border-white/20"
              />
              <button type="submit" className="absolute left-3 top-2.5">
                <SearchIcon className="h-4 w-4 text-text-muted group-hover:text-text transition-colors" />
              </button>
            </form>
            <button className="p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors">
              <User className="h-5 w-5" />
            </button>
            <button className="md:hidden p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
