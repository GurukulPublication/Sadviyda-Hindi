/**
 * THE ONE FILE TO EDIT IF YOU WANT TO CHANGE THE LOOK.
 *
 * Every colour in the dashboard comes from here — the Tailwind classes
 * (bg-cream, text-brand …), the charts, the score bars and the badges.
 * tailwind.config.ts imports `palette` from this file, so there is no second
 * list of colours to keep in sync.
 *
 * The palette follows the Sadvidya / Shree Swaminarayan Gurukul design:
 * a warm cream page, the Gurukul red as the primary accent, and the
 * red-orange-yellow-green-blue family for data.
 */

/** The core palette. */
export const palette = {
  /** Page background. */
  cream: '#F7F3EA',
  /** Card background. */
  card: '#FDFBF6',
  /** Text. */
  ink: '#22201C',
  /** Softer text, captions, italic notes. */
  olive: '#6B6B52',
  /** Faintest text (hints, placeholders). */
  muted: '#A89F86',

  /** Gurukul red — the primary accent, used for buttons and key numbers. */
  brand: '#E30613',
  /** Pressed / hover state of the red. */
  brandDark: '#C00510',
  /** Deep blue, used for links and the score-journey line. */
  blue: '#1D4F9C',

  /** Hairline borders and dividers. */
  border: '#E8DFD0',
  /** Panel tint, progress-bar troughs. */
  sand: '#EFE8DA',
  /** The footer band. */
  footer: '#EDE5D6',

  /** The dark panel behind the score bars. */
  night: '#22201C',

  /** Score bands (see scoreColor below) and chart series. */
  green: '#7AB929',
  greenDark: '#4F8A12',
  yellow: '#FFCC00',
  orange: '#F39200',
  ember: '#C9782A',

  /** Tinted panels on the article page. */
  tintGreen: '#F1F6E6',
  tintPeach: '#FDEBD0',
  tintBlue: '#E8EEF7',
  tintYellow: '#FFF1D6',
} as const

/**
 * A score's colour, on the flame scale: green is a radiant flame, amber is
 * burning low. Used by the score bars, the article scores and the stat cards.
 */
export function scoreColor(score: number): string {
  if (score >= 9) return palette.green
  if (score >= 8) return palette.yellow
  if (score >= 7) return palette.orange
  return palette.ember
}

/** The four parameter colours, used by the charts and the flag groups. */
export const series = {
  meaningDrift: palette.blue,
  naturalPhrasing: palette.orange,
  termConsistency: palette.yellow,
  voiceConviction: palette.olive,
} as const

/** Chart furniture: axes, grid lines, the target line and tooltips. */
export const chart = {
  axisText: palette.olive,
  grid: palette.border,
  /** The score-journey line. */
  line: palette.blue,
  /** The area under it. */
  area: 'rgba(29, 79, 156, 0.08)',
  /** The dotted 8.0 target line. */
  target: palette.orange,
  /** Radar: all-time average (filled) and the latest article (dashed). */
  radarAverage: palette.blue,
  radarLatest: palette.brand,
  tooltipBackground: palette.card,
  tooltipBorder: 'rgba(34, 32, 28, 0.12)',
  tooltipRadius: 12,
} as const

/** Fonts. Also mirrored into Tailwind by tailwind.config.ts. */
export const fonts = {
  /** Headings, numbers and most UI text. */
  heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  /** Body copy and the italic notes. */
  body: ['Lora', 'Georgia', 'serif'],
  /** Any Hindi or Gujarati text. */
  deva: ['"Noto Sans Devanagari"', 'Lora', 'serif'],
} as const
