import { Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroCarousel({ featured }) {
  if (!featured) {
    return (
      <div className="relative w-full h-[70vh] min-h-[500px] sm:h-[80vh] bg-surface animate-pulse flex items-center justify-center">
        <span className="text-text-muted">Loading featured anime...</span>
      </div>
    );
  }

  const title = featured.title_english || featured.title;
  const description = featured.synopsis || "No description available.";
  // We use Jikan's large image for a better quality background hero
  const image = featured.trailer?.images?.maximum_image_url || featured.images?.webp?.large_image_url || featured.images?.jpg?.large_image_url;
  const sub = featured.episodes || '?';
  const dub = featured.episodes ? Math.max(1, featured.episodes - 2) : '?';
  const type = featured.type || 'TV';
  const duration = featured.duration || '24m';

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] sm:h-[80vh] bg-surface">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover object-center opacity-60 mix-blend-screen mix-blend-luminosity"
        />
      </div>
      
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent"></div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center mt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
          <div className="max-w-2xl transform transition-transform duration-700 hover:translate-x-2">
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 line-clamp-2 leading-tight drop-shadow-lg">
              {title}
            </h1>
            
            <div className="flex items-center gap-3 mb-6 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <span className="bg-[var(--color-brand)] text-zinc-950 px-2 py-0.5 rounded shadow whitespace-nowrap">CC: {sub}</span>
                <span className="bg-[#c084fc] text-zinc-950 px-2 py-0.5 rounded shadow whitespace-nowrap">MIC: {dub}</span>
                <span className="bg-surface/80 backdrop-blur text-text px-2 py-0.5 rounded border border-white/10 shadow whitespace-nowrap">{type}</span>
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-white/30"></span>
              <span className="text-text-muted">{duration}</span>
            </div>

            <p className="text-text text-sm sm:text-base mb-8 line-clamp-3 sm:line-clamp-4 leading-relaxed max-w-xl">
              {description}
            </p>

            <div className="flex items-center gap-4">
              <Link to={`/watch/${featured.mal_id}`} className="group flex items-center gap-2 py-3 px-8 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-zinc-950 font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)]">
                <Play fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Now
              </Link>
              <Link to="#" className="flex items-center gap-2 py-3 px-8 bg-surface-hover hover:bg-surface text-text hover:text-white font-medium rounded-full transition-colors duration-300 ring-1 ring-white/10">
                <Info className="w-5 h-5" />
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
