import { describe, it, expect } from 'bun:test'
import { renderMermaid } from '../index.ts'

const MAP = `mindmap
  root((Mindmap))
    Origins
      Long history
    Research
      [Shapes]
      (Branches)
      {{Hexagon}}`

describe('mindmap – SVG rendering', () => {
  it('renders without throwing', async () => {
    const svg = await renderMermaid(MAP)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('emits node labels', async () => {
    const svg = await renderMermaid(MAP)
    expect(svg).toContain('Mindmap')
    expect(svg).toContain('Origins')
    expect(svg).toContain('Long history')
  })

  it('emits connector edges between parent and child', async () => {
    const svg = await renderMermaid(MAP)
    expect(svg).toContain('mindmap-edge')
  })

  it('renders shapes', async () => {
    const svg = await renderMermaid(MAP)
    expect(svg).toContain('mindmap-shape')
    expect(svg).toContain('<ellipse')
    expect(svg).toContain('<polygon')
  })

  it('uses CSS variables for colors', async () => {
    const svg = await renderMermaid(MAP)
    expect(svg).not.toContain('NaN')
    expect(svg).toContain('var(--_')
  })
})

describe('mindmap – box colors', () => {
  it("names each node's branch in data-id and writes its colors as attributes, but not the root's", async () => {
    const svg = await renderMermaid('mindmap\n  root\n    A\n      A1\n    B')
    expect(svg).toMatch(/<g class="mindmap-node" data-id="branch-0"[^>]*>[^]*?>A</)
    expect(svg).toMatch(/<g class="mindmap-node" data-id="branch-0"[^>]*>[^]*?>A1</)
    expect(svg).toMatch(/<g class="mindmap-node" data-id="branch-1"[^>]*>[^]*?>B</)
    const root = svg.slice(svg.indexOf('<g class="mindmap-root"'), svg.indexOf('<g class="mindmap-node"'))
    expect(root).not.toContain('var(--_node-fill)')
    expect(svg.match(/class="mindmap-shape" fill="var\(--_node-fill\)"/g)?.length).toBe(3)
  })
})
