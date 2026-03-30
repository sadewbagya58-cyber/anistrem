import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnimeCard({ id, title, image, episode, sub, dub, type }) {
  return (
    <Link to={`/watch/${id}`} className="group relative rounded-lg overflow-hidden block w-full aspect-[3/4] bg-surface">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent opacity-100 transition-opacity duration-300"></div>
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        {sub && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-brand)] text-zinc-950 shadow-md">CC: {sub}</span>}
        {dub && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#c084fc] text-zinc-950 shadow-md">MIC: {dub}</span>}
      </div>

      <div className="absolute top-2 right-2 z-10">
         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface/80 backdrop-blur text-text border border-white/10 shadow-md">{type || 'TV'}</span>
      </div>
      
      {/* Play Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <div className="bg-[var(--color-brand)] rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-[0_0_30px_rgba(163,230,53,0.5)]">
          <Play fill="currentColor" className="text-zinc-950 h-6 w-6 ml-1" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 text-white group-hover:text-[var(--color-brand)] transition-colors">{title}</h3>
        <p className="text-xs text-text-muted flex items-center gap-2">
          {episode && <span className="font-medium text-[var(--color-brand)]">Ep {episode}</span>}
          {episode && <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:block"></span>}
          <span className="hidden sm:block">24m</span>
        </p>
      </div>
    </Link>
  );
}
