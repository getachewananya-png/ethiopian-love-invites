import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryLightboxProps {
  images: string[];
  activeIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function GalleryLightbox({
  images,
  activeIndex,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = images.length;
  const isOpen = activeIndex !== null && total > 0;
  const current = isOpen ? ((activeIndex % total) + total) % total : 0;

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        onIndexChange((current + 1) % total);
      } else if (e.key === "ArrowLeft") {
        onIndexChange((current - 1 + total) % total);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, current, total, onClose, onIndexChange]);

  if (!mounted || !isOpen) return null;

  const handleNext = () => {
    onIndexChange((current + 1) % total);
  };

  const handlePrev = () => {
    onIndexChange((current - 1 + total) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (diff > 45) {
      handlePrev();
    } else if (diff < -45) {
      handleNext();
    }
    touchStartX.current = null;
  };

  return createPortal(
    <div
      className="gallery-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen photo view"
    >
      {/* Top action bar: counter & close button */}
      <header
        className="gallery-lightbox-header"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="gallery-lightbox-counter">
          {current + 1} / {total}
        </span>
        <button
          type="button"
          className="gallery-lightbox-close"
          onClick={onClose}
          aria-label="Close fullscreen view"
        >
          <X size={22} />
        </button>
      </header>

      {/* Main image viewing stage */}
      <div
        className="gallery-lightbox-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {total > 1 && (
          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous picture"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <img
          key={images[current]}
          src={images[current]}
          alt={`Wedding moment ${current + 1}`}
          className="gallery-lightbox-main-img"
          onClick={(e) => e.stopPropagation()}
        />

        {total > 1 && (
          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next picture"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Bottom thumbnails strip */}
      {total > 1 && (
        <footer
          className="gallery-lightbox-thumbs"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              className={`gallery-lightbox-thumb-btn ${idx === current ? "is-active" : ""}`}
              onClick={() => onIndexChange(idx)}
              aria-label={`Jump to picture ${idx + 1}`}
            >
              <img src={img} alt="" loading="lazy" />
            </button>
          ))}
        </footer>
      )}
    </div>,
    document.body,
  );
}

