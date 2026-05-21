'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import { nomeLoja, catLoja, endLoja } from '@/lib/utils'
import type { Loja, LugarCultural } from '@/lib/types'

type FiltroMapa = 'todos' | 'lojas' | 'Igrejas' | 'Museus' | 'Minas' | 'Parques e Cachoeiras'

interface PontoMapa {
  id: string | number
  nome: string
  cat: string
  end: string
  lat: number
  lng: number
  tipo: 'loja' | 'cultural'
}

const CENTRO_OP: [number, number] = [-20.3856, -43.5035]

export default function TelaExplorar({ ativo }: { ativo: boolean }) {
  const { setLojaAtual, setLojaAvaliando, setLugarAtual, irPara, todasLojas } = useApp()
  const mapaRef = useRef<HTMLDivElement>(null)
  const mapaInstancia = useRef<any>(null)
  const [filtro, setFiltro] = useState<FiltroMapa>('todos')
  const [pontos, setPontos] = useState<PontoMapa[]>([])
  const marcadoresRef = useRef<any[]>([])

  useEffect(() => {
    if (!ativo) return
    carregarDados()
  }, [ativo])

  useEffect(() => {
    if (!ativo || !pontos.length) return
    iniciarMapa()
  }, [ativo, pontos, filtro])

  const carregarDados = async () => {
    const todos: PontoMapa[] = []

    todasLojas.forEach(l => {
      if (l.lat && l.lng) {
        todos.push({ id: l.id, nome: nomeLoja(l), cat: catLoja(l), end: endLoja(l), lat: l.lat, lng: l.lng, tipo: 'loja' })
      }
    })

    const tabelas = ['igrejas', 'museus', 'minas', 'parques_cachoeiras']
    const catNames = ['Igrejas', 'Museus', 'Minas', 'Parques e Cachoeiras']
    for (let i = 0; i < tabelas.length; i++) {
      const { data } = await supabase.from(tabelas[i]).select('id,nome,endereco,lat,lng')
      if (data) {
        data.forEach((l: LugarCultural & { lat?: number; lng?: number }) => {
          if (l.lat && l.lng) {
            todos.push({ id: l.id, nome: l.nome, cat: catNames[i], end: l.endereco || '', lat: l.lat!, lng: l.lng!, tipo: 'cultural' })
          }
        })
      }
    }
    setPontos(todos)
  }

  const iniciarMapa = async () => {
    if (!mapaRef.current) return
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    if (!mapaInstancia.current) {
      mapaInstancia.current = L.map(mapaRef.current, { center: CENTRO_OP, zoom: 14, zoomControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(mapaInstancia.current)
    }

    marcadoresRef.current.forEach(m => m.remove())
    marcadoresRef.current = []

    const filtrados = pontos.filter(p => {
      if (filtro === 'todos') return true
      if (filtro === 'lojas') return p.tipo === 'loja'
      return p.cat === filtro
    })

    filtrados.forEach(p => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;background:var(--gold-bright);border:2px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;color:var(--ink);box-shadow:0 2px 8px #00000050">${p.tipo === 'loja' ? '🏪' : '📍'}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
      const m = L.marker([p.lat, p.lng], { icon }).addTo(mapaInstancia.current)
      m.bindPopup(`
        <div style="padding:4px 2px;min-width:160px">
          <div style="font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:#d4a04a;margin-bottom:4px">${p.cat}</div>
          <div style="font-family:'Fraunces',serif;font-size:1rem;font-weight:500;margin-bottom:4px;color:#f4ede0">${p.nome}</div>
          <div style="font-size:0.75rem;opacity:0.6;margin-bottom:8px;color:#f4ede0">${p.end}</div>
          <button onclick="window._verNoApp_${p.id}()" style="width:100%;padding:8px;background:#d4a04a;color:#1a1410;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-weight:600;font-size:0.75rem;cursor:pointer;text-transform:uppercase">Ver detalhes</button>
        </div>
      `)
      ;(window as any)[`_verNoApp_${p.id}`] = () => {
        if (p.tipo === 'loja') {
          const loja = todasLojas.find(l => l.id === p.id)
          if (loja) { setLojaAtual(loja); setLojaAvaliando({ id: loja.id, nome: nomeLoja(loja) }); irPara('detalhe') }
        }
      }
      marcadoresRef.current.push(m)
    })
  }

  return (
    <div id="tela-explorar" className={`tela${ativo ? '' : ' oculta'}`} style={{ paddingBottom: 0 }}>
      <div className="mapa-header">
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-bright)', marginBottom: 4 }}>Ouro Preto no mapa</div>
        <h2>Explorar <em>tudo</em></h2>
        <div className="sub">Lojas, igrejas, museus, minas e parques.</div>
      </div>

      <div className="mapa-filtros">
        {([
          ['todos', 'Tudo'],
          ['lojas', '🏪 Lojas'],
          ['Igrejas', '⛪ Igrejas'],
          ['Museus', '🏛 Museus'],
          ['Minas', '⛏ Minas'],
          ['Parques e Cachoeiras', '🌿 Parques'],
        ] as [FiltroMapa, string][]).map(([f, label]) => (
          <div
            key={f}
            className={`mapa-filtro${filtro === f ? ' ativo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {label}
          </div>
        ))}
      </div>

      <div ref={mapaRef} id="mapa-container" />
    </div>
  )
}
