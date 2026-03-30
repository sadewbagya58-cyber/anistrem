import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroCarousel from '../components/HeroCarousel';
import AnimeCard from '../components/AnimeCard';
import SidebarRanking from '../components/SidebarRanking';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [top, setTop] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to delay between API calls to prevent Jikan Rate Limits (3 requests/second)
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  useEffect(() => {
    const fetchAnimeData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Trending currently airing anime
        const trendingRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10')}`);
        const trendingData = await trendingRes.json();
        await delay(500); // delay to respect rate limit

        // 2. Fetch Top Anime Overall for the Rankings Sidebar
        const topRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.jikan.moe/v4/top/anime?limit=10')}`);
        const topData = await topRes.json();
        await delay(500);

        // 3. Fetch current season anime for "Recently Updated"
        const recentRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.jikan.moe/v4/seasons/now?limit=8')}`);
        const recentData = await recentRes.json();
        await delay(500);
        
        // 4. Fetch One Piece explicitly for Hero
        const opRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.jikan.moe/v4/anime/21')}`);
        const opData = await opRes.json();

        if (trendingData.data) {
          setTrending(trendingData.data);
        }
        
        if (opData.data) {
          setHero(opData.data);
        } else if (trendingData.data && trendingData.data.length > 0) {
          setHero(trendingData.data[0]);
        }
        
        if (topData.data) {
          setTop(topData.data);
        }
        
        if (recentData.data) {
          setRecentlyUpdated(recentData.data);
        }
      } catch (error) {
        console.error("Error fetching anime data from Jikan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="pb-20">
        {/* Pass the top loaded anime to the Hero Component */}
        <HeroCarousel featured={hero} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 flex flex-col lg:flex-row gap-8 flex-wrap">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-[var(--color-brand)]">Trending</span> Now
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {loading 
                ? [...Array(8)].map((_, i) => <div key={`trend-load-${i}`} className="aspect-[3/4] bg-surface/50 animate-pulse rounded-lg border border-white/5 shadow-sm"></div>) 
                : trending.slice(1, 9).map(anime => (
                  <AnimeCard 
                    key={`trending-${anime.mal_id}`} 
                    id={anime.mal_id}
                    title={anime.title_english || anime.title}
                    image={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
                    episode={anime.episodes}
                    sub={anime.episodes}
                    dub={anime.episodes ? Math.max(1, anime.episodes - 2) : null}
                    type={anime.type}
                  />
                ))
              }
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-6 mt-16 flex items-center gap-2">
              Recently <span className="text-[var(--color-brand)]">Updated</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {loading 
                ? [...Array(8)].map((_, i) => <div key={`recent-load-${i}`} className="aspect-[3/4] bg-surface/50 animate-pulse rounded-lg border border-white/5 shadow-sm"></div>) 
                : recentlyUpdated.map(anime => (
                  <AnimeCard 
                    key={`recent-${anime.mal_id}`} 
                    id={anime.mal_id}
                    title={anime.title_english || anime.title}
                    image={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
                    episode={anime.episodes}
                    sub={anime.episodes}
                    dub={anime.episodes ? Math.max(1, anime.episodes - 2) : null}
                    type={anime.type}
                  />
                ))
              }
            </div>
          </div>
          
          {/* Sidebar Area */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <SidebarRanking rankings={top} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
