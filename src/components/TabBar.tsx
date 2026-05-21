'use client'

import { useApp } from '@/lib/app-context'
import type { Tela } from '@/lib/types'

const TELAS_COM_TAB: Tela[] = ['home', 'agenda', 'explorar']

export default function TabBar() {
  const { tela, irPara } = useApp()

  if (!TELAS_COM_TAB.includes(tela)) return null

  return (
    <nav className="tabbar">
      <button
        className={`tab${tela === 'home' ? ' ativo' : ''}`}
        onClick={() => irPara('home')}
      >
        <div className="tab-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 12l9-9 9 9M5 10v10h14V10"/>
          </svg>
        </div>
        Início
      </button>
      <button
        className={`tab${tela === 'agenda' ? ' ativo' : ''}`}
        onClick={() => irPara('agenda')}
      >
        <div className="tab-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
        Agenda
      </button>
      <button
        className={`tab${tela === 'explorar' ? ' ativo' : ''}`}
        onClick={() => irPara('explorar')}
      >
        <div className="tab-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>
          </svg>
        </div>
        Explorar
      </button>
      <button
        className="tab"
        onClick={() => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('dica_token') : null
          irPara(token ? 'painel' : 'login')
        }}
      >
        <div className="tab-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="4"/><path d="M4 22c0-4 4-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        Lojista
      </button>
    </nav>
  )
}
