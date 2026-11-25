import { describe, it, expect } from 'bun:test'
import { renderMermaidAscii } from '../ascii/index.ts'

const MAP = `mindmap
  root
    Origins
      Long history
    Research`

describe('mindmap – ASCII rendering', () => {
  it('renders node labels', () => {
    const out = renderMermaidAscii(MAP, { colorMode: 'none' })
    expect(out).toContain('root')
    expect(out).toContain('Origins')
    expect(out).toContain('Long history')
    expect(out).toContain('Research')
  })

  it('uses tree connectors', () => {
    const out = renderMermaidAscii(MAP, { colorMode: 'none' })
    expect(out).toContain('├')
  })

  it('indents the children of the last child as far as those of the others', () => {
    const out = renderMermaidAscii('mindmap\n  root\n    A\n      A1\n    B\n      B1', { colorMode: 'none' })
    const lines = out.split('\n')
    const a1 = lines.find(l => l.includes('A1'))!
    const b1 = lines.find(l => l.includes('B1'))!
    expect(a1.indexOf('A1')).toBe(b1.indexOf('B1'))
  })
})
