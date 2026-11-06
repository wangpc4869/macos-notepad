import { useEffect, useRef, useState } from 'react'
import type { DragEvent, ReactElement } from 'react'
import { wpc_createId } from '../../shared/pure'
import type { WpcNote } from '../../shared/types'
import { wpc_exportText } from '../lib/api'
import { wpc_listExcerpt, wpc_noteMarkdown, type WpcJump } from '../lib/copy'
import { wpc_renderMarkdown } from '../lib/markdown'
import { wpc_useVault } from '../state/vault'
import { WpcConfirm, WpcEmpty, WpcPageHead } from './bits'

/**
 * 笔记页：文集、标签、纸页和对照排版。
 */
export const WpcNotes = ({
  target,
  calm,
  onCalm,
}: {
  target: WpcJump | null
  calm: boolean
  onCalm: (value: boolean) => void
}): ReactElement => {
  const { vault, wpc_mutate, wpc_notify } = wpc_useVault()
  const [folderId, setFolderId] = useState('all')
  const [tag, setTag] = useState('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [folderDraft, setFolderDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState<WpcNote | null>(null)

  const wpc_create = (folder = folderId): void => {
    if (!vault) return
    const stamp = new Date().toISOString()
    const note: WpcNote = {
      id: wpc_createId(),
      title: '',
      content: '',
      folderId: folder === 'all' ? 'folder-inbox' : folder,
      tags: tag === 'all' ? [] : [tag],
      imageIds: [],
      pinned: false,
      createdAt: stamp,
      updatedAt: stamp,
    }
    wpc_mutate((current) => ({ ...current, notes: [note, ...current.notes] }))
    setActiveId(note.id)
  }

  useEffect(() => {
    if (target?.page === 'notes') setActiveId(target.id)
  }, [target])

  useEffect(() => {
    const wpc_onNew = (): void => wpc_create()
    window.addEventListener('hoshisen:new', wpc_onNew)
    return () => window.removeEventListener('hoshisen:new', wpc_onNew)
  })

  if (!vault) return <div />
  const tags = [...new Set(vault.notes.flatMap((note) => note.tags))]
  const visible = [...vault.notes]
    .filter((note) => (folderId === 'all' || note.folderId === folderId) && (tag === 'all' || note.tags.includes(tag)))
    .sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt.localeCompare(left.updatedAt))
  const active = vault.notes.find((note) => note.id === activeId) ?? visible[0] ?? null

  const wpc_commit = (next: WpcNote): void => {
    wpc_mutate((current) => ({
      ...current,
      notes: current.notes.map((note) => (note.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : note)),
    }))
  }

  return (
    <section className={calm ? 'page is-fill is-calm-page' : 'page is-fill'}>
      <WpcPageHead
        kicker="NOTES"
        title="笔记"
        extra={
          <button type="button" className="gold-btn" onClick={() => wpc_create()}>
            新的一页
          </button>
        }
      />
      <div className="split">
        <div className="pane list-pane">
          <div className="chip-row">
            <button type="button" className={folderId === 'all' ? 'chip is-on' : 'chip'} onClick={() => setFolderId('all')}>
              全部
            </button>
            {vault.folders
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((folder) => (
                <button key={folder.id} type="button" className={folderId === folder.id ? 'chip is-on' : 'chip'} onClick={() => setFolderId(folder.id)}>
                  {folder.name}
                </button>
              ))}
          </div>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              const name = folderDraft.trim()
              if (!name) return
              const id = wpc_createId()
              wpc_mutate((current) => ({
                ...current,
                folders: [...current.folders, { id, name: name.slice(0, 16), order: current.folders.length }],
              }))
              setFolderDraft('')
              setFolderId(id)
            }}
          >
            <input className="text-input" value={folderDraft} placeholder="新文集" onChange={(event) => setFolderDraft(event.target.value)} />
            <button type="submit" className="ghost-btn">
              添加
            </button>
          </form>
          {tags.length > 0 ? (
            <div className="chip-row">
              <button type="button" className={tag === 'all' ? 'chip is-on' : 'chip'} onClick={() => setTag('all')}>
                全部标签
              </button>
              {tags.map((item) => (
                <button key={item} type="button" className={tag === item ? 'chip is-on' : 'chip'} onClick={() => setTag(item)}>
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          {visible.length === 0 ? <p className="quiet">这个文集还是空的。</p> : null}
          {visible.map((note) => {
            const excerpt = wpc_listExcerpt(note.title, note.content)
            return (
              <button key={note.id} type="button" className={active?.id === note.id ? 'note-row is-on' : 'note-row'} onClick={() => setActiveId(note.id)}>
                <span>
                  {note.pinned ? <i className="pin-mark">钉</i> : null}
                  {note.title.trim() || '无题'}
                </span>
                {excerpt ? <small>{excerpt}</small> : null}
              </button>
            )
          })}
        </div>
        <div className="pane">
          {active ? (
            <WpcNoteEditor
              key={active.id}
              note={active}
              calm={calm}
              onCalm={onCalm}
              onChange={wpc_commit}
              onDelete={() => setPendingDelete(active)}
            />
          ) : (
            <WpcEmpty title="还没有手稿" text="工作记录、清单、忽然的想法，都可以从这里开始。" action="写第一页" onAction={() => wpc_create()} />
          )}
        </div>
      </div>
      {pendingDelete ? (
        <WpcConfirm
          title="删除这篇笔记？"
          text="删掉后，这一页不会再出现。图片如果没有别处使用，可以稍后在素材里清理。"
          confirmLabel="删除"
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const id = pendingDelete.id
            wpc_mutate((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }))
            setActiveId(null)
            setPendingDelete(null)
            wpc_notify('这篇笔记已删除')
          }}
        />
      ) : null}
    </section>
  )
}

