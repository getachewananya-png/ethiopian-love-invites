import type { CSSProperties } from "react";

/**
 * Hand-drawn Ethiopian church-art florals.
 *
 * These are deliberately GEOMETRIC rather than photoreal: Ethiopian Orthodox
 * church painting renders blooms as layered, evenly-spaced petals around a
 * ringed centre. That flatness is the authentic style, and it also means the
 * mark stays crisp at any size -- no image files, no loading, no broken-image
 * risk, ~1 KB for the whole set.
 */

/** Palettes tuned to the Royal Tewahedo burgundy/gold/cream scheme. */
export const BLOOM_TONES = {
  wine: { petal: "#8f2436", center: "#c9a227", ring: "#f0d9a8" },
  gold: { petal: "#c9a227", center: "#8f2436", ring: "#fbf5e9" },
  cream: { petal: "#f2e6cf", center: "#c9a227", ring: "#8f2436" },
  leaf: { petal: "#4a6b4f", center: "#c9a227", ring: "#e8dfc9" },
} as const;

export type BloomTone = keyof typeof BLOOM_TONES;

export interface EthiopianBloomProps {
  /** Rendered width/height in px. The viewBox keeps it scalable. */
  size?: number | undefined;
  /** Petal count. 6 reads as a rosette; 8 is denser. */
  petals?: number | undefined;
  tone?: BloomTone | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * A single bloom: `petals` ellipses rotated evenly around a ringed centre.
 * Always decorative, so it is hidden from assistive tech by default.
 */
export function EthiopianBloom({
  size = 24,
  petals = 6,
  tone = "wine",
  className,
  style,
}: EthiopianBloomProps) {
  const colors = BLOOM_TONES[tone];
  const step = 360 / petals;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Petals, fanned out from the base of each petal toward the rim. */}
      {Array.from({ length: petals }, (_, index) => (
        <ellipse
          key={index}
          cx="50"
          cy="28"
          rx="12"
          ry="20"
          fill={colors.petal}
          opacity="0.92"
          transform={`rotate(${index * step} 50 50)`}
        />
      ))}
      {/* Concentric rings: the ringed centre is the signature church motif. */}
      <circle cx="50" cy="50" r="15" fill={colors.petal} />
      <circle cx="50" cy="50" r="11" fill={colors.ring} />
      <circle cx="50" cy="50" r="6.5" fill={colors.center} />
      {/* Stamen dots, to read as detail once the bloom is scaled up. */}
      {Array.from({ length: 6 }, (_, index) => (
        <circle
          key={index}
          cx="50"
          cy="45.2"
          r="1.15"
          fill={colors.ring}
          transform={`rotate(${index * 60} 50 50)`}
        />
      ))}
    </svg>
  );
}

/**
 * A leafy sprig used to fill gaps in a garland. Mirrors the bloom's
 * geometric language instead of using a realistic leaf shape.
 */
export function BloomLeaf({
  size = 18,
  tone = "leaf",
  className,
  style,
}: {
  size?: number | undefined;
  tone?: BloomTone | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 38C20 22 12 14 4 10c0 14 6 24 16 28Z" fill={BLOOM_TONES[tone].petal} />
      <path
        d="M20 38C20 22 28 14 36 10c0 14-6 24-16 28Z"
        fill={BLOOM_TONES[tone].petal}
        opacity="0.78"
      />
      <rect x="19" y="14" width="2" height="26" rx="1" fill={BLOOM_TONES.gold.center} />
    </svg>
  );
}

/**
 * A vine draped across the top of the arch, with blooms and leaves threaded
 * along it. Bloom positions are sampled off the same quadratic curve the
 * <path> draws, so the flowers genuinely sit on the vine.
 */
const GARLAND_POINTS: ReadonlyArray<{ x: number; y: number; tone: BloomTone }> = [
  { x: 8, y: 18, tone: "wine" },
  { x: 79, y: 34.5, tone: "gold" },
  { x: 150, y: 40, tone: "cream" },
  { x: 221, y: 34.5, tone: "gold" },
  { x: 292, y: 18, tone: "wine" },
];

const GARLAND_LEAVES: ReadonlyArray<{ x: number; y: number; flip: boolean }> = [
  { x: 43, y: 26, flip: false },
  { x: 114, y: 37.5, flip: true },
  { x: 186, y: 37.5, flip: false },
  { x: 257, y: 26, flip: true },
];

