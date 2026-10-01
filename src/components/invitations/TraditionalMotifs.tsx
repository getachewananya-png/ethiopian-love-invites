import { useId } from "react";
import type { CSSProperties } from "react";

/**
 * Motifs for the Traditional template.
 *
 * The reference for this design is the printed Ethiopian wedding card as it is
 * actually sold in the markets: a rectangle of card stock wrapped on all four
 * edges by *tibeb* (ጥበብ) — the tightly woven cotton border cloth whose diamond
 * lattice comes from the loom itself — with a stepped church cross on top and
 * a coffee-ceremony set below.
 *
 * Everything here is inline SVG with `patternUnits="userSpaceOnUse"` and NO
 * viewBox, which is deliberate: without a viewBox one SVG user unit equals one
 * CSS pixel, so the 24px tibeb tile repeats identically at any container width
 * instead of being stretched into ovals. That keeps the weave crisp on a 375px
 * phone and a 690px sheet alike, with no image files to load.
 */

/** Palette taken from handwoven gabi cloth: madder red, butter yellow, green. */
export const TRADITIONAL_TONES = {
  red: "#a3242f",
  yellow: "#e0a92b",
  green: "#2f6b46",
  cream: "#f7efdd",
  brown: "#5c3a21",
  ink: "#2b1a12",
} as const;

export type TraditionalTone = keyof typeof TRADITIONAL_TONES;

export interface MotifProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * One tile of the tibeb lattice: a madder diamond with a butter centre, laced
 * into the warp by a red weft line and a green warp line.
 */
function TibebTile({ id }: { id: string }) {
  return (
    <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill={TRADITIONAL_TONES.cream} />
      {/* Warp and weft of the loom, laid down before the motif. */}
      <path d="M0 12h24" stroke={TRADITIONAL_TONES.red} strokeWidth="2.5" />
      <path d="M12 0v24" stroke={TRADITIONAL_TONES.green} strokeWidth="2.5" />
      {/* The diamond motif, then its butter core, then the centre pip. */}
      <path d="M12 3l9 9-9 9-9-9z" fill={TRADITIONAL_TONES.red} />
      <path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z" fill={TRADITIONAL_TONES.yellow} />
      <path d="M12 10.5l1.5 1.5-1.5 1.5-1.5-1.5z" fill={TRADITIONAL_TONES.cream} />
    </pattern>
  );
}

/**
 * A border strip of tibeb. `orientation="vertical"` is the same square tile
 * turned on its side for the left and right edges of the card.
 */
