import { useState, useEffect } from 'react';
// CORS Proxy: https://api.allorigins.win/raw?url=
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import Navbar from '../components/Navbar';
import { Play, Loader2, AlertCircle } from 'lucide-react';

export default function Watch() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEpisode, setActiveEpisode] = useState(1);
  const [videoServer, setVideoServer] = useState('vidsrc_xyz'); // 'native', 'vidsrc_xyz', 'vidsrc_to', 'vidsrc_cc', 'multiembed', 'trailer', 'custom'
  const [streamUrl, setStreamUrl] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [fetchStatus, setFetchStatus] = useState('Ready'); 
  const [hasError, setHasError] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [retryInput, setRetryInput] = useState('');
  const [renderMode, setRenderMode] = useState('fetching'); // 'fetching', 'consumet', 'iframe', 'trailer', 'custom'
  const [tmdbId, setTmdbId] = useState(null);

  const SERVERS = {
    vidsrc_xyz: (id, ep) => `https://vidsrc.xyz/embed/anime/${id}/${ep}`,
    vidsrc_to: (id, ep) => `https://vidsrc.to/embed/anime/${id}/${ep}`,
    vidsrc_cc: (id, ep) => `https://vidsrc.cc/v2/embed/anime/${id}/${ep}`,
    multiembed: (id, ep) => `https://multiembed.mov/?video_id=${id}&tmdb=1`
  };

  const fetchTmdbId = async (malId) => {
    try {
      const externalUrl = `https://api.jikan.moe/v4/anime/${malId}/external`;
      console.log(`[Diagnostic] Connecting to server... ${externalUrl}`);
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(externalUrl)}`);
      const data = await res.json();
      const tmdbLink = data.data?.find(link => link.name.toLowerCase().includes('themoviedb'));
      if (tmdbLink) {
        const match = tmdbLink.url.match(/\/(tv|movie)\/(\d+)/);
        if (match && match[2]) {
          console.log(`[ID Mapper] Successfully resolved TMDB ID: ${match[2]}`);
          return match[2];
        }
      }
    } catch (e) {
      console.warn("[ID Mapper] External mapping failed, falling back to Title/MAL ID");
    }
    return null;
  };

  // Reset retry input on anime change
  useEffect(() => {
    if (anime) {
      setCustomSearchQuery('');
      setRetryInput(anime.title_english || anime.title);
    }
  }, [anime]);

  // Multi-Server Iframe & Native Engine
  useEffect(() => {
    let isMounted = true;
    if (!anime) return;

    const safeProxyFetch = async (url) => {
      try {
        console.log(`[Diagnostic] Connecting to server... ${url}`);
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Proxy fetch failed");
        return await res.json();
      } catch (err) {
        console.warn("Proxy fetch error:", err);
        return null;
      }
    };

    const fetchNativeStream = async () => {
      setRenderMode('fetching');
      setFetchStatus('Fetching Native Stream...');
      
      const PROVIDERS = ['gogoanime', 'zoro', 'enime'];
      const titleStr = anime.title_english || anime.title;
      const query = encodeURIComponent(titleStr.replace(/[^a-zA-Z0-9 ]/g, ""));

      for (const provider of PROVIDERS) {
        if (!isMounted) break;
        try {
          // Search
          const searchData = await safeProxyFetch(`https://consumet-api.herokuapp.com/anime/${provider}/${query}`);
          if (!searchData || !searchData.results?.length) continue;
          
          const slugId = searchData.results[0].id;
          
          // Info
          const infoData = await safeProxyFetch(`https://consumet-api.herokuapp.com/anime/${provider}/info/${slugId}`);
          if (!infoData || !infoData.episodes) continue;
          
          const epData = infoData.episodes.find(e => Number(e.number) === activeEpisode);
          if (!epData) continue;
          
          // Stream
          const streamData = await safeProxyFetch(`https://consumet-api.herokuapp.com/anime/${provider}/watch/${epData.id}`);
          if (!streamData || !streamData.sources?.length) continue;
          
          const bestSource = streamData.sources.find(s => s.quality === '1080p') || streamData.sources.find(s => s.quality === 'auto') || streamData.sources[0];
          
          if (bestSource) {
            setStreamUrl(bestSource.url);
            setRenderMode('consumet');
            return true;
          }
        } catch (err) {
          console.warn(`Provider ${provider} failed:`, err);
        }
      }
      return false;
    };

    const initPlayer = async () => {
      const titleStr = anime.title_english || anime.title;
      const cleanTitle = titleStr.replace(/[^a-zA-Z0-9 ]/g, "").split(':')[0].split('-')[0].trim();
      const currentId = tmdbId || id;

      if (videoServer === 'native') {
        const success = await fetchNativeStream();
        if (!success && isMounted) {
          // Fallback to MultiEmbed with Title search if native fails
          setActiveEmbedUrl(`https://multiembed.mov/?video_id=${encodeURIComponent(cleanTitle)}&tmdb=1`);
          setRenderMode('iframe');
        }
      } else if (videoServer.startsWith('vidsrc')) {
        const getUrl = SERVERS[videoServer];
        if (getUrl) {
          setActiveEmbedUrl(getUrl(currentId, activeEpisode));
          setRenderMode('iframe');
        }
      } else if (videoServer === 'multiembed') {
        // MultiEmbed handles both ID and Title gracefully
        setActiveEmbedUrl(`https://multiembed.mov/?video_id=${currentId}&tmdb=1`);
        setRenderMode('iframe');
      } else {
        setRenderMode(videoServer);
      }
    };

    initPlayer();
    return () => { isMounted = false; };
  }, [activeEpisode, videoServer, anime, id, tmdbId]);

  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        setLoading(true);
        const isNumeric = /^\d+$/.test(id);
        let metadata = null;

        if (isNumeric) {
          // Fetch from Jikan (numeric ID)
          const jikanUrl = `https://api.jikan.moe/v4/anime/${id}`;
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(jikanUrl)}`);
          const data = await res.json();
          metadata = data.data;
        } else {
          // Fetch from Consumet (Slug ID)
          const consumetUrl = `https://consumet-api.herokuapp.com/anime/gogoanime/info/${id}`;
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(consumetUrl)}`);
          const data = await res.json();
          // Normalize Consumet info to match Jikan-like structure
          metadata = {
            mal_id: data.id,
            title: typeof data.title === 'object' ? (data.title.english || data.title.romaji || data.title.native) : data.title,
            images: { webp: { large_image_url: data.image } },
            episodes: data.totalEpisodes || data.episodes?.length || '?',
            type: data.type || 'TV',
            score: data.score || 'N/A',
            rating: data.rating || 'N/A',
            synopsis: data.description || '',
            genres: data.genres?.map((g, i) => ({ mal_id: i, name: g })),
            status: data.status || 'Unknown',
            trailer: { embed_url: data.trailer?.embed_url }
          };

          // If Consumet info has real episode data, use it
          if (data.episodes) {
             setEpisodes(data.episodes.map(e => ({ num: e.number, title: `Episode ${e.number}`, id: e.id })));
          }
        }
        
        if (metadata) {
          setAnime(metadata);
          
          if (isNumeric) {
             // Generate dummy episodes for Jikan (kept from original logic)
             const totalEp = metadata.episodes || 24;
             setEpisodes(Array.from({ length: totalEp }, (_, i) => ({
               num: i + 1,
               title: `Episode ${i + 1}`
             })));

             // Resolve TMDB ID for Jikan numeric IDs
             const resolvedTmdb = await fetchTmdbId(id);
             if (resolvedTmdb) setTmdbId(resolvedTmdb);
          }
        }
      } catch (error) {
        console.error("Error fetching watch data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text">
        <Navbar />
        <div className="pt-32 flex justify-center"><div className="animate-pulse w-48 h-10 bg-surface rounded"></div></div>
      </div>
    );
  }

  if (!anime) return <div className="text-white pt-32 text-center text-xl">Anime not found or loading failed.</div>;

  const title = anime.title_english || anime.title;
  const image = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <Navbar />
      <main className="pt-20 pb-12 w-full max-w-[1700px] mx-auto px-4 sm:px-6 flex-1 flex flex-col">
        {/* Breadcrumb Navigation */}
        <div className="text-sm font-medium text-text-muted mb-4 hidden sm:flex items-center gap-2">
           <Link to="/" className="hover:text-[var(--color-brand)] transition-colors">Home</Link>
           <span>/</span>
           <span className="text-text">{title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Main Player Section (Left Side) */}
          <div className="flex-1 lg:w-3/4 flex flex-col min-w-0">
            {/* 16:9 Video Player Embedded IFRAME */}
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/5 relative shadow-2xl">
              {/* Optional Loading and Error Overlay States */}
              {/* Loading Overlay */}
              {renderMode === 'fetching' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black transition-all duration-300">
                  <Loader2 className="w-12 h-12 text-[var(--color-brand)] animate-spin mb-4" />
                  <span className="text-sm font-bold text-[var(--color-brand)] tracking-widest animate-pulse mb-2">{fetchStatus}</span>
                  <span className="text-xs text-text-muted">Analyzing multiple providers...</span>
                </div>
              )}

              {renderMode === 'trailer' ? (
                 anime.trailer?.embed_url ? (
                  <iframe
                    title={`Trailer for ${title}`}
                    src={`${anime.trailer.embed_url}&autoplay=1`}
                    className="w-full h-full border-0 absolute inset-0 bg-black"
                    allowFullScreen
                  ></iframe>
                 ) : (
                  <div className="w-full h-full flex items-center justify-center absolute inset-0 z-10 bg-black">
                    <span className="text-text-muted font-medium">Trailer not available</span>
                  </div>
                 )
              ) : renderMode === 'custom' ? (
                customUrl ? (
                  <ReactPlayer 
                    url={customUrl}
                    controls
                    playing
                    width="100%"
                    height="100%"
                    className="absolute inset-0 bg-black"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center absolute inset-0 gap-4 z-30 bg-black">
                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center animate-pulse">
                      <Play className="w-8 h-8 text-text-muted ml-1" />
                    </div>
                    <span className="text-text-muted font-medium px-4 text-center">Please paste a standard streaming URL (.m3u8, .mp4, youtube)</span>
                  </div>
                )
              ) : renderMode === 'iframe' && activeEmbedUrl ? (
                // Backup Iframe Player
                <iframe
                  key={`${id}-${activeEpisode}-iframe-${activeEmbedUrl}`}
                  title={`Episode ${activeEpisode} Backup Embed`}
                  src={activeEmbedUrl}
                  className="w-full h-full border-0 absolute inset-0 bg-black"
                  allowFullScreen
                ></iframe>
              ) : renderMode === 'consumet' && streamUrl ? (
                // Native Consumet HLS Player
                <ReactPlayer 
                    url={streamUrl}
                    controls
                    playing
                    width="100%"
                    height="100%"
                    className="absolute inset-0 bg-black"
                    config={{ file: { forceHLS: true } }}
                />
              ) : null}
            </div>

            {/* Server selection/Tools Row */}
            <div className="bg-surface/60 p-4 rounded-lg mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-white/5 shadow-sm gap-4">
               <div className="flex gap-4 items-center w-full sm:w-auto">
                  <span className="text-sm font-semibold text-white/80 shrink-0">Switch Provider:</span>
                  <select 
                    value={videoServer}
                    onChange={(e) => setVideoServer(e.target.value)}
                    className="flex-1 sm:w-64 bg-background border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors cursor-pointer"
                  >
                    <option value="vidsrc_xyz">Server 1 (High Quality)</option>
                    <option value="vidsrc_to">Server 2 (Fast)</option>
                    <option value="native">Server 3 (Native Player - Gogoanime)</option>
                    <option value="multiembed">Server 4 (Backup - MultiEmbed)</option>
                    <option value="trailer">Watch Trailer</option>
                    <option value="custom">Custom URL</option>
                  </select>
               </div>
               
               <div className="text-sm font-medium text-text-muted min-w-max bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                  Playing: <strong className="text-white ml-2">Episode {activeEpisode}</strong>
               </div>
            </div>

            {/* Custom URL Input Field */}
            {videoServer === 'custom' && (
              <div className="mt-4 bg-surface/40 p-4 rounded-lg border border-white/5 flex flex-col sm:flex-row gap-4 items-center animate-in fade-in duration-300">
                <span className="text-sm font-medium text-text shrink-0">Embed URL:</span>
                <input 
                  type="text" 
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/embed/..."
                  className="flex-1 w-full bg-background border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] text-white placeholder:text-text-muted transition-colors"
                />
              </div>
            )}

            {/* Meta Info Section */}
            <div className="mt-8 flex flex-col sm:flex-row gap-6 bg-surface/30 p-6 rounded-xl border border-white/5">
               <img src={image} alt={title} className="w-32 sm:w-48 rounded-lg shadow-lg object-cover" />
               <div className="flex-1">
                 <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{title}</h1>
                 
                 {/* Badges */}
                 <div className="flex items-center gap-3 mb-4 text-xs font-bold flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white">{anime.type}</span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-[var(--color-brand)] text-[var(--color-brand)] shadow-sm">Score {anime.score || 'N/A'}</span>
                    <span className="px-2 py-0.5 border border-[#c084fc] text-[#c084fc] bg-[#c084fc]/5 rounded shadow-sm">Episodes {anime.episodes || '?'}</span>
                    <span className="text-text-muted font-medium">{anime.rating}</span>
                 </div>
                 
                 <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{anime.synopsis}</p>
                 
                 {/* Genres block layout */}
                 <div className="mt-4 flex gap-2 flex-wrap">
                    {anime.genres?.map(g => (
                      <span key={g.mal_id} className="text-xs font-medium px-2.5 py-1 rounded bg-surface-hover text-text hover:text-white cursor-pointer transition-colors border border-white/5">{g.name}</span>
                    ))}
                 </div>
               </div>
            </div>
          </div>

          {/* Episode List Sidebar (Right Side) */}
          <div className="w-full lg:w-1/4 lg:max-w-xs flex-shrink-0 flex flex-col h-[60vh] lg:h-[calc(100vh-200px)] lg:sticky lg:top-24">
            <div className="bg-surface/80 backdrop-blur rounded-lg border border-white/5 flex flex-col h-full overflow-hidden shadow-xl">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/5 bg-surface">
                <h3 className="font-bold text-lg text-white">Episodes</h3>
                <div className="flex bg-background border border-white/5 rounded-md mt-3 p-1">
                  <input type="text" placeholder="Search episode..." className="w-full bg-transparent border-none focus:outline-none text-sm px-3 py-1.5 text-text placeholder:text-text-muted" />
                </div>
              </div>
              
              {/* Episodes List Scrollable Layout */}
              <div className="flex-[1_1_100%] overflow-y-auto w-full p-2 space-y-1">
                {episodes.map(ep => (
                  <button 
                    key={ep.num} 
                    onClick={() => setActiveEpisode(ep.num)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center gap-3 group ${activeEpisode === ep.num ? 'bg-[var(--color-brand)] text-zinc-950 font-bold shadow-sm' : 'hover:bg-surface-hover text-text font-medium'}`}
                  >
                    <span className={`w-8 text-center text-xs font-bold ${activeEpisode === ep.num ? 'text-zinc-900' : 'text-text-muted group-hover:text-white'}`}>{ep.num}</span>
                    <span className="text-sm truncate flex-[1_1_100%]">{ep.title}</span>
                    {activeEpisode === ep.num && <Play fill="currentColor" className="w-3 h-3 text-zinc-900" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
