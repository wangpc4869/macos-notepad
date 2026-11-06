import { createRoot } from 'react-dom/client'
import { WpcApp } from './App'
import { wpc_applySkin, wpc_storedSkin } from './lib/skins'
import './styles/global.css'

wpc_applySkin(wpc_storedSkin())

const root = document.getElementById('root')
if (!root) throw new Error('缺少根节点')
createRoot(root).render(<WpcApp />)
