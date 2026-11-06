import type { ReactElement, ReactNode } from 'react'
import { wpc_mediaUrl } from './api'

/**
 * 把一行里的强调、代码和图片收成节点。
 */
const wpc_renderInline = (text: string): ReactNode => {
  const pattern = /!\[([^\]]*)\]\(asset:([a-zA-Z0-9-]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) nodes.push(text.slice(last, index))
    if (match[2]) {
      nodes.push(<img key={key} className="md-img" alt={match[1] || '图片'} src={wpc_mediaUrl(match[2])} />)
    } else if (match[3]) {
      nodes.push(<strong key={key}>{match[3]}</strong>)
    } else if (match[4]) {
      nodes.push(<code key={key}>{match[4]}</code>)
    } else if (match[5]) {
      nodes.push(<em key={key}>{match[5]}</em>)
    }
    key += 1
    last = index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/**
 * 轻量排版：标题、清单、引用和段落。清单可以点完成。
 */
export const wpc_renderMarkdown = (source: string, onToggleCheck?: (next: string) => void): ReactElement => {
  const lines = source.split('\n')
  const nodes: ReactElement[] = []
  let index = 0
  let block = 0
  const nextKey = (): string => {
    block += 1
    return `md-${block}`
  }
  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (!line.trim()) {
      index += 1
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1]?.length ?? 1
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5'
      nodes.push(<Tag key={nextKey()}>{wpc_renderInline(heading[2] ?? '')}</Tag>)
      index += 1
      continue
    }
    if (line.startsWith('> ')) {
      const quote: string[] = []
      while (index < lines.length && (lines[index] ?? '').startsWith('> ')) {
        quote.push((lines[index] ?? '').slice(2))
        index += 1
      }
      nodes.push(<blockquote key={nextKey()}>{wpc_renderInline(quote.join(' '))}</blockquote>)
      continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: ReactElement[] = []
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? '')) {
        const current = lines[index] ?? ''
        const check = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(current)
        const lineIndex = index
        if (check) {
          const checked = check[1]?.toLowerCase() === 'x'
          items.push(
            <li key={lineIndex} className={checked ? 'is-done' : undefined}>
              <button
                type="button"
                className={checked ? 'check is-on' : 'check'}
                aria-label={checked ? '标为未完成' : '标为完成'}
                onClick={() => {
                  if (!onToggleCheck) return
                  const nextLines = source.split('\n')
                  nextLines[lineIndex] = current.replace(/\[( |x|X)\]/, checked ? '[ ]' : '[x]')
                  onToggleCheck(nextLines.join('\n'))
                }}
              />
              <span>{wpc_renderInline(check[2] ?? '')}</span>
            </li>,
          )
        } else {
          items.push(<li key={lineIndex}>{wpc_renderInline(current.replace(/^\s*[-*]\s+/, ''))}</li>)
        }
        index += 1
      }
      nodes.push(<ul key={nextKey()}>{items}</ul>)
      continue
    }
    const paragraph: string[] = []
    while (
      index < lines.length &&
      (lines[index] ?? '').trim() &&
      !/^(#{1,3})\s+/.test(lines[index] ?? '') &&
      !(lines[index] ?? '').startsWith('> ') &&
      !/^\s*[-*]\s+/.test(lines[index] ?? '')
    ) {
      paragraph.push(lines[index] ?? '')
      index += 1
    }
    nodes.push(<p key={nextKey()}>{wpc_renderInline(paragraph.join(' '))}</p>)
  }
  return <div className="md">{nodes}</div>
}
