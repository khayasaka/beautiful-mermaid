import { describe, it, expect } from 'bun:test'
import { renderMermaidAscii } from '../ascii/index.ts'

const DIAGRAM = `timeline
  title Releases
  section 2024
    Q1 : Alpha : Beta
  section 2025
    Q1 : Stable`

describe('timeline – ASCII rendering', () => {
  it('renders section names, periods and events', () => {
    const out = renderMermaidAscii(DIAGRAM, { colorMode: 'none' })
    expect(out).toContain('2024')
    expect(out).toContain('2025')
    expect(out).toContain('Alpha')
    expect(out).toContain('Beta')
    expect(out).toContain('Stable')
  })

  it('renders the title', () => {
    const out = renderMermaidAscii(DIAGRAM, { colorMode: 'none' })
    expect(out).toContain('Releases')
  })

  it('puts each event of a period on its own line, lined up under the first', () => {
    const out = renderMermaidAscii(DIAGRAM, { colorMode: 'none' })
    const lines = out.split('\n')
    const alpha = lines.findIndex(l => l.includes('Alpha'))
    expect(lines[alpha + 1]).toContain('Beta')
    expect(lines[alpha]!.indexOf('Alpha')).toBe(lines[alpha + 1]!.indexOf('Beta'))
    expect(lines[alpha]).not.toContain('Beta')
  })

  it('shows no heading for the implicit default section', () => {
    const out = renderMermaidAscii('timeline\n  2024 : Alpha\n  2025 : Beta', { colorMode: 'none' })
    expect(out).not.toContain('default')
    expect(out).toContain('Alpha')
    expect(out).toContain('Beta')
  })
})
