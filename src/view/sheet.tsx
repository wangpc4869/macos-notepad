import type { ReactElement } from 'react'
import type { WpcSkin } from '../../shared/types'
import { wpc_appVersion } from '../../shared/pure'
import { wpc_backup, wpc_reveal } from '../lib/api'
import { wpc_formatBytes, wpc_formatFullDate, wpc_formatMinutes } from '../lib/format'
import { wpc_skinMeta } from '../lib/skins'
import { wpc_useVault } from '../state/vault'
import { WpcCloseButton } from './bits'

/**
 * 案头：称呼、统计、备份，以及手稿放在哪里。
 */
export const WpcSheet = ({
  open,
  dataPath,
  skin,
  onOpenCenter,
  onClose,
}: {
  open: boolean
  dataPath: string
  skin: WpcSkin
  onOpenCenter: () => void
  onClose: () => void
}): ReactElement | null => {
  const { vault, wpc_mutate, wpc_notify } = wpc_useVault()
  if (!open || !vault) return null
  const seconds = vault.times.reduce((sum, entry) => sum + (entry.endedAt ? Math.max(0, (new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()) / 1000) : 0), 0)
  const bytes = vault.assets.reduce((sum, asset) => sum + asset.bytes, 0)
  return (
    <div className="sheet-back" onMouseDown={onClose} role="presentation">
      <aside className="sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="card-title">
          <h3>案头</h3>
          <WpcCloseButton onClose={onClose} />
        </div>
        <label className="field">
          <span>怎么称呼你</span>
          <input
            className="text-input"
            maxLength={16}
            value={vault.profile.displayName}
            placeholder="旅人"
            onChange={(event) => wpc_mutate((current) => ({ ...current, profile: { ...current.profile, displayName: event.target.value } }))}
          />
        </label>
        <div className="field">
          <span>皮肤 · 当前是{wpc_skinMeta(skin).name}</span>
          <button type="button" className="gold-btn" onClick={onOpenCenter}>
            进入皮肤中心
          </button>
        </div>
        <p className="quiet">这册开始于 {wpc_formatFullDate(new Date(vault.profile.bornAt))}</p>
        <div className="stat-row column">
          <article className="stat">
            <span>笔记</span>
            <strong>{vault.notes.length}</strong>
          </article>
          <article className="stat">
            <span>日记</span>
            <strong>{vault.diaries.length}</strong>
          </article>
          <article className="stat">
            <span>已记下的时光</span>
            <strong>{wpc_formatMinutes(seconds / 60)}</strong>
          </article>
          <article className="stat">
            <span>行迹 / 素材</span>
            <strong>
              {vault.albums.length} / {wpc_formatBytes(bytes)}
            </strong>
          </article>
        </div>
        <label className="field">
          <span>手稿位置</span>
          <input className="text-input" readOnly value={dataPath} />
        </label>
        <div className="tool-row">
          <button
            type="button"
            className="gold-btn"
            onClick={() => {
              void wpc_backup()
                .then((result) => wpc_notify(`已备份到 ${result.path}`))
                .catch((error: unknown) => wpc_notify(error instanceof Error ? error.message : '备份失败'))
            }}
          >
            备份手稿
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              void wpc_reveal().catch((error: unknown) => wpc_notify(error instanceof Error ? error.message : '无法打开访达'))
            }}
          >
            在访达中显示
          </button>
        </div>
        <div className="about">
          <p>星笺 {wpc_appVersion} 是放在这台 Mac 上的手帐。文字、时间和图片都写在项目的 data 目录里，不用数据库，也不上传。</p>
          <p>删掉整个项目文件夹，客户端、依赖和全部记录会一起离开。电脑里原来就有的 Node.js 不会被带走。</p>
          <p>书写用霞鹜文楷，采用 SIL 开源字体许可。行迹页若出现《神奈川冲浪里》，那是葛饰北斋的公有领域作品。</p>
        </div>
      </aside>
    </div>
  )
}
