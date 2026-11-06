import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { WpcPage } from '../../shared/types'
import { wpc_search } from '../lib/search'
import { wpc_useVault } from '../state/vault'

/**
 * 搜索层。⌘K 打开，在笔记、日记、时光和行迹里找。
 */
export const WpcSearch = ({
  open,
  onClose,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  onOpen: (page: WpcPage, id?: string) => void
}): ReactElement | null => {
  const { vault } = wpc_useVault()
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])
  const hits = useMemo(() => (vault ? wpc_search(vault, query) : []), [vault, query])
  if (!open) return null
  return (
    <div className="search-back" onMouseDown={onClose} role="presentation">
      <form
        className="search-panel"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          const first = hits[0]
          if (!first) return
          onOpen(first.page, first.id)
        }}
      >
        <input autoFocus className="text-input" value={query} placeholder="搜索笔记、日记、时光、行迹" onChange={(event) => setQuery(event.target.value)} />
        <div className="search-list">
          {hits.length === 0 ? <p className="quiet">没有找到。</p> : null}
          {hits.map((hit) => (
            <button key={`${hit.page}-${hit.id}`} type="button" className="search-hit" onClick={() => onOpen(hit.page, hit.id)}>
              <em>{hit.kind}</em>
              <strong>{hit.title}</strong>
              <small>{hit.excerpt}</small>
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
