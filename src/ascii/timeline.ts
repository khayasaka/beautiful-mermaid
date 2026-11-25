import type { AsciiConfig, AsciiTheme, ColorMode } from './types.ts'
import { parseTimelineDiagram } from '../timeline/parser.ts'
import { getSeriesColor, CHART_ACCENT_FALLBACK } from '../xychart/colors.ts'
import { colorizeText } from './ansi.ts'

// ============================================================================
// ASCII renderer — Timeline
//
// Renders a timeline as vertical flow: sections top→down, each period
// boxed with its events. Direction is parsed but ASCII always flows vertically.
// ============================================================================

export function renderTimelineAscii(
  text: string,
  config: AsciiConfig,
  colorMode: ColorMode = 'none',
  theme: AsciiTheme = { fg: '', border: '', line: '', arrow: '' },
): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('%%'))
  const diagram = parseTimelineDiagram(lines)

  const H = config.useAscii ? '-' : '─'
  const V = config.useAscii ? '|' : '│'
  const TL = config.useAscii ? '+' : '┌'
  const TR = config.useAscii ? '+' : '┐'
  const BL = config.useAscii ? '+' : '└'
  const BR = config.useAscii ? '+' : '┘'

  // One box per period: the label, then each event on its own line, the
  // later ones lined up under the first.
  //   ┌─────────────────────┐
  //   │ 2024 ─ Alpha        │
  //   │        Beta         │
  //   └─────────────────────┘
  const boxes = diagram.sections.map(section => ({
    // The implicit default section has no heading, as in the SVG renderer
    heading: section.name === 'default' ? undefined : `${section.name}:`,
    periods: section.periods.map(period => {
      if (period.events.length === 0) return [period.label]
      const lead = `${period.label} ${H} `
      const indent = ' '.repeat(lead.length)
      return period.events.map((event, i) => (i === 0 ? lead : indent) + event)
    }),
  }))

  const contentW = Math.max(1, ...boxes.flatMap(b => b.periods.flat().map(r => r.length)))
  const accent = theme.accent ?? CHART_ACCENT_FALLBACK
  const bg = theme.bg
  const colored = (s: string, i: number): string => {
    if (colorMode === 'none') return s
    const hex = i === 0 ? accent : getSeriesColor(i, accent, bg)
    return colorizeText(s, hex, colorMode)
  }

  const out: string[] = []
  if (diagram.title) out.push(diagram.title, '')
  let colorIdx = -1
  for (const box of boxes) {
    if (box.heading) out.push(box.heading)
    for (const rows of box.periods) {
      colorIdx++
      out.push(`${TL}${H.repeat(contentW + 2)}${TR}`)
      for (const row of rows) out.push(`${V} ${colored(row.padEnd(contentW), colorIdx)} ${V}`)
      out.push(`${BL}${H.repeat(contentW + 2)}${BR}`)
      out.push('')
    }
  }

  while (out.length > 0 && out[out.length - 1] === '') out.pop()
  return out.join('\n')
}
