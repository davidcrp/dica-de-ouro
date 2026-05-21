'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'admin@dicadeouro.com.br'
const CATS = ['Comer', 'Beber', 'Hospedar', 'Visitar', 'Comprar', 'Serviços', 'Saúde']
const UFOP_SUBCATS = ['laboratorios', 'extensao', 'vagas', 'iniciacao', 'estagio', 'pos_graduacao', 'concursos']

type Aba = 'dash' | 'lojas' | 'eventos' | 'lugares' | 'republicas' | 'ufop'

interface Stats { lojas: number; avaliacoes: number; republicas: number; acessos: number }
interface LojaRow { id: number; NOME?: string; nome?: string; ATUALIZADO_EM?: string; atualizado_em?: string }
interface EventoRow { id: string; nome: string; data_evento: string; local?: string }
interface LugarRow { id: string; nome: string }
interface RepublicaRow { id: number; nome: string }
interface UfopRow { id: number; titulo: string; subcategoria?: string }

const S = {
  inp: { width: '100%', padding: '10px 13px', background: '#ffffff06', border: '1px solid #ffffff15', borderRadius: 12, color: 'var(--cal)', fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', outline: 'none', marginTop: 6 } as React.CSSProperties,
  lbl: { fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', opacity: 0.5, color: 'var(--cal)' },
  campo: { marginBottom: 14 } as React.CSSProperties,
  btn: { width: '100%', padding: '12px', background: 'var(--gold-bright)', color: '#1a1410', border: 'none', borderRadius: 13, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', marginTop: 4 } as React.CSSProperties,
  btnDel: { background: 'transparent', border: 'none', color: '#c47a5a', cursor: 'pointer', fontSize: '0.78rem', padding: '2px 8px', flexShrink: 0 } as React.CSSProperties,
  sec: { marginBottom: 28 } as React.CSSProperties,
  secTitle: { fontFamily: "'Fraunces',serif", fontWeight: 400, fontSize: '1rem', color: 'var(--gold-bright)', marginBottom: 14 } as React.CSSProperties,
  listItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #ffffff08' } as React.CSSProperties,
  listName: { flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  listSub: { fontSize: '0.72rem', opacity: 0.45, flexShrink: 0 } as React.CSSProperties,
  chipGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 8 },
  chip: (sel: boolean) => ({ padding: '6px 12px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer', border: `1px solid ${sel ? 'var(--gold-bright)' : '#ffffff15'}`, background: sel ? 'var(--gold-bright)' : '#ffffff08', color: sel ? '#1a1410' : 'var(--cal)', fontWeight: sel ? 600 : 400 } as React.CSSProperties),
}

export default function TelaAdmin({ ativo }: { ativo: boolean }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const { irPara } = useApp()
  const [aba, setAba] = useState<Aba>('dash')
  const [stats, setStats] = useState<Stats>({ lojas: 0, avaliacoes: 0, republicas: 0, acessos: 0 })
  const [msg, setMsg] = useState('')

  // Loja
  const [lNome, setLNome] = useState(''); const [lCat, setLCat] = useState(''); const [lEnd, setLEnd] = useState('')
  const [lTel, setLTel] = useState(''); const [lSite, setLSite] = useState(''); const [lDesc, setLDesc] = useState(''); const [lHorario, setLHorario] = useState('')
  const [lojas, setLojas] = useState<LojaRow[]>([])

  // Evento
  const [eNome, setENome] = useState(''); const [eDesc, setEDesc] = useState(''); const [eData, setEData] = useState('')
  const [eHorario, setEHorario] = useState(''); const [eLocal, setELocal] = useState(''); const [eLink, setELink] = useState('')
  const [eventos, setEventos] = useState<EventoRow[]>([])

  // Lugar
  const [luNome, setLuNome] = useState(''); const [luDesc, setLuDesc] = useState(''); const [luEnd, setLuEnd] = useState('')
  const [luSite, setLuSite] = useState(''); const [luHorario, setLuHorario] = useState('')
  const [lugares, setLugares] = useState<LugarRow[]>([])

  // República
  const [rNome, setRNome] = useState(''); const [rEnd, setREnd] = useState(''); const [rTel, setRTel] = useState(''); const [rDesc, setRDesc] = useState('')
  const [republicas, setRepublicas] = useState<RepublicaRow[]>([])

  // UFOP
  const [uTitulo, setUTitulo] = useState(''); const [uDesc, setUDesc] = useState(''); const [uCat, setUCat] = useState('')
  const [uLink, setULink] = useState(''); const [uData, setUData] = useState('')
  const [ufops, setUfops] = useState<UfopRow[]>([])

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL

  useEffect(() => {
    if (!ativo) return
    if (!isLoaded) return
    if (!isSignedIn || !isAdmin) { irPara('home'); return }
    carregarDash()
  }, [ativo, isLoaded, isSignedIn, isAdmin, irPara])

  useEffect(() => {
    if (!ativo || !isAdmin) return
    carregarLista(aba)
  }, [aba, ativo, isAdmin])

  const carregarDash = async () => {
    const [{ count: nL }, { count: nA }, { count: nR }, { count: nAc }] = await Promise.all([
      supabase.from('lojas').select('*', { count: 'exact', head: true }),
      supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
      supabase.from('republicas').select('*', { count: 'exact', head: true }),
      supabase.from('acessos').select('*', { count: 'exact', head: true }),
    ])
    setStats({ lojas: nL ?? 0, avaliacoes: nA ?? 0, republicas: nR ?? 0, acessos: nAc ?? 0 })
  }

  const carregarLista = async (a: Aba) => {
    if (a === 'lojas') {
      const { data } = await supabase.from('lojas').select('id, NOME, nome, ATUALIZADO_EM, atualizado_em').order('id', { ascending: false }).limit(30)
      setLojas(data || [])
    } else if (a === 'eventos') {
      const { data } = await supabase.from('eventos').select('id, nome, data_evento, local').order('data_evento', { ascending: false }).limit(30)
      setEventos(data || [])
    } else if (a === 'lugares') {
      const { data } = await supabase.from('lugares_culturais').select('id, nome').order('nome').limit(30)
      setLugares(data || [])
    } else if (a === 'republicas') {
      const { data } = await supabase.from('republicas').select('id, nome').order('id', { ascending: false }).limit(30)
      setRepublicas(data || [])
    } else if (a === 'ufop') {
      const { data } = await supabase.from('ufop_conteudo').select('id, titulo, subcategoria').order('id', { ascending: false }).limit(30)
      setUfops(data || [])
    }
  }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const adicionarLoja = async () => {
    if (!lNome || !lCat) { flash('Nome e categoria são obrigatórios.'); return }
    const { error } = await supabase.from('lojas').insert({
      NOME: lNome, CATEGORIA: lCat, 'ENDEREÇO': lEnd || null,
      TELEFONE: lTel || null, SITE: lSite || null,
      'DESCRIÇÃO': lDesc || null, HORARIO: lHorario || null,
      lojista_id: user!.id, ATUALIZADO_EM: new Date().toISOString(),
    })
    if (error) { flash(`Erro: ${error.message}`); return }
    flash('Loja adicionada!')
    setLNome(''); setLCat(''); setLEnd(''); setLTel(''); setLSite(''); setLDesc(''); setLHorario('')
    carregarLista('lojas')
  }

  const adicionarEvento = async () => {
    if (!eNome || !eData) { flash('Nome e data são obrigatórios.'); return }
    const { error } = await supabase.from('eventos').insert({
      nome: eNome, descricao: eDesc || null, data_evento: eData,
      horario: eHorario || null, local: eLocal || null, link: eLink || null,
      ativo: true, fonte: 'admin',
    })
    if (error) { flash(`Erro: ${error.message}`); return }
    flash('Evento adicionado!')
    setENome(''); setEDesc(''); setEData(''); setEHorario(''); setELocal(''); setELink('')
    carregarLista('eventos')
  }

  const adicionarLugar = async () => {
    if (!luNome) { flash('Nome é obrigatório.'); return }
    const { error } = await supabase.from('lugares_culturais').insert({
      nome: luNome, descricao: luDesc || null, endereco: luEnd || null,
      site: luSite || null, horario_funcionamento: luHorario || null,
    })
    if (error) { flash(`Erro: ${error.message}`); return }
    flash('Lugar adicionado!')
    setLuNome(''); setLuDesc(''); setLuEnd(''); setLuSite(''); setLuHorario('')
    carregarLista('lugares')
  }

  const adicionarRepublica = async () => {
    if (!rNome) { flash('Nome é obrigatório.'); return }
    const { error } = await supabase.from('republicas').insert({
      nome: rNome, endereco: rEnd || null, telefone: rTel || null, descricao: rDesc || null,
    })
    if (error) { flash(`Erro: ${error.message}`); return }
    flash('República adicionada!')
    setRNome(''); setREnd(''); setRTel(''); setRDesc('')
    carregarLista('republicas')
  }

  const adicionarUfop = async () => {
    if (!uTitulo) { flash('Título é obrigatório.'); return }
    const { error } = await supabase.from('ufop_conteudo').insert({
      titulo: uTitulo, descricao: uDesc || null, subcategoria: uCat || null,
      link: uLink || null, data_encerramento: uData || null, ativo: true,
    })
    if (error) { flash(`Erro: ${error.message}`); return }
    flash('Conteúdo UFOP adicionado!')
    setUTitulo(''); setUDesc(''); setUCat(''); setULink(''); setUData('')
    carregarLista('ufop')
  }

  const deletar = async (tabela: string, id: number | string) => {
    if (!confirm('Apagar este item? Não pode ser desfeito.')) return
    const { error } = await supabase.from(tabela).delete().eq('id', id)
    if (error) { flash(`Erro: ${error.message}`); return }
    flash('Item apagado.')
    carregarLista(aba)
  }

  const diasAtras = (iso?: string) => {
    if (!iso) return '—'
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    return d === 0 ? 'hoje' : `${d}d atrás`
  }

  const ABAS: { key: Aba; label: string }[] = [
    { key: 'dash', label: '📊 Início' },
    { key: 'lojas', label: '🏪 Lojas' },
    { key: 'eventos', label: '📅 Eventos' },
    { key: 'lugares', label: '🏛 Lugares' },
    { key: 'republicas', label: '🏠 Repúblicas' },
    { key: 'ufop', label: '🎓 UFOP' },
  ]

  return (
    <div id="tela-admin" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="admin-header">
        <div className="eyebrow">Painel administrativo</div>
        <h2>Dashboard <em>Dica de Ouro</em></h2>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '12px 16px', borderBottom: '1px solid #ffffff10', scrollbarWidth: 'none' }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
            background: aba === a.key ? 'var(--gold-bright)' : '#ffffff08',
            border: `1px solid ${aba === a.key ? 'var(--gold-bright)' : '#ffffff15'}`,
            color: aba === a.key ? '#1a1410' : 'var(--cal)',
            fontFamily: "'Inter',sans-serif", fontWeight: aba === a.key ? 600 : 400, fontSize: '0.8rem',
          }}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="admin-corpo">
        {msg && (
          <div style={{ textAlign: 'center', fontSize: '0.82rem', padding: '8px 0', marginBottom: 8, color: msg.startsWith('Erro') ? '#ff6b6b' : '#7ecb98' }}>
            {msg}
          </div>
        )}

        {/* DASHBOARD */}
        {aba === 'dash' && (
          <>
            <div className="admin-grid">
              <div className="admin-stat"><div className="lbl">Lojas</div><div className="val">{stats.lojas}</div><div className="trend">Cadastradas</div></div>
              <div className="admin-stat"><div className="lbl">Avaliações</div><div className="val">{stats.avaliacoes}</div><div className="trend">Total</div></div>
              <div className="admin-stat"><div className="lbl">Repúblicas</div><div className="val">{stats.republicas}</div><div className="trend">Cadastradas</div></div>
              <div className="admin-stat"><div className="lbl">Acessos</div><div className="val">{stats.acessos}</div><div className="trend">Registrados</div></div>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: 16 }}>Use as abas acima para adicionar ou gerenciar conteúdo.</p>
            <button onClick={() => irPara('home')} style={{ ...S.btn, background: '#ffffff08', color: 'var(--cal)', fontWeight: 400 }}>← Ver o app</button>
          </>
        )}

        {/* LOJAS */}
        {aba === 'lojas' && (
          <>
            <div style={S.sec}>
              <div style={S.secTitle}>Adicionar loja</div>
              <div style={S.campo}><label style={S.lbl}>Nome *</label><input style={S.inp} value={lNome} onChange={e => setLNome(e.target.value)} placeholder="Ex: Café do Largo" /></div>
              <div style={S.campo}>
                <label style={S.lbl}>Categoria *</label>
                <div style={S.chipGrid}>{CATS.map(c => <span key={c} style={S.chip(lCat === c)} onClick={() => setLCat(c)}>{c}</span>)}</div>
              </div>
              <div style={S.campo}><label style={S.lbl}>Endereço</label><input style={S.inp} value={lEnd} onChange={e => setLEnd(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Telefone / WhatsApp</label><input style={S.inp} value={lTel} onChange={e => setLTel(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Site</label><input style={S.inp} value={lSite} onChange={e => setLSite(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Descrição</label><textarea style={{ ...S.inp, resize: 'vertical' }} rows={3} value={lDesc} onChange={e => setLDesc(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Horário</label><input style={S.inp} value={lHorario} onChange={e => setLHorario(e.target.value)} placeholder="ex: 11h às 23h — fechado às 2ª" /></div>
              <button style={S.btn} onClick={adicionarLoja}>+ Adicionar loja</button>
            </div>
            <div style={S.sec}>
              <div style={S.secTitle}>Lojas cadastradas ({lojas.length})</div>
              {lojas.map(l => (
                <div key={l.id} style={S.listItem}>
                  <div style={S.listName}>{l.NOME || l.nome || '—'}</div>
                  <div style={S.listSub}>{diasAtras(l.ATUALIZADO_EM || l.atualizado_em)}</div>
                  <button style={S.btnDel} onClick={() => deletar('lojas', l.id)}>✕</button>
                </div>
              ))}
              {lojas.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Nenhuma loja cadastrada.</div>}
            </div>
          </>
        )}

        {/* EVENTOS */}
        {aba === 'eventos' && (
          <>
            <div style={S.sec}>
              <div style={S.secTitle}>Adicionar evento</div>
              <div style={S.campo}><label style={S.lbl}>Nome *</label><input style={S.inp} value={eNome} onChange={e => setENome(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Data *</label><input style={S.inp} type="date" value={eData} onChange={e => setEData(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Horário</label><input style={S.inp} value={eHorario} onChange={e => setEHorario(e.target.value)} placeholder="ex: 19h" /></div>
              <div style={S.campo}><label style={S.lbl}>Local</label><input style={S.inp} value={eLocal} onChange={e => setELocal(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Link (site / ingresso)</label><input style={S.inp} value={eLink} onChange={e => setELink(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Descrição</label><textarea style={{ ...S.inp, resize: 'vertical' }} rows={3} value={eDesc} onChange={e => setEDesc(e.target.value)} /></div>
              <button style={S.btn} onClick={adicionarEvento}>+ Adicionar evento</button>
            </div>
            <div style={S.sec}>
              <div style={S.secTitle}>Eventos cadastrados ({eventos.length})</div>
              {eventos.map(e => (
                <div key={e.id} style={S.listItem}>
                  <div style={S.listName}>{e.nome}</div>
                  <div style={S.listSub}>{e.data_evento}</div>
                  <button style={S.btnDel} onClick={() => deletar('eventos', e.id)}>✕</button>
                </div>
              ))}
              {eventos.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Nenhum evento cadastrado.</div>}
            </div>
          </>
        )}

        {/* LUGARES */}
        {aba === 'lugares' && (
          <>
            <div style={S.sec}>
              <div style={S.secTitle}>Adicionar lugar cultural</div>
              <div style={S.campo}><label style={S.lbl}>Nome *</label><input style={S.inp} value={luNome} onChange={e => setLuNome(e.target.value)} placeholder="Ex: Museu da Inconfidência" /></div>
              <div style={S.campo}><label style={S.lbl}>Endereço</label><input style={S.inp} value={luEnd} onChange={e => setLuEnd(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Horário de funcionamento</label><input style={S.inp} value={luHorario} onChange={e => setLuHorario(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Site</label><input style={S.inp} value={luSite} onChange={e => setLuSite(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Descrição</label><textarea style={{ ...S.inp, resize: 'vertical' }} rows={3} value={luDesc} onChange={e => setLuDesc(e.target.value)} /></div>
              <button style={S.btn} onClick={adicionarLugar}>+ Adicionar lugar</button>
            </div>
            <div style={S.sec}>
              <div style={S.secTitle}>Lugares cadastrados ({lugares.length})</div>
              {lugares.map(l => (
                <div key={l.id} style={S.listItem}>
                  <div style={S.listName}>{l.nome}</div>
                  <button style={S.btnDel} onClick={() => deletar('lugares_culturais', l.id)}>✕</button>
                </div>
              ))}
              {lugares.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Nenhum lugar cadastrado.</div>}
            </div>
          </>
        )}

        {/* REPÚBLICAS */}
        {aba === 'republicas' && (
          <>
            <div style={S.sec}>
              <div style={S.secTitle}>Adicionar república</div>
              <div style={S.campo}><label style={S.lbl}>Nome *</label><input style={S.inp} value={rNome} onChange={e => setRNome(e.target.value)} placeholder="Ex: República Aurora" /></div>
              <div style={S.campo}><label style={S.lbl}>Endereço</label><input style={S.inp} value={rEnd} onChange={e => setREnd(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Telefone</label><input style={S.inp} value={rTel} onChange={e => setRTel(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Descrição</label><textarea style={{ ...S.inp, resize: 'vertical' }} rows={3} value={rDesc} onChange={e => setRDesc(e.target.value)} /></div>
              <button style={S.btn} onClick={adicionarRepublica}>+ Adicionar república</button>
            </div>
            <div style={S.sec}>
              <div style={S.secTitle}>Repúblicas cadastradas ({republicas.length})</div>
              {republicas.map(r => (
                <div key={r.id} style={S.listItem}>
                  <div style={S.listName}>{r.nome}</div>
                  <button style={S.btnDel} onClick={() => deletar('republicas', r.id)}>✕</button>
                </div>
              ))}
              {republicas.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Nenhuma república cadastrada.</div>}
            </div>
          </>
        )}

        {/* UFOP */}
        {aba === 'ufop' && (
          <>
            <div style={S.sec}>
              <div style={S.secTitle}>Adicionar conteúdo UFOP</div>
              <div style={S.campo}><label style={S.lbl}>Título *</label><input style={S.inp} value={uTitulo} onChange={e => setUTitulo(e.target.value)} placeholder="Ex: Bolsa PIBIC — Engenharia Civil" /></div>
              <div style={S.campo}>
                <label style={S.lbl}>Subcategoria</label>
                <div style={S.chipGrid}>{UFOP_SUBCATS.map(c => <span key={c} style={S.chip(uCat === c)} onClick={() => setUCat(c)}>{c}</span>)}</div>
              </div>
              <div style={S.campo}><label style={S.lbl}>Link</label><input style={S.inp} value={uLink} onChange={e => setULink(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Data de encerramento</label><input style={S.inp} type="date" value={uData} onChange={e => setUData(e.target.value)} /></div>
              <div style={S.campo}><label style={S.lbl}>Descrição</label><textarea style={{ ...S.inp, resize: 'vertical' }} rows={3} value={uDesc} onChange={e => setUDesc(e.target.value)} /></div>
              <button style={S.btn} onClick={adicionarUfop}>+ Adicionar conteúdo</button>
            </div>
            <div style={S.sec}>
              <div style={S.secTitle}>Conteúdos UFOP ({ufops.length})</div>
              {ufops.map(u => (
                <div key={u.id} style={S.listItem}>
                  <div style={S.listName}>{u.titulo}</div>
                  <div style={S.listSub}>{u.subcategoria || '—'}</div>
                  <button style={S.btnDel} onClick={() => deletar('ufop_conteudo', u.id)}>✕</button>
                </div>
              ))}
              {ufops.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Nenhum conteúdo cadastrado.</div>}
            </div>
          </>
        )}

        <button className="btn-sair-admin" onClick={() => irPara('home')}>← Voltar ao app</button>
      </div>
    </div>
  )
}
