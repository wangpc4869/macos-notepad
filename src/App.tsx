import type { ReactElement } from 'react'
import { WpcVaultProvider } from './state/vault'
import { WpcShell } from './view/shell'

/**
 * 星笺入口。纹理铺在窗口上，手稿由本地目录提供。
 */
export const WpcApp = (): ReactElement => (
  <WpcVaultProvider>
    <div className="grain" aria-hidden="true" />
    <WpcShell />
  </WpcVaultProvider>
)
