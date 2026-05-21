'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import { tempoAtras, corDot, nomeLoja, catLoja, endLoja, fotoLoja, atualizadoLoja } from '@/lib/utils'
import type { Loja, Evento, Republica, UfopConteudo } from '@/lib/types'

const CATS = ['Tudo', '🔍 Descubra', '🍽 Comer', '🍺 Beber', '🛏 Hospedar', '🛍 Comprar', '🔧 Serviços', '🏥 Saúde', '🏠 Repúblicas', '🎓 UFOP']

const UFOP_SUBCATS = [
  { key: 'laboratorios', emoji: '🔬', label: 'Laboratórios' },
  { key: 'extensao', emoji: '🌱', label: 'Extensão' },
  { key: 'vagas', emoji: '💼', label: 'Vagas' },
  { key: 'iniciacao', emoji: '🧪', label: 'Iniciação Científica' },
  { key: 'estagio', emoji: '📋', label: 'Estágio' },
  { key: 'pos_graduacao', emoji: '🎓', label: 'Pós-graduação' },
  { key: 'concursos', emoji: '📣', label: 'Concursos' },
]

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia, viajante.'
  if (h < 18) return 'Boa tarde, viajante.'
  return 'Boa noite, viajante.'
}

function IconeLoja({ cat, cor }: { cat: string; cor: string }) {
  const s = cor === 't1' ? '#1a1410' : '#faf6ec'
  const c = cat.toLowerCase()
  if (c.includes('restaurante') || c.includes('comida') || c.includes('comer'))
    return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5"><path d="M3 12h18M5 12v8h14v-8M7 12V8a5 5 0 0 1 10 0v4"/></svg>
  if (c.includes('bar') || c.includes('cachaca') || c.includes('beber'))
    return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5"><path d="M6 2h12l-2 8a4 4 0 0 1-8 0z M12 14v6 M8 22h8"/></svg>
  return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5"><path d="M6 2h12l1 7H5zm0 7v11h12V9"/></svg>
}