export function BloomGarland({ className }: { className?: string | undefined }) {
  return (
    <div className={className} aria-hidden="true">
      <svg
        className="royal-garland-vine"
        viewBox="0 0 300 70"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          d="M8 18 Q150 62 292 18"
          fill="none"
          stroke="#4a6b4f"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {GARLAND_LEAVES.map((leaf, index) => (
        <BloomLeaf
          key={index}
          className="royal-garland-leaf"
          size={13}
          tone="leaf"
          // Mirrored on alternating leaves so the vine reads as a single stem.
          style={{
            left: `${(leaf.x / 300) * 100}%`,
            top: `${(leaf.y / 70) * 100}%`,
            transform: leaf.flip ? "translate(-50%,-50%) scaleX(-1)" : "translate(-50%,-50%)",
          }}
        />
      ))}
      {GARLAND_POINTS.map((point, index) => (
        <EthiopianBloom
          key={index}
          className="royal-garland-bloom"
          size={index === 2 ? 17 : 13}
          tone={point.tone}
          style={{
            left: `${(point.x / 300) * 100}%`,
            top: `${(point.y / 70) * 100}%`,
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Ambient decoration: falling petals and gliding birds.
 *
 * These loops are decorative and never carry content, so they are rendered
 * ONLY on the public invitation page. The builder and the template preview
 * also render InvitationRenderer, and running ~19 infinite animations in an
 * editor preview would burn battery for no visual gain. `Royal` gates them
 * behind `compact`.
 *
 * Every petal gets a distinct left/delay/duration via inline custom
 * properties so the layer never looks like a single repeating loop, and the
 * whole thing is aria-hidden decorative noise.
 */

/** Petal fall choreography. Kept here so the array stays next to its renderer. */
const PETALS: ReadonlyArray<{
  left: number;
  delay: number;
  duration: number;
  drift: number;
  scale: number;
}> = [
  { left: 4, delay: 0, duration: 13, drift: 34, scale: 1 },
  { left: 11, delay: 2.4, duration: 15.5, drift: -26, scale: 0.82 },
  { left: 17, delay: 5.1, duration: 12.5, drift: 40, scale: 0.94 },
  { left: 24, delay: 1.2, duration: 17, drift: -32, scale: 0.76 },
  { left: 30, delay: 7.8, duration: 14, drift: 28, scale: 1 },
  { left: 37, delay: 3.6, duration: 16, drift: -22, scale: 0.88 },
  { left: 43, delay: 9.4, duration: 12, drift: 36, scale: 0.72 },
  { left: 49, delay: 0.8, duration: 15, drift: -30, scale: 1 },
  { left: 55, delay: 6.2, duration: 13.5, drift: 24, scale: 0.9 },
  { left: 61, delay: 4.1, duration: 17.5, drift: -36, scale: 0.8 },
  { left: 67, delay: 8.6, duration: 12.8, drift: 30, scale: 0.96 },
  { left: 73, delay: 1.9, duration: 15.8, drift: -26, scale: 0.74 },
  { left: 79, delay: 5.7, duration: 13.2, drift: 38, scale: 1 },
  { left: 85, delay: 10.3, duration: 16.2, drift: -30, scale: 0.86 },
  { left: 91, delay: 3.2, duration: 12.4, drift: 26, scale: 0.92 },
  { left: 97, delay: 7.1, duration: 15.2, drift: -34, scale: 0.78 },
];

/**
 * @param compact Set on builder/template previews, where ambient loops are skipped.
 */
export function RoyalAmbience({ compact = false }: { compact?: boolean | undefined }) {
  if (compact) return null;
  return (
    <>
      <div className="royal-sky" aria-hidden="true">
        {/* Birds fly above the arch on long, offset loops. */}
        <i className="royal-bird royal-bird-1" />
        <i className="royal-bird royal-bird-2" />
        <i className="royal-bird royal-bird-3" />
      </div>
      <div className="royal-petals" aria-hidden="true">
        {PETALS.map((petal, index) => (
          <i
            key={index}
            className="royal-petal"
            style={
              {
                left: `${petal.left}%`,
                animationDelay: `${petal.delay}s`,
                animationDuration: `${petal.duration}s`,
                // Per-petal sway amplitude, consumed by the petal keyframes.
                "--petal-drift": `${petal.drift}px`,
                "--petal-scale": petal.scale,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
export function BloomDivider({ className }: { className?: string | undefined }) {
  return (
    <div className={className} aria-hidden="true">
      <i className="bloom-rule" />
      <EthiopianBloom size={13} tone="wine" />
      <EthiopianBloom size={17} tone="gold" className="bloom-rule-center" />
      <EthiopianBloom size={13} tone="wine" />
      <i className="bloom-rule" />
    </div>
  );
}
