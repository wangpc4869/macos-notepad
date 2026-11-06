import { useState } from 'react'
import type { ReactElement } from 'react'
import { wpc_mediaUrl } from '../lib/api'
import { wpc_assetUsage } from '../lib/copy'
import { wpc_formatBytes, wpc_formatStamp } from '../lib/format'
import { wpc_useVault } from '../state/vault'
import { WpcConfirm, WpcEmpty, WpcLightbox, WpcPageHead } from './bits'

/**
 * 素材库：所有放进手帐的图片。
 */
export const WpcLibrary = (): ReactElement => {
  const { vault, wpc_removeAsset, wpc_notify } = wpc_useVault()
  const [light, setLight] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  if (!vault) return <div />
  const pendingUsage = pending ? wpc_assetUsage(vault, pending) : []
  return (
    <section className="page">
      <WpcPageHead kicker="ARCHIVE" title="素材" extra={<span className="quiet">{vault.assets.length} 张</span>} />
      <div className="page-scroll">
        {vault.assets.length === 0 ? (
          <WpcEmpty title="还没有图片" text="在笔记、日记或行迹里放下的照片，都会汇到这里。" />
        ) : (
          <div className="library-grid">
            {vault.assets.map((asset) => {
              const usage = wpc_assetUsage(vault, asset.id)
              return (
                <article key={asset.id} className="library-card">
                  <button type="button" onClick={() => setLight(asset.id)}>
                    <img src={wpc_mediaUrl(asset.id)} alt={asset.fileName} />
                  </button>
                  <div>
                    <strong>{asset.fileName}</strong>
                    <small>
                      {wpc_formatBytes(asset.bytes)} · {wpc_formatStamp(asset.createdAt)}
                    </small>
                    <small>{usage.length > 0 ? usage.slice(0, 2).join('、') : '还没有被使用'}</small>
                    <button type="button" className="text-link" onClick={() => setPending(asset.id)}>
                      删除
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
      {light ? <WpcLightbox id={light} onClose={() => setLight(null)} /> : null}
      {pending ? (
        <WpcConfirm
          title="删除这张图片？"
          text={pendingUsage.length > 0 ? `它还出现在：${pendingUsage.join('、')}。删除后这些地方也会拿掉它。` : '这张图还没有被记录用到。'}
          confirmLabel="删除"
          onClose={() => setPending(null)}
          onConfirm={() => {
            const id = pending
            setPending(null)
            if (light === id) setLight(null)
            void wpc_removeAsset(id).then(() => wpc_notify('图片已删除')).catch((error: unknown) => wpc_notify(error instanceof Error ? error.message : '没有删掉'))
          }}
        />
      ) : null}
    </section>
  )
}