export function TibebBand({
  orientation = "horizontal",
  className,
  style,
}: {
  orientation?: "horizontal" | "vertical" | undefined;
} & MotifProps) {
  const id = useId();
  const vertical = orientation === "vertical";
  return (
    <svg
      className={className}
      style={style}
      width={vertical ? 24 : "100%"}
      height={vertical ? "100%" : 24}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <TibebTile id={id} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * The meskel daisy (መስቀፍ) — a butter-yellow rosette that appears on almost every
 * Ethiopian printed card. Same ringed-centre language as the church blooms, but
 * with longer petals so it reads differently beside them.
 */
export function MeskelDaisy({ size = 28, className, style }: { size?: number | undefined } & MotifProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden="true" focusable="false">
      {Array.from({ length: 12 }, (_, index) => (
        <ellipse key={index} cx="50" cy="22" rx="7" ry="22" fill={TRADITIONAL_TONES.yellow} transform={`rotate(${index * 30} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="14" fill={TRADITIONAL_TONES.yellow} />
      <circle cx="50" cy="50" r="9" fill={TRADITIONAL_TONES.red} />
      {Array.from({ length: 6 }, (_, index) => (
        <circle key={index} cx="50" cy="45.5" r="1.1" fill={TRADITIONAL_TONES.yellow} transform={`rotate(${index * 60} 50 50)`} />
      ))}
    </svg>
  );
}

/** Fresh grass laid on the coffee tray — the sign of a ceremony to come. */
export function GrassSprig({ size = 40, className, style }: { size?: number | undefined } & MotifProps) {
  return (
    <svg viewBox="0 0 100 70" width={size} height={(size * 0.7) as number} className={className} style={style} aria-hidden="true" focusable="false">
      <path d="M50 70V26" stroke={TRADITIONAL_TONES.green} strokeWidth="4" strokeLinecap="round" />
      {[
        "M50 56C38 54 30 44 28 32c14 0 22 10 22 24Z",
        "M50 56c12-2 20-12 22-24-14 0-22 10-22 24Z",
        "M50 40c-9-2-15-9-16-18 10 0 16 7 16 18Z",
        "M50 40c9-2 15-9 16-18-10 0-16 7-16 18Z",
        "M50 28c0-9 4-15 11-18 2 10-3 16-11 18Z",
      ].map((d, index) => (
        <path key={index} d={d} fill={TRADITIONAL_TONES.green} opacity="0.9" />
      ))}
    </svg>
  );
}

/**
 * The stepped Lalibela cross, drawn as a symmetric run of rectangles so the
 * silhouette stays true at any size. The inner cross is the same shape scaled
 * down, which is what gives the real carving its double outline.
 */
export function TraditionalCross({ size = 44, className, style }: { size?: number | undefined } & MotifProps) {
  const arm = (
    <g>
      <rect x="40" y="8" width="20" height="84" />
      <rect x="8" y="40" width="84" height="20" />
      <rect x="30" y="20" width="10" height="20" />
      <rect x="60" y="20" width="10" height="20" />
      <rect x="30" y="60" width="10" height="20" />
      <rect x="60" y="60" width="10" height="20" />
      <rect x="20" y="30" width="10" height="10" />
      <rect x="70" y="30" width="10" height="10" />
      <rect x="20" y="60" width="10" height="10" />
      <rect x="70" y="60" width="10" height="10" />
    </g>
  );
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden="true" focusable="false">
      <g fill={TRADITIONAL_TONES.red}>{arm}</g>
      <g fill={TRADITIONAL_TONES.yellow} transform="translate(50 50) scale(0.62) translate(-50 -50)">
        {arm}
      </g>
      <circle cx="50" cy="50" r="7" fill={TRADITIONAL_TONES.cream} />
    </svg>
  );
}

/**
 * Jebena and two cups. Without this the card reads as generic wedding
 * stationery; with it, it reads as an Ethiopian invitation.
 */
export function CoffeeSet({ size = 72, className, style }: { size?: number | undefined } & MotifProps) {
  return (
    <svg viewBox="0 0 160 110" width={size} height={(size * 0.6875) as number} className={className} style={style} aria-hidden="true" focusable="false">
      {/* Handle and spout sit behind the body. */}
      <path d="M62 44c0-18 14-26 26-26s20 8 20 16" fill="none" stroke={TRADITIONAL_TONES.brown} strokeWidth="7" strokeLinecap="round" />
      <path d="M104 40c10-2 16-9 18-19 1-6-4-9-8-5-7 8-11 18-22 19Z" fill={TRADITIONAL_TONES.brown} />
      <path d="M78 36c-26 0-40 14-40 34s16 32 40 32 40-12 40-32-14-34-40-34Z" fill={TRADITIONAL_TONES.brown} />
      <path d="M78 36c-26 0-40 14-40 34s16 32 40 32" fill="none" stroke={TRADITIONAL_TONES.ink} strokeWidth="3" opacity="0.25" />
      {/* Cups on the tray. */}
      <ellipse cx="30" cy="104" rx="13" ry="5" fill={TRADITIONAL_TONES.cream} stroke={TRADITIONAL_TONES.brown} strokeWidth="2.5" />
      <ellipse cx="130" cy="104" rx="13" ry="5" fill={TRADITIONAL_TONES.cream} stroke={TRADITIONAL_TONES.brown} strokeWidth="2.5" />
      <ellipse cx="30" cy="104" rx="7" ry="2.5" fill={TRADITIONAL_TONES.brown} />
      <ellipse cx="130" cy="104" rx="7" ry="2.5" fill={TRADITIONAL_TONES.brown} />
    </svg>
  );
}

/** Daisy-and-leaf rule used to separate the sections of the card. */
export function TraditionalDivider({ className }: { className?: string | undefined }) {
  return (
    <div className={className} aria-hidden="true">
      <i className="traditional-rule" />
      <MeskelDaisy size={13} />
      <MeskelDaisy size={17} className="traditional-rule-center" />
      <MeskelDaisy size={13} />
      <i className="traditional-rule" />
    </div>
  );
}

/**
 * Ambient motion for the public card only.
 *
 * As with the Royal ambience, `compact` is set by the builder and the template
 * preview; skipping the loops there avoids a dozen infinite animations running
 * in an editor frame. Every element is aria-hidden decoration, and all motion is
 * neutralised by the global `prefers-reduced-motion` rule in styles.css.
 */
export function TraditionalAmbience({ compact = false }: { compact?: boolean | undefined }) {
  if (compact) return null;
  return (
    <div className="traditional-ambience" aria-hidden="true">
      <span className="traditional-daisy traditional-daisy-1" />
      <span className="traditional-daisy traditional-daisy-2" />
      <span className="traditional-daisy traditional-daisy-3" />
      <span className="traditional-daisy traditional-daisy-4" />
      <i className="traditional-steam traditional-steam-1" />
      <i className="traditional-steam traditional-steam-2" />
      <i className="traditional-steam traditional-steam-3" />
    </div>
  );
}