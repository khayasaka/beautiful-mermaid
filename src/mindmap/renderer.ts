import type { MindmapShape } from './types.ts'
import type { DiagramColors } from '../theme.ts'
import { svgOpenTag, buildStyleBlock } from '../theme.ts'
import { escapeXml } from '../multiline-utils.ts'
import { TEXT_BASELINE_SHIFT, FONT_SIZES, FONT_WEIGHTS } from '../styles.ts'

// ============================================================================
// Mindmap — SVG renderer
//
// Right-growing tree. Root uses accent; descendants use muted/border tones.
// Edges are cubic Beziers from parent right edge to child left edge.
// ============================================================================

export interface PositionedMindmapNode {
  text: string
  shape: MindmapShape
  depth: number
  x: number
  y: number
  width: number
  height: number
  children: PositionedMindmapNode[]
}

export interface PositionedMindmap {
  width: number
  height: number
  title?: { text: string; x: number; y: number }
  root: PositionedMindmapNode
}

const r = (n: number): string => String(Math.round(n * 10) / 10)

function shapePath(node: PositionedMindmapNode, attrs: string): string {
  const { x, y, width, height } = node
  const cx = x + width / 2
  const cy = y
  const rx = width / 2
  const ry = height / 2
  switch (node.shape) {
    case 'circle':
      return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" class="mindmap-shape"${attrs}/>`
    case 'hexagon': {
      const hx = rx / 2
      const pts = [
        `${r(cx + rx)},${r(cy)}`,
        `${r(cx + hx)},${r(cy + ry)}`,
        `${r(cx - hx)},${r(cy + ry)}`,
        `${r(cx - rx)},${r(cy)}`,
        `${r(cx - hx)},${r(cy - ry)}`,
        `${r(cx + hx)},${r(cy - ry)}`,
      ]
      return `<polygon points="${pts.join(' ')}" class="mindmap-shape"${attrs}/>`
    }
    case 'rounded':
      return `<rect x="${r(x)}" y="${r(y - ry)}" width="${r(width)}" height="${r(height)}" rx="10" class="mindmap-shape"${attrs}/>`
    case 'square':
      return `<rect x="${r(x)}" y="${r(y - ry)}" width="${r(width)}" height="${r(height)}" class="mindmap-shape"${attrs}/>`
    case 'default':
    default:
      return `<rect x="${r(x)}" y="${r(y - ry)}" width="${r(width)}" height="${r(height)}" rx="6" class="mindmap-shape"${attrs}/>`
  }
}

function renderEdges(node: PositionedMindmapNode): string {
  const parts: string[] = []
  for (const child of node.children) {
    const x1 = node.x + node.width
    const y1 = node.y
    const x2 = child.x
    const y2 = child.y
    const ctrlX = (x1 + x2) / 2
    parts.push(
      `<path d="M${r(x1)},${r(y1)} C${r(ctrlX)},${r(y1)} ${r(ctrlX)},${r(y2)} ${r(x2)},${r(y2)}" ` +
      `class="mindmap-edge" fill="none"/>`
    )
    parts.push(renderEdges(child))
  }
  return parts.join('\n')
}

// A node's shape takes its fill and outline as attributes, as the boxes of the
// other diagrams do, and its group's data-id names the root's branch it is on,
// so a caller can give each branch its own color. The root keeps the accent
// color from the style block.
const NODE_COLORS = ' fill="var(--_node-fill)" stroke="var(--_node-stroke)" stroke-width="1.5"'

function renderNodes(node: PositionedMindmapNode, isRoot: boolean, branch = 0): string {
  const parts: string[] = []
  const open = isRoot
    ? `<g class="mindmap-root" data-depth="${node.depth}">`
    : `<g class="mindmap-node" data-id="branch-${branch}" data-depth="${node.depth}">`
  parts.push(
    open +
    shapePath(node, isRoot ? '' : NODE_COLORS) +
    `<text x="${r(node.x + node.width / 2)}" y="${r(node.y)}" text-anchor="middle" ` +
    `font-size="${FONT_SIZES.nodeLabel}" font-weight="${isRoot ? 600 : FONT_WEIGHTS.nodeLabel}" ` +
    `dy="${TEXT_BASELINE_SHIFT}" class="mindmap-text">${escapeXml(node.text)}</text></g>`
  )
  node.children.forEach((child, i) => {
    parts.push(renderNodes(child, false, isRoot ? i : branch))
  })
  return parts.join('\n')
}

export function renderMindmapSvg(
  positioned: PositionedMindmap,
  colors: DiagramColors,
  font: string = 'Inter',
  transparent: boolean = false,
): string {
  const { width, height } = positioned
  const parts: string[] = []

  parts.push(svgOpenTag(width, height, colors, transparent))
  parts.push(buildStyleBlock(font, false))

  parts.push(`<style>
  .mindmap-edge { stroke: var(--_line); stroke-width: 1.5; }
  .mindmap-root rect, .mindmap-root ellipse, .mindmap-root polygon { fill: var(--accent, color-mix(in srgb, var(--fg) 85%, var(--bg))); stroke: var(--bg); stroke-width: 2; }
  .mindmap-root .mindmap-text { fill: var(--bg); }
  .mindmap-node .mindmap-text { fill: var(--_text); }
  .mindmap-title { fill: var(--_text); }
</style>`)

  if (positioned.title) {
    parts.push(
      `<text x="${r(positioned.title.x)}" y="${r(positioned.title.y)}" text-anchor="middle" ` +
      `font-size="18" font-weight="600" dy="${TEXT_BASELINE_SHIFT}" class="mindmap-title">${escapeXml(positioned.title.text)}</text>`
    )
  }

  parts.push(renderEdges(positioned.root))
  parts.push(renderNodes(positioned.root, true))
  parts.push('</svg>')
  return parts.join('\n')
}
