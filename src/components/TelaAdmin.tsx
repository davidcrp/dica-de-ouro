'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'admin@dicadeouro.com.br'

interface Stats {
  lojas: number
  avaliacoes: number
  republicas: number
  acessos: number
}

interface LojaRow {
  id: number
  NOME?: string
  nome?: string
  ATUALIZADO_EM?: string
  atualizado_em?: string
}

interface AvalRow {
  id: string
  loja_id: number
  nota_geral?: number
  nome_avaliador?: string
  created_at: string
}

export default function TelaAdmin({ ativo }: { ativo: boolean }) {
  const { irPara } = useApp()
  const [stats, setStats] = useState<Stats>({ lojas: 0, avaliacoes: 0, republicas: 0, acessos: 0 })
  const [expirando, setExpirando] = useState<LojaRow[]>([])
  const [ultimasAvals, setUltimasAvals] = useState<AvalRow[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!ativo) return
    const email = localStorage.getItem('dica_email')
    if (email !== ADMIN_EMAIL) { irPara('home'); return }
    carregar()
  }, [ativo, irPara])

  const carregar = async () => {
    setCarregando(true)
    const [
      { count: nLojas },
      { count: nAvals },
      { count: nReps },
      { count: nAcessos },
    ] = await Promise.all([
      supabase.from('lojas').select('*', { count: 'exact', head: true }),
      supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
      supabase.from('republicas').select('*', { count: 'exact', head: true }),
      supabase.from('acessos').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      lojas: nLojas ?? 0,
      avaliacoes: nAvals ?? 0,
      republicas: nReps ?? 0,
      acessos: nAcessos ?? 0,
    })

    const hoje = new Date().toISOString().split('T')[0]
    const limite = new Date(Date.now() + 86400000).toISOString()
    const { data: exp } = await supabase
      .from('lojas')
      .select('id, NOME, nome, ATUALIZADO_EM, atualizado_em')
      .lt('ATUALIZADO_EM', limite)
      .order('ATUALIZADO_EM', { ascending: true })
      .limit(10)
    setExpirando(exp || [])

    const { data: avals } = await supabase
      .from('avaliacoes')
      .select('id, loja_id, nota_geral, nome_avaliador, created_at')
      .order('created_at', { ascending: false })
      .limit(8)
    setUltimasAvals(avals || [])

    setCarregando(false)
    void hoje
  }

  const sair = () => {
    irPara('home')
  }

  const diasAtras = (iso?: string) => {
    if (!iso) return '—'
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    return d === 0 ? 'hoje' : `${d}d atrás`
  }

  return (
    <div id="tela-admin" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="admin-header">
        <div className="eyebrow">Painel administrativo</div>
        <h2>Dashboard <em>Dica de Ouro</em></h2>
      </div>
      <div className="admin-corpo">
        {carregando
          ? <div style={{ textAlign: 'center', opacity: 0.5, padding: '32px 0' }}>Carregando…</div>
          : (
            <>
              <div className="admin-grid">
                <div className="admin-stat">
                  <div className="lbl">Lojas</div>
                  <div className="val">{stats.lojas}</div>
                  <div className="trend">Cadastradas</div>
                </div>
                <div className="admin-stat">
                  <div className="lbl">Avaliações</div>
                  <div className="val">{stats.avaliacoes}</div>
                  <div className="trend">Total</div>
                </div>
                <div className="admin-stat">
                  <div className="lbl">Repúblicas</div>
                  <div className="val">{stats.republicas}</div>
                  <div className="trend">Cadastradas</div>
                </div>
                <div className="admin-stat">
                  <div className="lbl">Acessos</div>
                  <div className="val">{stats.acessos}</div>
                  <div className="trend">Registrados</div>
                </div>
              </div>

              {expirando.length > 0 && (
                <div className="admin-sec">
                  <h3>Lojas expirando em breve</h3>
                  {expirando.map(l => (
                    <div key={l.id} className="admin-row">
                      <div className="nome">{l.NOME || l.nome || '—'}</div>
                      <div className="val-sm">{diasAtras(l.ATUALIZADO_EM || l.atualizado_em)}</div>
                      <div className="badge badge-amarelo">exp</div>
                    </div>
                  ))}
                </div>
              )}

              {ultimasAvals.length > 0 && (
                <div className="admin-sec">
                  <h3>Últimas avaliações</h3>
                  {ultimasAvals.map(a => (
                    <div key={a.id} className="admin-row">
                      <div className="nome">{a.nome_avaliador || 'Anônimo'} · loja #{a.loja_id}</div>
                      <div className="val-sm">★ {a.nota_geral ?? '—'}</div>
                      <div className="badge badge-verde">{diasAtras(a.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        }

        <button className="btn-sair-admin" onClick={sair}>Sair do painel admin</button>
      </div>
    </div>
  )
}