export default function TelaHome({ ativo }: { ativo: boolean }) {
  const { irPara, setLojaAtual, setLojaAvaliando, setTodasLojas, todasLojas } = useApp()
  const [catAtiva, setCatAtiva] = useState('Tudo')
  const [lojasFiltradas, setLojasFiltradas] = useState<Loja[]>([])
  const [carregando, setCarregando] = useState(true)
  const [destaque, setDestaque] = useState<Loja | null>(null)
  const [destaqueRating, setDestaqueRating] = useState<string>('—')
  const [eventosHome, setEventosHome] = useState<Evento[]>([])
  const [mediasMap, setMediasMap] = useState<Record<number, number>>({})
  const [busca, setBusca] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [republicas, setRepublicas] = useState<Republica[]>([])
  const [repCarregando, setRepCarregando] = useState(false)
  const [ufopItens, setUfopItens] = useState<UfopConteudo[]>([])
  const [ufopSubcatAtiva, setUfopSubcatAtiva] = useState<string | null>(null)

  const modo = catAtiva === '🏠 Repúblicas' ? 'republicas'
    : catAtiva === '🎓 UFOP' ? 'ufop'
    : catAtiva === '🔍 Descubra' ? 'descubra'
    : 'lojas'

  const carregarLojas = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase.from('lojas').select('*').order('created_at', { ascending: false })
    setCarregando(false)
    if (!data?.length) return
    setTodasLojas(data)
    setLojasFiltradas(data)

    const ids = data.map((l: Loja) => l.id)
    const { data: avals } = await supabase
      .from('avaliacoes')
      .select('loja_id,nota_geral')
      .in('loja_id', ids)
    if (avals) {
      const map: Record<number, number[]> = {}
      avals.forEach((a: { loja_id: number; nota_geral: number }) => {
        if (!map[a.loja_id]) map[a.loja_id] = []
        map[a.loja_id].push(parseFloat(String(a.nota_geral || 0)))
      })
      const medias: Record<number, number> = {}
      Object.entries(map).forEach(([id, ns]) => {
        medias[Number(id)] = ns.reduce((s, n) => s + n, 0) / ns.length
      })
      setMediasMap(medias)
    }

    const frescas = data.filter((l: Loja) => {
      const at = atualizadoLoja(l)
      return at && (Date.now() - new Date(at).getTime()) < 72 * 3600000
    })
    const pool = frescas.length ? frescas : data
    pool.sort((a: Loja, b: Loja) => ((b.ACESSOS || b.acessos || 0) - (a.ACESSOS || a.acessos || 0)))
    setDestaque(pool[0])

    const { data: avsD } = await supabase
      .from('avaliacoes')
      .select('nota_geral')
      .eq('loja_id', pool[0].id)
    if (avsD?.length) {
      const m = (avsD.reduce((s: number, a: { nota_geral: number }) => s + parseFloat(String(a.nota_geral || 0)), 0) / avsD.length).toFixed(1)
      setDestaqueRating(m)
    }
  }, [setTodasLojas])

  const carregarEventosHome = useCallback(async () => {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('ativo', true)
      .gte('data_evento', hoje)
      .order('data_evento', { ascending: true })
      .limit(3)
    if (data) setEventosHome(data)
  }, [])

  useEffect(() => {
    if (!ativo) return
    carregarLojas()
    carregarEventosHome()
  }, [ativo, carregarLojas, carregarEventosHome])

  const registrarAcesso = (tipo: string, id: number, nome: string) => {
    void supabase.from('acessos').insert({ tipo, id_local: id, nome_local: nome })
  }

  const carregarRepublicas = useCallback(async () => {
    setRepCarregando(true)
    const { data } = await supabase.from('republicas').select('*').order('created_at', { ascending: false })
    setRepCarregando(false)
    if (data) setRepublicas(data)
  }, [])

  const carregarUFOP = useCallback(async (subcat?: string) => {
    let q = supabase.from('ufop_conteudo').select('*').eq('ativo', true).order('created_at', { ascending: false })
    if (subcat) q = q.eq('subcategoria', subcat)
    const { data } = await q
    if (data) setUfopItens(data)
  }, [])

  const filtrar = (cat: string) => {
    setCatAtiva(cat)
    setUfopSubcatAtiva(null)
    setBusca('')
    if (cat === '🏠 Repúblicas') { carregarRepublicas(); return }
    if (cat === '🎓 UFOP') { setUfopItens([]); carregarUFOP(); return }
    if (cat === 'Tudo' || cat === '🔍 Descubra') { setLojasFiltradas(todasLojas); return }
    const chave = cat.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase()
    setLojasFiltradas(todasLojas.filter(l => catLoja(l).toLowerCase().includes(chave)))
  }

  const filtrarUFOPSubcat = (subcat: string) => {
    const novo = ufopSubcatAtiva === subcat ? null : subcat
    setUfopSubcatAtiva(novo)
    carregarUFOP(novo ?? undefined)
  }

  const abrirBuscaIA = async (query: string) => {
    if (!query.trim()) return
    setBuscando(true)
    setCatAtiva('Tudo')
    try {
      const res = await fetch('/api/busca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lojas: todasLojas }),
      })
      const { resultado } = await res.json()
      if (resultado?.length) setLojasFiltradas(resultado)
      else setLojasFiltradas([])
    } finally {
      setBuscando(false)
    }
  }

  const abrirLoja = (loja: Loja) => {
    setLojaAtual(loja)
    setLojaAvaliando({ id: loja.id, nome: nomeLoja(loja) })
    void Promise.resolve(supabase.rpc('incrementar_acessos', { loja_id: loja.id }))
    registrarAcesso('loja', loja.id, nomeLoja(loja))
    irPara('detalhe')
  }

  const tc = (i: number) => (['t1', 't2', 't3'] as const)[i % 3]

  const tituloSecao = () => {
    if (catAtiva === 'Tudo') return <><h2>Atualizados <em>hoje</em></h2><span>{todasLojas.length} locais</span></>
    const label = catAtiva.replace(/[^\w\sÀ-ÿ]/g, '').trim()
    return <><h2><em>{label}</em></h2><span>{lojasFiltradas.length} local{lojasFiltradas.length !== 1 ? 'is' : ''}</span></>
  }

  return (
    <div id="tela-home" className={`tela${ativo ? '' : ' oculta'}`}>
      {/* HERO */}
      <div className="hero">
        <div className="hero-topo">
          <div className="marca">Dica de <b>Ouro</b></div>
          <button
            style={{ width: 36, height: 36, background: '#ffffff12', border: '1px solid #ffffff20', borderRadius: '50%', color: 'var(--cal)', cursor: 'pointer', fontSize: '1rem' }}
            onClick={() => irPara('chat')}
            title="Assistente IA"
          >✦</button>
        </div>
        <div className="hero-saudacao">{saudacao()}</div>
        <h1 className="hero-titulo">Descubra o que está <em>aberto e quente</em> agora.</h1>
        <div className="busca">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.45">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>
          </svg>
          <input
            placeholder="Restaurantes, ateliês, bares…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && abrirBuscaIA(busca)}
          />
          {buscando
            ? <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>buscando…</span>
            : busca.length > 0 && (
              <button
                onClick={() => abrirBuscaIA(busca)}
                style={{ background: 'var(--gold-bright)', border: 'none', borderRadius: 8, color: 'var(--ink)', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              >
                Buscar
              </button>
            )
          }
        </div>
      </div>

      <div className="home-corpo">
        {/* CATEGORIAS */}
        <div className="cats">
          {CATS.map(c => (
            <div key={c} className={`cat${catAtiva === c ? ' ativo' : ''}`} onClick={() => filtrar(c)}>
              {c}
            </div>
          ))}
        </div>

        {/* DESTAQUE + EVENTOS — só no Tudo */}
        {catAtiva === 'Tudo' && (
          <>
            {destaque && (
              <div className="destaque" onClick={() => abrirLoja(destaque)}>
                <div
                  className="destaque-img"
                  style={fotoLoja(destaque) ? {
                    backgroundImage: `linear-gradient(180deg,transparent 35%,#1a1410cc 100%), url('${fotoLoja(destaque)}')`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  } : {}}
                >
                  <div className="destaque-badge">Dica do dia</div>
                </div>
                <div className="destaque-corpo">
                  <h3 dangerouslySetInnerHTML={{
                    __html: (() => {
                      const partes = nomeLoja(destaque).split(' ')
                      const ul = partes.pop()
                      return partes.length ? `${partes.join(' ')} <em>${ul}</em>` : nomeLoja(destaque)
                    })()
                  }} />
                  {(destaque.DESCRIÇÃO || destaque.descricao) && (
                    <p>&ldquo;{(destaque.DESCRIÇÃO || destaque.descricao || '').substring(0, 80)}&rdquo;</p>
                  )}
                  <div className="destaque-meta">
                    <div className="rating">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 7h7l-5.7 4.2 2.2 7L12 16l-5.9 4.2 2.2-7L2.4 9h7z"/>
                      </svg>
                      {destaqueRating}
                    </div>
                    <div className="fresco">
                      <span className={`dot ${corDot(atualizadoLoja(destaque))}`} />
                      {tempoAtras(atualizadoLoja(destaque))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {eventosHome.length > 0 && (
              <div className="card-eventos">
                <div className="ev-label">Próximos eventos</div>
                <h3>Agenda de <em>Ouro Preto</em></h3>
                <p>Cadastrados pela equipe do Dica de Ouro.</p>
                <div className="ev-lista">
                  {eventosHome.map(ev => {
                    const d = new Date(ev.data_evento + 'T12:00:00')
                    return (
                      <div key={ev.id} className="ev-row" onClick={() => irPara('agenda')}>
                        <div className="ev-data">
                          <div className="d">{d.getDate()}</div>
                          <div className="m">{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</div>
                        </div>
                        <div className="ev-texto">
                          <div className="nome">{ev.nome}</div>
                          <div className="src">{ev.fonte || 'Ouro Preto'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* GRID DESCUBRA */}
        {modo === 'descubra' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
            {[
              { label: 'Igrejas', emoji: '⛪', sub: 'Barroco mineiro', bg: 'linear-gradient(135deg,#2c2218,#1a1410)' },
              { label: 'Museus', emoji: '🏛', sub: 'História e arte', bg: 'linear-gradient(135deg,#3d2e1f,#2c2218)' },
              { label: 'Minas', emoji: '⛏', sub: 'Ouro e aventura', bg: 'linear-gradient(135deg,#1a1410,#2c2218)' },
              { label: 'Parques', emoji: '🌿', sub: 'Natureza e cachoeiras', bg: 'linear-gradient(135deg,#2c3820,#1a2410)' },
            ].map(item => (
              <div
                key={item.label}
                onClick={() => irPara('agenda')}
                style={{ background: item.bg, borderRadius: 18, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', color: 'var(--cal)' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{item.emoji}</div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: '1rem', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 3 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* REPÚBLICAS */}
        {modo === 'republicas' && (
          <>
            <div className="sec-topo">
              <h2>Repúblicas <em>estudantis</em></h2>
              <span>{republicas.length || ''}</span>
            </div>
            <div className="lugares">
              {repCarregando
                ? <div className="carregando">Carregando repúblicas…</div>
                : republicas.length === 0
                  ? <div className="carregando">Nenhuma república cadastrada ainda.</div>
                  : republicas.map(r => (
                    <div key={r.id} className="lugar" onClick={() => registrarAcesso('republica', r.id, r.nome)}>
                      <div
                        className="lugar-thumb t2"
                        style={r.foto ? { backgroundImage: `url('${r.foto}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      >
                        {!r.foto && <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#faf6ec" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                      </div>
                      <div className="lugar-info">
                        <div className="cat-tag">República</div>
                        <h4>{r.nome}</h4>
                        <div className="onde">{r.endereco || '—'}</div>
                        {r.telefone && <div className="meta-row"><span className="stars">📞 {r.telefone}</span></div>}
                      </div>
                    </div>
                  ))
              }
            </div>
          </>
        )}

        {/* UFOP */}
        {modo === 'ufop' && (
          <>
            <div className="sec-topo">
              <h2>Oportunidades <em>UFOP</em></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {UFOP_SUBCATS.map(s => (
                <div
                  key={s.key}
                  onClick={() => filtrarUFOPSubcat(s.key)}
                  style={{
                    background: ufopSubcatAtiva === s.key ? 'var(--gold-bright)' : 'var(--ink-soft)',
                    border: `1px solid ${ufopSubcatAtiva === s.key ? 'var(--gold-bright)' : '#ffffff15'}`,
                    borderRadius: 14, padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
                    color: ufopSubcatAtiva === s.key ? 'var(--ink)' : 'var(--cal)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.emoji}</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.78rem', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {ufopItens.length > 0 && (
              <div className="lugares">
                {ufopItens.map(u => (
                  <div key={u.id} className="lugar" onClick={() => registrarAcesso('ufop', u.id, u.titulo)}>
                    <div className="lugar-thumb t3" style={u.foto ? { backgroundImage: `url('${u.foto}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                      {!u.foto && <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1a1410" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}
                    </div>
                    <div className="lugar-info">
                      <div className="cat-tag">{u.subcategoria || 'UFOP'}</div>
                      <h4>{u.titulo}</h4>
                      {u.descricao && <div className="onde">{u.descricao.substring(0, 60)}</div>}
                      {u.data_encerramento && (
                        <div className="meta-row">
                          <span className="stars">Encerra {new Date(u.data_encerramento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {u.link && (
                        <div className="meta-row">
                          <a href={u.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--gold-bright)' }} onClick={e => e.stopPropagation()}>
                            Ver detalhes →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {ufopSubcatAtiva && ufopItens.length === 0 && (
              <div className="carregando">Nenhum conteúdo nessa categoria ainda.</div>
            )}
          </>
        )}

        {/* LISTA LOJAS */}
        {modo === 'lojas' && (
          <>
            <div className="sec-topo">
              {tituloSecao()}
            </div>
            <div className="lugares">
              {carregando
                ? <div className="carregando">Carregando lojas…</div>
                : lojasFiltradas.length === 0
                  ? <div className="carregando">Nenhum local encontrado{catAtiva !== 'Tudo' ? ` em ${catAtiva.replace(/[^\w\sÀ-ÿ]/g, '').trim()}` : ''}.</div>
                  : lojasFiltradas.map((l, i) => {
                    const foto = fotoLoja(l)
                    const media = mediasMap[l.id]
                    const cor = tc(i)
                    return (
                      <div key={l.id} className="lugar" onClick={() => abrirLoja(l)}>
                        <div
                          className={`lugar-thumb${foto ? '' : ' ' + cor}`}
                          style={foto ? { backgroundImage: `url('${foto}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                          {!foto && <IconeLoja cat={catLoja(l)} cor={cor} />}
                        </div>
                        <div className="lugar-info">
                          <div className="cat-tag">{catLoja(l)}</div>
                          <h4>{nomeLoja(l)}</h4>
                          <div className="onde">{endLoja(l)}</div>
                          <div className="meta-row">
                            <span className="stars">{media ? `★ ${media.toFixed(1)}` : '★ —'}</span>
                            <div className="fresco">
                              <span className={`dot ${corDot(atualizadoLoja(l))}`} />
                              {tempoAtras(atualizadoLoja(l))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}
