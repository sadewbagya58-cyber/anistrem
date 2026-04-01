import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

export default function VideoPlayer({ url, poster, title, ...rest }) {
  const artRef = useRef();

  useEffect(() => {
    if (!url) return;

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      poster: poster,
      title: title,
      volume: 0.5,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#a3e635', // Match brand color
      moreVideoAttr: {
        crossOrigin: 'anonymous',
      },
      customType: {
        m3u8: function (video, url) {
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        },
      },
    });

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [url, poster, title]);

  return <div ref={artRef} className="w-full h-full" {...rest}></div>;
}
