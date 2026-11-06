import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_createId, wpc_dateKey } from '../../shared/pure'
import type { WpcAlbum } from '../../shared/types'
import { wpc_mediaUrl } from '../lib/api'
import { wpc_excerpt, type WpcJump } from '../lib/copy'
import { wpc_useVault } from '../state/vault'
import { WpcConfirm, WpcEmpty, WpcLightbox, WpcPageHead } from './bits'
import { WpcDateField } from './date-field'

/**
 * 行迹：一次出行，一个地方，一组照片。
 */
export const WpcJourney = ({ target }: { target: WpcJump | null }): ReactElement => {
  const { vault, wpc_mutate, wpc_notify } = wpc_useVault()
  const [openId, setOpenId] = useState<string | null>(null)
  const [artOk, setArtOk] = useState(true)
  const [pending, setPending] = useState(false)

  const wpc_create = (): void => {
    const stamp = new Date().toISOString()
    const album: WpcAlbum = {
      id: wpc_createId(),
      title: '',
      place: '',
      date: wpc_dateKey(new Date()),
      story: '',
      coverImageId: null,
      photos: [],
      createdAt: stamp,
      updatedAt: stamp,
    }
    wpc_mutate((current) => ({ ...current, albums: [album, ...current.albums] }))
    setOpenId(album.id)
  }

  useEffect(() => {
    if (target?.page === 'journey') setOpenId(target.id)
  }, [target])

  useEffect(() => {
    const wpc_onNew = (): void => wpc_create()
    window.addEventListener('hoshisen:new', wpc_onNew)
    return () => window.removeEventListener('hoshisen:new', wpc_onNew)
  })

  if (!vault) return <div />
  const album = vault.albums.find((item) => item.id === openId) ?? null
  if (album) {
    return (
      <WpcAlbumEditor
        album={album}
        onBack={() => setOpenId(null)}
        onDelete={() => setPending(true)}
        pending={pending}
        onCancelDelete={() => setPending(false)}
        onConfirmDelete={() => {
          wpc_mutate((current) => ({ ...current, albums: current.albums.filter((item) => item.id !== album.id) }))
          setOpenId(null)
          setPending(false)
          wpc_notify('这册行迹已收起')
        }}
      />
    )
  }

  return (
    <section className="page">
      <WpcPageHead
        kicker="JOURNEY"
        title="行迹"
        extra={
          <button type="button" className="gold-btn" onClick={wpc_create}>
            新的一程
          </button>
        }
      />
      <div className="page-scroll">
        <div className="journey-hero">
          <p>一次出门、一座城、一段路。照片和句子放在一起，回来还能翻开。</p>
          {artOk ? (
            <figure className="print-frame">
              <img src="./prints/wave.jpg" alt="葛饰北斋《神奈川冲浪里》" onError={() => setArtOk(false)} />
              <figcaption>葛饰北斋《神奈川冲浪里》· 公有领域</figcaption>
            </figure>
          ) : null}
        </div>
        {vault.albums.length === 0 ? (
          <WpcEmpty title="还没有出行" text="下一次出门，可以在这里收成一册。" action="记下这一程" onAction={wpc_create} />
        ) : (
          <div className="album-grid">
            {vault.albums.map((item) => {
              const cover = item.coverImageId ?? item.photos[0]?.imageId
              return (
                <button key={item.id} type="button" className="album-card" onClick={() => setOpenId(item.id)}>
                  <div className="album-cover">{cover ? <img src={wpc_mediaUrl(cover)} alt="" /> : <div className="album-fallback">{item.place || '行迹'}</div>}</div>
                  <strong>{item.title.trim() || '未命名行迹'}</strong>
                  <small>
                    {item.place || '未写地点'} · {item.date}
                  </small>
                  <em>{wpc_excerpt(item.story, 36)}</em>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * 一册行迹的内页。
 */
const WpcAlbumEditor = ({
  album,
  onBack,
  onDelete,
  pending,
  onCancelDelete,
  onConfirmDelete,
}: {
  album: WpcAlbum
  onBack: () => void
  onDelete: () => void
  pending: boolean
  onCancelDelete: () => void
  onConfirmDelete: () => void
}): ReactElement => {
  const { wpc_mutate, wpc_addImages, wpc_notify } = wpc_useVault()
  const fileRef = useRef<HTMLInputElement>(null)
  const [light, setLight] = useState<string | null>(null)

  const wpc_commit = (next: WpcAlbum): void => {
    wpc_mutate((current) => ({
      ...current,
      albums: current.albums.map((item) => (item.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : item)),
    }))
  }

  return (
    <section className="page">
      <WpcPageHead
        kicker="JOURNEY"
        title={album.title.trim() || '未命名行迹'}
        extra={
          <button type="button" className="ghost-btn" onClick={onBack}>
            返回行迹
          </button>
        }
      />
      <div className="page-scroll">
        <article className="paper">
          <input className="paper-title" value={album.title} placeholder="这一程的名字" onChange={(event) => wpc_commit({ ...album, title: event.target.value })} />
          <div className="meta-row">
            <input className="plain-input" value={album.place} placeholder="地点" onChange={(event) => wpc_commit({ ...album, place: event.target.value })} />
            <WpcDateField value={album.date} onChange={(date) => wpc_commit({ ...album, date })} />
          </div>
          <textarea className="paper-body short" value={album.story} placeholder="这一程，想记住什么？" onChange={(event) => wpc_commit({ ...album, story: event.target.value })} />
          <div className="tool-row on-paper">
            <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>
              加照片
            </button>
            <button type="button" className="danger-btn" onClick={onDelete}>
              删除这册
            </button>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(event) => {
                const files = [...(event.target.files ?? [])]
                event.target.value = ''
                void wpc_addImages(files)
                  .then((assets) => {
                    if (!assets.length) return
                    wpc_mutate((current) => ({
                      ...current,
                      albums: current.albums.map((item) => {
                        if (item.id !== album.id) return item
                        const photos = [
                          ...assets.map((asset) => ({ id: wpc_createId(), imageId: asset.id, caption: '' })),
                          ...item.photos,
                        ]
                        return {
                          ...item,
                          photos,
                          coverImageId: item.coverImageId ?? photos[0]?.imageId ?? null,
                          updatedAt: new Date().toISOString(),
                        }
                      }),
                    }))
                  })
                  .catch((error: unknown) => wpc_notify(error instanceof Error ? error.message : '图片没有放进来'))
              }}
            />
          </div>
          <div className="photo-strip">
            {album.photos.map((photo) => (
              <figure key={photo.id}>
                <button type="button" className="photo-open" onClick={() => setLight(photo.imageId)}>
                  <img src={wpc_mediaUrl(photo.imageId)} alt={photo.caption || '行迹照片'} />
                </button>
                <input
                  value={photo.caption}
                  placeholder="一句说明"
                  onChange={(event) =>
                    wpc_commit({
                      ...album,
                      photos: album.photos.map((item) => (item.id === photo.id ? { ...item, caption: event.target.value } : item)),
                    })
                  }
                />
                <div className="photo-actions">
                  <button type="button" onClick={() => wpc_commit({ ...album, coverImageId: photo.imageId })}>
                    {album.coverImageId === photo.imageId ? '封面' : '设为封面'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const photos = album.photos.filter((item) => item.id !== photo.id)
                      wpc_commit({
                        ...album,
                        photos,
                        coverImageId: album.coverImageId === photo.imageId ? photos[0]?.imageId ?? null : album.coverImageId,
                      })
                    }}
                  >
                    拿下
                  </button>
                </div>
              </figure>
            ))}
          </div>
        </article>
      </div>
      {light ? <WpcLightbox id={light} onClose={() => setLight(null)} /> : null}
      {pending ? <WpcConfirm title="删除这册行迹？" text="照片还会留在素材里，直到你在那里删掉。" confirmLabel="删除" onClose={onCancelDelete} onConfirm={onConfirmDelete} /> : null}
    </section>
  )
}
