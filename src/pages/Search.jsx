import { useState, useEffect } from 'react';
// CORS Proxy: https://api.allorigins.win/get?url=
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AnimeCard from '../components/AnimeCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    
    const fetchSearch = async () => {
      try {
        setLoading(true);
        // Using Jikan api to fetch according to query (wrapped in AllOrigins JSON proxy)
        const jikanUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24&sfw=true`;
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(jikanUrl)}`);
        const data = await res.json();
        const parsed = JSON.parse(data.contents);
        setResults(parsed.data || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-sm font-medium text-text-muted mb-6 flex items-center gap-2">
           <Link to="/" className="hover:text-[var(--color-brand)] transition-colors">Home</Link>
           <span>/</span>
           <span className="text-text">Search results for "{query}"</span>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-8">
          Search Results: <span className="text-[var(--color-brand)]">{query}</span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(10)].map((_, i) => (
               <div key={`search-load-${i}`} className="aspect-[3/4] bg-surface/50 animate-pulse rounded-lg border border-white/5 shadow-md"></div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {results.map(anime => (
              <AnimeCard 
                key={anime.mal_id} 
                id={anime.mal_id}
                title={anime.title_english || anime.title}
                image={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
                episode={anime.episodes}
                sub={anime.episodes}
                dub={anime.episodes ? Math.max(1, anime.episodes - 2) : null}
                type={anime.type}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 text-text-muted">
             <p className="text-xl font-medium">No anime found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
