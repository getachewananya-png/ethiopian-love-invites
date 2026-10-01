import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { youtubeVideoId } from "@/lib/invitation";

// Minimal shape of the bits of the IFrame API we touch. Typed locally so the
// project does not need @types/youtube.
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  destroy(): void;
}
interface YTNamespace {
  Player: new (element: HTMLElement | string, options: Record<string, unknown>) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace & { Player: YTNamespace["Player"] };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the IFrame API once per page and resolves when it is ready. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube API loaded without a Player"));
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube API failed to load"));
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

/**
 * Background music for the public invitation.
 *
 * Browsers block audible autoplay until the user interacts with the page, so
 * the player starts muted and offers an explicit unmute. It also loops, drops
 * to a low volume, and never starts in the builder preview (`compact`), which
 * would play audio on every keystroke in the form.
 */
export function BackgroundMusic({ url, compact = false }: { url?: string | undefined; compact?: boolean }) {
  const videoId = youtubeVideoId(url);
  // React owns this wrapper and nothing inside it. The YouTube host is created
  // imperatively inside it, because the IFrame API replaces its host element
  // with an <iframe>. If React rendered the host directly, unmounting would
  // throw "Failed to execute 'removeChild': the node is not a child".
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!videoId || compact) return;
    let cancelled = false;
    const detach: Array<() => void> = [];
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    /** Turns sound on if it is still muted. Safe to call repeatedly. */
    const unmutePlayer = () => {
      const player = playerRef.current;
      if (!player || cancelled) return;
      try {
        if (!player.isMuted()) return;
        player.unMute();
        player.setVolume(35);
        setMuted(false);
      } catch {
        /* still blocked -- the next interaction will retry */
      }
    };

    // Imperative host: invisible to React, safe for YouTube to replace.
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    wrapper.appendChild(host);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !host.isConnected) return;
        const player = new YT.Player(host, {
          videoId,
          playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: videoId, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              if (cancelled) return;
              playerRef.current = event.target;
              try {
                event.target.setVolume(35);
                // Autoplay with sound is blocked by browsers unless the user has
                // interacted with the site, so start muted and unmute below.
                event.target.mute();
                event.target.playVideo();
                setPlaying(true);
              } catch {
                setFailed(true);
              }
              setReady(true);

              // 1) Some contexts (prior interaction, high media engagement,
              //    permissions) allow sound right away -- try it.
              unmutePlayer();
              // 2) Otherwise, the guest's first touch/scroll/keypress turns the
              //    sound on. In practice every guest does this within a second,
              //    so the music feels automatic while staying policy-compliant.
              const nudge = () => unmutePlayer();
              const events = ["pointerdown", "touchstart", "keydown", "scroll", "wheel", "click", "mousemove"];
              for (const type of events) {
                window.addEventListener(type, nudge, { once: true, passive: true });
              }
              detach.push(() => {
                for (const type of events) window.removeEventListener(type, nudge);
              });
            },
            onError: () => !cancelled && setFailed(true),
          },
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      for (const off of detach) off();
      try {
        playerRef.current?.destroy();
      } catch {
        /* YouTube may already have torn it down */
      }
      playerRef.current = null;
      // Remove anything YouTube left behind; the wrapper itself is React's to
      // remove, and its contents are ours.
      while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
    };
  }, [videoId, compact]);

  if (!videoId || compact) return null;
  // Autoplay can be blocked, an ad can fail, or the video may be unplayable.
  if (failed) return null;

  const toggle = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (player.isMuted()) {
        player.unMute();
        player.setVolume(35);
        setMuted(false);
        player.playVideo();
        setPlaying(true);
      } else {
        player.mute();
        setMuted(true);
      }
    } catch {
      setFailed(true);
    }
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (playing) {
        player.pauseVideo();
        setPlaying(false);
      } else {
        player.playVideo();
        setPlaying(true);
      }
    } catch {
      setFailed(true);
    }
  };

  return (
    <>
      {/* React owns only this wrapper. The YouTube iframe is inserted inside it
          imperatively, so reconciliation never touches a YouTube-mutated node. */}
      <div ref={wrapperRef} className="music-embed" aria-hidden="true" />
      {ready && (
        <div className="music-controls">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pause music" : "Play music"}>
            {playing ? <Pause/> : <Play/>}
          </button>
          <button type="button" onClick={toggle} aria-label={muted ? "Unmute music" : "Mute music"}>
            {muted ? <VolumeX/> : <Volume2/>}
          </button>
          <span className={`music-badge ${muted ? "muted" : ""}`}>
            {muted ? <><VolumeX/>Tap for sound</> : <><Music/>Playing</>}
          </span>
        </div>
      )}
    </>
  );
}
