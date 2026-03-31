import { useState, useEffect } from 'react';
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
  const [videoServer, setVideoServer] = useState('embtaku'); // 'embtaku', 's3taku', 'trailer', 'custom'
  const [activeEmbedUrl, setActiveEmbedUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [renderMode, setRenderMode] = useState('loading'); // 'loading', 'iframe', 'trailer', 'custom', 'error'
  const [gogoSlug, setGogoSlug] = useState(null);
  const [mappingError, setMappingError] = useState(false);

  // Embed host domains for Gogoanime - fallback chain
  const EMBED_HOSTS = {
    embtaku: (slug, ep) => `https://embtaku.pro/streaming.php?id=${slug}-episode-${ep}`,
    s3taku: (slug, ep) => `https://s3taku.com/streaming.php?id=${slug}-episode-${ep}`
  };

  // Fetch the Gogoanime slug from MAL-Sync API
  const fetchGogoSlug = async (malId) => {
    try {
      console.log(`[MAL-Sync] Fetching mapping for MAL ID: ${malId}`);
      const res = await fetch(`https://api.malsync.moe/mal/anime/${malId}`);
      if (!res.ok) throw new Error(`MAL-Sync returned ${res.status}`);
      const data = await res.json();
      const sites = data.Sites;
      const slug = sites?.Gogoanime ? Object.keys(sites.Gogoanime)[0] : null;
      if (slug) {
        console.log(`[MAL-Sync] Resolved Gogoanime slug: ${slug}`);
        return slug;
      }
      console.warn('[MAL-Sync] No Gogoanime mapping found in response');
    } catch (e) {
      console.error('[MAL-Sync] Mapping failed:', e.message);
    }
    return null;
  };

  // Generate iframe URL when server, episode, or slug changes
  useEffect(() => {
    if (!anime) return;

    if (videoServer === 'trailer' || videoServer === 'custom') {
      setRenderMode(videoServer);
      return;
    }

    // For Gogoanime embed servers
    if (gogoSlug && EMBED_HOSTS[videoServer]) {
      const url = EMBED_HOSTS[videoServer](gogoSlug, activeEpisode);
      console.log(`[Player] Embed URL: ${url}`);
      setActiveEmbedUrl(url);
      setRenderMode('iframe');
    } else if (!gogoSlug && !mappingError) {
      setRenderMode('loading');
    } else {
      setRenderMode('error');
    }
  }, [activeEpisode, videoServer, anime, gogoSlug, mappingError]);

  // Fetch anime metadata from Jikan + Gogoanime slug from MAL-Sync
  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        setLoading(true);
        setMappingError(false);
        setGogoSlug(null);

        // 1. Fetch metadata from Jikan (MAL) - supports CORS natively
        const jikanUrl = `https://api.jikan.moe/v4/anime/${id}`;
        const res = await fetch(jikanUrl);
        const data = await res.json();
        const metadata = data.data;

        if (metadata) {
          setAnime(metadata);

          // Generate episode list
          const totalEp = metadata.episodes || 24;
          setEpisodes(Array.from({ length: totalEp }, (_, i) => ({
            num: i + 1,
            title: `Episode ${i + 1}`
          })));

          // 2. Resolve Gogoanime slug via MAL-Sync
          const slug = await fetchGogoSlug(id);
          if (slug) {
            setGogoSlug(slug);
          } else {
            setMappingError(true);
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
            {/* 16:9 Video Player */}
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/5 relative shadow-2xl">

              {/* Loading state while resolving MAL-Sync slug */}
              {renderMode === 'loading' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
                  <Loader2 className="w-12 h-12 text-[var(--color-brand)] animate-spin mb-4" />
                  <span className="text-sm font-bold text-[var(--color-brand)] tracking-widest animate-pulse">Resolving Stream...</span>
                </div>
              )}

              {/* Error state if MAL-Sync mapping failed */}
              {renderMode === 'error' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <span className="text-sm font-bold text-red-500 tracking-widest mb-2 uppercase">Stream Unavailable</span>
                  <span className="text-xs text-text-muted px-8 text-center leading-relaxed">Could not find a Gogoanime mapping for this anime. Try the Trailer or Custom URL.</span>
                </div>
              )}

              {renderMode === 'trailer' ? (
                 anime.trailer?.embed_url ? (
                  <iframe
                    title={`Trailer for ${title}`}
                    src={`${anime.trailer.embed_url}&autoplay=1`}
                    className="w-full h-full border-0 absolute inset-0 bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation allow-presentation allow-downloads allow-modals"
                    referrerPolicy="no-referrer"
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
                <iframe
                  key={`${id}-${activeEpisode}-${videoServer}-${activeEmbedUrl}`}
                  title={`${title} - Episode ${activeEpisode}`}
                  src={activeEmbedUrl}
                  className="w-full h-full border-0 absolute inset-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation allow-presentation allow-downloads allow-modals"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                ></iframe>
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
                    <option value="embtaku">Server 1 - Gogoanime (Primary)</option>
                    <option value="s3taku">Server 2 - Gogoanime (Backup)</option>
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
