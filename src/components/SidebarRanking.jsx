import { Link } from 'react-router-dom';

export default function SidebarRanking({ rankings = [] }) {
  if (!rankings.length) {
    return (
      <div className="bg-surface/50 backdrop-blur rounded-xl p-6 border border-white/5 animate-pulse min-h-[500px]">
        <div className="h-6 w-32 bg-surface-hover mb-6 rounded"></div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
             <div key={i} className="flex gap-4 items-center py-1">
                <div className="w-8 h-8 rounded bg-surface"></div>
                <div className="w-12 h-16 rounded bg-surface"></div>
                <div className="flex-1 space-y-2">
                   <div className="h-4 bg-surface rounded w-3/4"></div>
                   <div className="h-3 bg-surface rounded w-1/2"></div>
                </div>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface/50 backdrop-blur rounded-xl p-6 border border-white/5">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-[var(--color-brand)]">Top 10</span> Anime
      </h2>
      <div className="space-y-4">
        {rankings.slice(0, 10).map((anime, index) => {
          const title = anime.title_english || anime.title;
          const image = anime.images?.webp?.image_url || anime.images?.jpg?.image_url;

          return (
            <Link to={`/watch/${anime.mal_id}`} key={anime.mal_id} className="group flex items-center gap-4 py-1">
              <div className={`text-2xl font-black w-8 text-center flex-shrink-0 ${index < 3 ? 'text-[var(--color-brand)]' : 'text-surface-hover group-hover:text-text-muted transition-colors'}`}>
                {index + 1}
              </div>
              <img src={image} alt={title} className="w-12 h-16 rounded object-cover shadow-lg flex-shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-text group-hover:text-[var(--color-brand)] truncate transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-text-muted mt-1 flex gap-2">
                  <span>Score: <strong className="text-white">{anime.score || 'N/A'}</strong></span>
                  <span className="text-white/30">•</span>
                  <span className="text-[var(--color-brand)]">Ep: {anime.episodes || '?'}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