/**
 * 一张纸上的笔记编辑器。
 */
const WpcNoteEditor = ({
  note,
  calm,
  onCalm,
  onChange,
  onDelete,
}: {
  note: WpcNote
  calm: boolean
  onCalm: (value: boolean) => void
  onChange: (note: WpcNote) => void
  onDelete: () => void
}): ReactElement => {
  const { vault, wpc_addImages, wpc_notify } = wpc_useVault()
  const [tagDraft, setTagDraft] = useState('')
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef(note)
  noteRef.current = note
  if (!vault) return <div />

  const wpc_insert = (snippet: string): void => {
    const current = noteRef.current
    const element = box.current
    const start = element?.selectionStart ?? current.content.length
    const end = element?.selectionEnd ?? current.content.length
    const content = `${current.content.slice(0, start)}${snippet}${current.content.slice(end)}`
    onChange({ ...current, content })
    requestAnimationFrame(() => {
      element?.focus()
      const pos = start + snippet.length
      element?.setSelectionRange(pos, pos)
    })
  }

  const wpc_takeFiles = async (files: File[]): Promise<void> => {
    if (!files.length) return
    setBusy(true)
    try {
      const assets = await wpc_addImages(files)
      if (!assets.length) return
      const current = noteRef.current
      const snippet = `\n${assets.map((asset) => `![](asset:${asset.id})`).join('\n')}\n`
      const element = box.current
      const start = element?.selectionStart ?? current.content.length
      const end = element?.selectionEnd ?? current.content.length
      onChange({
        ...current,
        content: `${current.content.slice(0, start)}${snippet}${current.content.slice(end)}`,
        imageIds: [...assets.map((asset) => asset.id), ...current.imageIds],
      })
    } catch (error) {
      wpc_notify(error instanceof Error ? error.message : '图片没有放进来')
    } finally {
      setBusy(false)
    }
  }

  const wpc_onDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault()
    void wpc_takeFiles([...event.dataTransfer.files])
  }

  return (
    <article
      className="paper"
      onDragOver={(event) => event.preventDefault()}
      onDrop={wpc_onDrop}
    >
      <div className="seal" aria-hidden="true">
        笺
      </div>
      <div className="paper-top">
        <input
          className="paper-title"
          value={note.title}
          placeholder="无题"
          onChange={(event) => onChange({ ...noteRef.current, title: event.target.value })}
        />
      </div>
      <div className="paper-meta">
        <select className="plain-input slim" value={note.folderId} onChange={(event) => onChange({ ...noteRef.current, folderId: event.target.value })}>
          {vault.folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <button type="button" className={note.pinned ? 'chip is-on' : 'chip'} onClick={() => onChange({ ...noteRef.current, pinned: !note.pinned })}>
          {note.pinned ? '已钉住' : '钉住'}
        </button>
        <span className="quiet">{note.content.replace(/\s/g, '').length} 字</span>
        <div className="tag-row">
          {note.tags.map((item) => (
            <button key={item} type="button" className="chip" onClick={() => onChange({ ...noteRef.current, tags: note.tags.filter((tag) => tag !== item) })}>
              {item} ×
            </button>
          ))}
          <input
            className="plain-input tag-input"
            value={tagDraft}
            placeholder="加标签"
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              const next = tagDraft.trim()
              if (!next || note.tags.includes(next)) return
              onChange({ ...noteRef.current, tags: [...note.tags, next].slice(0, 8) })
              setTagDraft('')
            }}
          />
        </div>
      </div>
      <div className="tool-row on-paper paper-tools">
        <button type="button" className="ghost-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? '放入中' : '图片'}
        </button>
        <button type="button" className="ghost-btn" onClick={() => wpc_insert('\n- [ ] ')}>
          清单
        </button>
        <button type="button" className={preview ? 'chip is-on' : 'ghost-btn'} onClick={() => setPreview((value) => !value)}>
          对照
        </button>
        <button type="button" className="ghost-btn" onClick={() => onCalm(!calm)}>
          {calm ? '退出沉浸' : '沉浸'}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            void wpc_exportText(note.title, wpc_noteMarkdown(note, vault.assets))
              .then((result) => wpc_notify(`已导出 ${result.path}`))
              .catch((error: unknown) => wpc_notify(error instanceof Error ? error.message : '导出失败'))
          }}
        >
          导出
        </button>
        <span className="tool-space" />
        <button type="button" className="danger-btn" onClick={onDelete}>
          删除
        </button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(event) => {
            void wpc_takeFiles([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />
      </div>
      <div className={preview ? 'editor-grid is-preview' : 'editor-grid'}>
        <textarea
          ref={box}
          className="paper-body"
          value={note.content}
          placeholder="写下来。可以是会议、清单，或一句忽然的想法。"
          onChange={(event) => onChange({ ...noteRef.current, content: event.target.value })}
          onPaste={(event) => {
            const files = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'))
            if (!files.length) return
            event.preventDefault()
            void wpc_takeFiles(files)
          }}
        />
        {preview ? (
          <div className="preview">
            {wpc_renderMarkdown(note.content, (next) => onChange({ ...noteRef.current, content: next }))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
