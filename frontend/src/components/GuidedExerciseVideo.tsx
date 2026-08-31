import { useState } from "react";
import { PlayIcon } from "./Icons";

interface GuidedExerciseVideoProps {
  exerciseTitle: string;
  videoId: string;
}

export function GuidedExerciseVideo({ exerciseTitle, videoId }: GuidedExerciseVideoProps) {
  const [activated, setActivated] = useState(false);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  return (
    <section className="guided-video" aria-label={`${exerciseTitle} video guidance`}>
      <div className="guided-video-frame">
        {activated ? (
          <iframe
            src={embedUrl}
            title={`${exerciseTitle} guided exercise video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button className="guided-video-activate" type="button" onClick={() => setActivated(true)}>
            <span className="guided-video-play"><PlayIcon size={34} /></span>
            <span><strong>Play guided video</strong><small>Video stays unloaded until you choose to play it.</small></span>
          </button>
        )}
      </div>
      {activated ? <a className="guided-video-fallback" href={watchUrl} target="_blank" rel="noreferrer">Open on YouTube</a> : null}
    </section>
  );
}
