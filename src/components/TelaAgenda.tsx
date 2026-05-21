'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import type { Evento, LugarCultural } from '@/lib/types'

type Filtro = 'semana' | 'proximo' | 'todos'

const TABEL_MAP: Record<string, string> = {
  Igrejas: 'igrejas', Museus: 'museus', Minas: 'minas',
  'Parques e Cachoeiras': 'parques_cachoeiras',
}
const EMOJI_MAP: Record<string, string> = {
  Igrejas: '⛪', Museus: '🏛', Minas: '⛏', 'Parques e Cachoeiras': '🌿',
}

export default function TelaAgenda({ ativo }: { ativo: boolean }) {
  const { irPara, setEventoAtual, setLugarAtual } = useApp()
  const [filtro, setFiltro] = useState<Filtro>('semana')
  const [eventos, setEventos] = useState<Evento[]>([])
  const [lugares, setLugares] = useState<(LugarCultural & { categoria: string })[]>([])
  const [modoCat, setModoCat] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const carregarEventos = useCallback(async (f: Filtro) => {
    setCarregando(true)
    setLugares([])
    const hoje = new Date().toISOString().split('T')[0]
    let query = supabase.from('eventos').select('*').eq('ativo', true).order('data_evento', { ascending: true })
    if (f === 'semana') {
      const fim = new Date(); fim.setDate(fim.getDate() + 7)
      query = query.gte('data_evento', hoje).lte('data_evento', fim.toISOString().split('T')[0])
    } else if (f === 'proximo') {
      const fim = new Date(); fim.setDate(fim.getDate() + 30)
      query = query.gte('data_evento', hoje).lte('data_evento', fim.toISOString().split('T')[0])
    } else {
      query = query.gte('data_evento', hoje)
    }
    const { data } = await query
    setEventos(data || [])
    setCarregando(false)
  }, [])

  const carregarLugares = useCallback(async (cat: string) => {
    const tabela = TABEL_MAP[cat]
    if (!tabela) return
    setCarregando(true)
    setEventos([])
    const { data } = await supabase
      .from(tabela)
      .select('id,nome,descricao,endereco,site,horario_funcionamento,foto')
      .order('nome', { ascending: true })
    if (data) setLugares(data.map((l: LugarCultural) => ({ ...l, categoria: cat })))
    setCarregando(false)
  }, [])

  useEffect(() => {
    if (!ativo) return
    setModoCat(null)
    carregarEventos(filtro)
  }, [ativo, filtro, carregarEventos])

  const abrirCategoria = (cat: string) => {
    setModoCat(cat)
    carregarLugares(cat)
  }

  const abrirEvento = (ev: Evento) => {
    setEventoAtual(ev)
    irPara('evento')
  }

  const abrirLugar = (l: LugarCultural & { categoria: string }) => {
    setLugarAtual(l)
    irPara('lugar')
  }

  return (
    <div id="tela-agenda" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="agenda-hero">
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-bright)', marginTop: 'calc(var(--safe-top) + 8px)' }}>Ouro Preto</div>
        {modoCat
          ? <h2>{EMOJI_MAP[modoCat] || '📍'} <em>{modoCat}</em></h2>
          : <h2>Agenda de <em>eventos</em></h2>
        }
        <div className="sub">{modoCat ? 'Toque em qualquer item para saber mais.' : 'O que acontece na cidade, semana a semana.'}</div>
      </div>

      {/* FILTROS CATEGORIA */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 22px 0', overflowX: 'auto', scrollbarWidth: 'none', background: 'var(--paper)' }}>
        {Object.keys(TABEL_MAP).map(cat => (
          <div
            key={cat}
            className={`filtro${modoCat === cat ? ' ativo' : ''}`}
            onClick={() => abrirCategoria(cat)}
          >
            {EMOJI_MAP[cat]} {cat}
          </div>
        ))}
      </div>

      {/* FILTROS EVENTO */}
      {!modoCat && (
        <div className="filtros">
          {([['semana', '📅 Esta semana'], ['proximo', '📆 Próximos'], ['todos', '🗓 Todos']] as [Filtro, string][]).map(([f, label]) => (
            <div
              key={f}
              className={`filtro${filtro === f && !modoCat ? ' ativo' : ''}`}
              onClick={() => { setFiltro(f); setModoCat(null); carregarEventos(f) }}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <div className="agenda-feed">
        {carregando && <div className="carregando">Carregando…</div>}

        {/* LISTA EVENTOS */}
        {!carregando && eventos.map(ev => {
          const d = new Date(ev.data_evento + 'T12:00:00')
          const dia = d.getDate()
          const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
          const sem = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
          return (
            <div key={ev.id} className="lugar-card" onClick={() => abrirEvento(ev)}>
              <div
                className="lugar-card-hero"
                style={ev.foto ? { backgroundImage: `url('${ev.foto}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                <div className="lugar-card-cat">📅 {sem} {dia}/{mes}</div>
              </div>
              <div className="lugar-card-body">
                <h4>{ev.nome}</h4>
                <div className="horario">⏰ {ev.horario || '—'} &nbsp;·&nbsp; 📍 {ev.local || '—'}</div>
              </div>
            </div>
          )
        })}

        {/* LISTA LUGARES CULTURAIS */}
        {!carregando && lugares.map(l => {
          const emoji = EMOJI_MAP[l.categoria] || '📍'
          const horario = l.horario_funcionamento || 'Confirmar horário'
          return (
            <div key={l.id} className="lugar-card" onClick={() => abrirLugar(l)}>
              <div
                className="lugar-card-hero"
                style={l.foto ? { backgroundImage: `url('${l.foto}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                <div className="lugar-card-cat">{emoji} {l.categoria}</div>
              </div>
              <div className="lugar-card-body">
                <h4>{l.nome}</h4>
                <div className="horario">🕐 {horario.substring(0, 60)}{horario.length > 60 ? '…' : ''}</div>
              </div>
            </div>
          )
        })}

        {!carregando && eventos.length === 0 && lugares.length === 0 && (
          <div className="carregando">Nenhum resultado encontrado.</div>
        )}
      </div>
    </div>
  )
}
