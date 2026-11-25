/**
 * Tests for RenderOptions.measureText — replacing the built-in width estimate.
 */
import { describe, it, expect } from 'bun:test'
import { renderMermaidSVG } from '../index.ts'
import { measureTextWidth, withTextMeasurer } from '../text-metrics'
import { estimateMonoTextWidth } from '../styles'
import type { TextMeasureStyle } from '../types'

const viewBoxWidth = (svg: string): number =>
  Number(/viewBox="0 0 ([\d.]+) /.exec(svg)?.[1])

describe('withTextMeasurer', () => {
  it('uses the measured width and keeps the padding', () => {
    const width = withTextMeasurer(() => 100, () => measureTextWidth('abc', 13, 500))
    expect(width).toBeCloseTo(100 + 13 * 0.15)
  })

  it('passes the style, with mono only for monospace text', () => {
    const seen: TextMeasureStyle[] = []
    withTextMeasurer((_text, style) => { seen.push(style); return 10 }, () => {
      measureTextWidth('a', 13, 500)
      expect(estimateMonoTextWidth('a', 11)).toBe(10)
    })
    expect(seen).toEqual([
      { fontSize: 13, fontWeight: 500, mono: false },
      { fontSize: 11, fontWeight: 400, mono: true },
    ])
  })

  it('keeps the estimate for text the measurer returns undefined for', () => {
    const estimate = measureTextWidth('abc', 13, 500)
    expect(withTextMeasurer(() => undefined, () => measureTextWidth('abc', 13, 500))).toBe(estimate)
    expect(withTextMeasurer(() => undefined, () => estimateMonoTextWidth('abc', 11))).toBe(3 * 11 * 0.6)
  })

  it('restores the estimate afterwards, also when drawing throws', () => {
    const estimate = measureTextWidth('abc', 13, 500)
    expect(() => withTextMeasurer(() => 100, () => { throw new Error('draw') })).toThrow('draw')
    expect(measureTextWidth('abc', 13, 500)).toBe(estimate)
  })
})

describe('renderMermaidSVG measureText', () => {
  const source = 'graph LR\n  A[Start] --> B[End]'

  it('sizes boxes from the measured widths', () => {
    const estimated = viewBoxWidth(renderMermaidSVG(source))
    const wide = viewBoxWidth(renderMermaidSVG(source, { measureText: t => t.length * 30 }))
    expect(wide).toBeGreaterThan(estimated + 100)
  })

  it('does not leak into the next render', () => {
    const before = renderMermaidSVG(source)
    renderMermaidSVG(source, { measureText: t => t.length * 30 })
    expect(renderMermaidSVG(source)).toBe(before)
  })
})
