'use client'

import { useEffect, useState, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import type { Loja } from '@/lib/types'

const CATS = ['Comer', 'Beber', 'Hospedar', 'Visitar', 'Comprar', 'Serviços', 'Saúde']
const EMOJIS: Record<string, string> = { Comer: '🍽', Beber: '🍺', Hospedar: '🛏', Visitar: '🏛', Comprar: '🛍', Serviços: '🔧', Saúde: '🏥' }
const ADMIN_EMAIL = 'admin@dicadeouro.com.br'

export default function TelaPainel({ ativo }: { ativo: boolean }) {
  const { irPara } = useApp()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const ativoRef = useRef(ativo)
  const [lojas, setLojas] = useState<Loja[]>([])
  const [lojaAtiva, setLojaAtiva] = useState<Loja | null>(null)
  const [nome, setNome] = useState('')
  const [cat, setCat] = useState('')
  const [sub, setSub] = useState('')
  const [end, setEnd] = useState('')
  const [tel, setTel] = useState('')
  const [siteL, setSiteL] = useState('')
  const [desc, setDesc] = useState('')
  const [horario, setHorario] = useState('')
  const [foto, setFoto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState('')
  const [acessosCount, setAcessosCount] = useState<number | null>(null)
  const [avaliCount, setAvaliCount] = useState<number | null>(null)

  const emailLojista = user?.primaryEmailAddress?.emailAddress?.split('@')[0] || ''
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL

  useEffect(() => {
    ativoRef.current = ativo
  }, [ativo])

  useEffect(() => {
    if (!ativo) return
    if (!isLoaded) return
    if (!isSignedIn || !user) { irPara('login'); return }

    const uid = user.id
    supabase.from('lojas').select('*').eq('lojista_id', uid).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!ativoRef.current) return
        if (!data?.length) { irPara('login'); return }
        setLojas(data)
        preencherForm(data[0])
        const id = data[0].id
        supabase.from('acessos').select('*', { count: 'exact', head: true }).eq('id_local', id).then(({ count }) => setAcessosCount(count ?? 0))
        supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('loja_id', id).then(({ count }) => setAvaliCount(count ?? 0))
      })
  }, [ativo, isLoaded, isSignedIn, user, irPara])

  const preencherForm = (l: Loja) => {
    setLojaAtiva(l)
    setNome(l['NOME'] || l.nome || '')
    const catBase = (l['CATEGORIA'] || l.categoria || '').split(' · ')[0]
    const subBase = (l['CATEGORIA'] || l.categoria || '').includes(' · ')
      ? (l['CATEGORIA'] || l.categoria || '').split(' · ')[1] : ''
    setCat(catBase)
    setSub(subBase)
    setEnd(l['ENDEREÇO'] || l.endereco || '')
    setTel(l['TELEFONE'] || l.telefone || '')
    setSiteL(l['SITE'] || l.site || '')
    setDesc(l['DESCRIÇÃO'] || l.descricao || '')
    setHorario(l['HORARIO'] || l.horario || '')
    setFoto(l['FOTO'] || l.foto || '')
  }

  const uploadFoto = async (file: File) => {
    if (!lojaAtiva) return
    setUploadando(true)
    const ext = file.name.split('.').pop()
    const path = `lojas/${lojaAtiva.id}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('fotos').upload(path, file, { upsert: true })
    if (upErr) { setMsg(`Erro upload: ${upErr.message}`); setUploadando(false); return }
    const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
    const url = urlData.publicUrl
    setFoto(url)
    await supabase.from('lojas').update({ 'FOTO': url }).eq('id', lojaAtiva.id)
    setUploadando(false)
    setMsg('Foto salva!')
    setTimeout(() => setMsg(''), 3000)
  }

  const salvar = async () => {
    if (!lojaAtiva) { setMsg('Nenhuma loja selecionada.'); return }
    setSalvando(true)
    const catFinal = sub ? `${cat} · ${sub}` : cat
    const { error } = await supabase.from('lojas').update({
      'NOME': nome, 'CATEGORIA': catFinal, 'ENDEREÇO': end,
      'TELEFONE': tel || null, 'SITE': siteL || null,
      'DESCRIÇÃO': desc || null, 'HORARIO': horario || null,
      'FOTO': foto || null,
      'ATUALIZADO_EM': new Date().toISOString(),
    }).eq('id', lojaAtiva.id)
    setSalvando(false)
    setMsg(error ? `Erro: ${error.message}` : 'Salvo com sucesso!')
    setTimeout(() => setMsg(''), 4000)
  }

  const gerarDescricaoIA = async () => {
    if (!nome) return
    setDesc('Gerando…')
    const res = await fetch('/api/descricao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, categoria: cat, endereco: end }),
    })
    const { descricao } = await res.json()
    setDesc(descricao || '')
  }

  const sair = async () => {
    await signOut()
    irPara('home')
  }

  const apagarAnuncio = async () => {
    if (!lojaAtiva) return
    if (!confirm(`Apagar "${lojaAtiva['NOME'] || lojaAtiva.nome}"? Esta ação não pode ser desfeita.`)) return
    await supabase.from('lojas').delete().eq('id', lojaAtiva.id)
    const restantes = lojas.filter(l => l.id !== lojaAtiva.id)
    if (restantes.length) { setLojas(restantes); preencherForm(restantes[0]) }
    else { await signOut(); irPara('home') }
  }

  const expiraEm = () => {
    if (!lojaAtiva) return '—'
    const at = lojaAtiva['ATUALIZADO_EM'] || lojaAtiva.atualizado_em
    if (!at) return '0 dias'
    const diasRestantes = Math.max(0, 7 - Math.floor((Date.now() - new Date(at).getTime()) / 86400000))
    return `${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`
  }
  const barraVal = () => {
    if (!lojaAtiva) return 0
    const at = lojaAtiva['ATUALIZADO_EM'] || lojaAtiva.atualizado_em
    if (!at) return 0
    const dias = (Date.now() - new Date(at).getTime()) / 86400000
    return Math.max(0, Math.min(100, (1 - dias / 7) * 100))
  }

  return (
    <div id="tela-painel" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="painel-topo">
        <div className="painel-eyebrow">Painel do lojista</div>
        <h2>Olá, <em>{emailLojista}</em></h2>
        <div className="sub">{lojaAtiva?.['NOME'] || lojaAtiva?.nome || '—'}</div>
      </div>
      <button
        onClick={() => irPara('home')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff0a', border: '1px solid #ffffff15', borderRadius: 10, color: 'var(--cal)', fontSize: '0.8rem', cursor: 'pointer', padding: '9px 16px', margin: '0 16px 8px', width: 'calc(100% - 32px)', flexShrink: 0 }}
      >
        ← Ver o app
      </button>
      <div className="painel-corpo">
        {/* VALIDADE */}
        <div className="validade-card">
          <div className="validade-row">
            <div className="lbl">Suas informações expiram em</div>
            <div className="count">{expiraEm()}</div>
          </div>
          <div className="validade-barra"><div className="fill" style={{ width: `${barraVal()}%` }} /></div>
          <div className="validade-msg">Após o prazo, sua loja some das buscas. Manter fresco é manter visível.</div>
        </div>

        {/* SELETOR DE LOJAS */}
        {lojas.length > 1 && (
          <div className="painel-sec">
            <h3>Suas lojas</h3>
            <div className="loja-selector">
              {lojas.map(l => (
                <div
                  key={l.id}
                  className={`loja-btn${lojaAtiva?.id === l.id ? ' ativa' : ''}`}
                  onClick={() => preencherForm(l)}
                >
                  <div className="loja-thumb-mini" style={l['FOTO'] || l.foto ? { backgroundImage: `url('${l['FOTO'] || l.foto}')` } : {}} />
                  <div className="loja-info-mini">
                    <div className="nome">{l['NOME'] || l.nome}</div>
                    <div className="cat">{l['CATEGORIA'] || l.categoria}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-nova-loja" onClick={() => irPara('cadastro')}>+ Cadastrar nova loja</button>
          </div>
        )}

        {/* FOTO */}
        <div className="painel-sec">
          <h3>Foto da loja</h3>
          <div
            onClick={() => fotoInputRef.current?.click()}
            style={{
              width: '100%', height: 160, borderRadius: 14,
              background: foto ? `url(${foto}) center/cover no-repeat` : '#ffffff08',
              border: '2px dashed #ffffff18', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cal)', opacity: 0.6, fontSize: '0.82rem',
            }}
          >
            {!foto && (uploadando ? 'Enviando…' : '+ Adicionar foto')}
          </div>
          {foto && (
            <button
              onClick={() => fotoInputRef.current?.click()}
              style={{ marginTop: 8, width: '100%', padding: '9px', background: '#ffffff08', border: '1px solid #ffffff18', borderRadius: 10, color: 'var(--cal)', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              {uploadando ? 'Enviando…' : '📷 Trocar foto'}
            </button>
          )}
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f) }}
          />
        </div>

        {/* FORM */}
        <div className="painel-sec">
          <h3>Informações da loja</h3>
          <div className="campo-editar"><label>Nome da loja</label><input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div className="campo-editar">
            <label>Categoria</label>
            <div className="cat-selector">
              {CATS.map(c => (
                <div key={c} className={`cat-option${cat === c ? ' selecionado' : ''}`} onClick={() => setCat(c)}>
                  {EMOJIS[c]} {c}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <input value={sub} onChange={e => setSub(e.target.value)} placeholder="Detalhe opcional: ex. Cachaça artesanal" style={{ width: '100%', padding: '10px 13px', background: '#ffffff06', border: '1px solid #ffffff15', borderRadius: 12, color: 'var(--cal)', fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', outline: 'none' }} />
            </div>
          </div>
          <div className="campo-editar"><label>Endereço</label><input value={end} onChange={e => setEnd(e.target.value)} /></div>
          <div className="campo-editar"><label>Telefone / WhatsApp</label><input value={tel} onChange={e => setTel(e.target.value)} /></div>
          <div className="campo-editar"><label>Site</label><input value={siteL} onChange={e => setSiteL(e.target.value)} /></div>
        </div>

        <div className="painel-sec">
          <h3>Novidade de hoje</h3>
          <div className="campo-editar">
            <label>Descrição / destaque do dia</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que tem de especial hoje?" />
            <button
              onClick={gerarDescricaoIA}
              style={{ marginTop: 6, width: '100%', padding: '9px', background: '#d4a04a20', border: '1px solid var(--gold-bright)', borderRadius: 10, color: 'var(--gold-bright)', fontFamily: "'Inter',sans-serif", fontSize: '0.78rem', cursor: 'pointer' }}
            >
              ✨ Gerar com IA
            </button>
          </div>
          <div className="campo-editar">
            <label>Horário de funcionamento</label>
            <input value={horario} onChange={e => setHorario(e.target.value)} placeholder="ex: 11h às 23h — fechado às 2ª" />
          </div>
        </div>

        {/* STATS */}
        {(acessosCount !== null || avaliCount !== null) && (
          <div className="painel-sec">
            <h3>Desempenho</h3>
            <div className="stats-grid">
              <div className="stat-cell"><div className="lbl">Visitas</div><div className="val">{acessosCount ?? '—'}</div></div>
              <div className="stat-cell"><div className="lbl">Avaliações</div><div className="val">{avaliCount ?? '—'}</div></div>
            </div>
          </div>
        )}

        <button className="btn-salvar" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar e renovar prazo'}
        </button>
        <div className="salvo-msg" style={{ color: msg.startsWith('Erro') ? '#ff6b6b' : undefined }}>{msg}</div>

        <button
          onClick={() => irPara('pagamento')}
          style={{ width: '100%', padding: 13, background: '#d4a04a15', color: 'var(--gold-bright)', border: '1px solid var(--gold-bright)', borderRadius: 13, fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', cursor: 'pointer', marginTop: 10 }}
        >
          💳 Renovar plano (R$ 49,90)
        </button>

        <button
          onClick={apagarAnuncio}
          style={{ width: '100%', padding: 13, background: 'transparent', color: '#c47a5a', border: '1px solid #c47a5a40', borderRadius: 13, fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', cursor: 'pointer', marginTop: 10, opacity: 0.7 }}
        >
          🗑 Apagar este anúncio
        </button>

        {isAdmin && (
          <button
            onClick={() => irPara('admin')}
            style={{ width: '100%', padding: 13, background: '#ffffff08', color: 'var(--cal)', border: '1px solid #ffffff20', borderRadius: 13, fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', cursor: 'pointer', marginTop: 10 }}
          >
            ⚙️ Painel Admin
          </button>
        )}

        <button className="btn-sair" onClick={sair}>Sair da conta</button>
      </div>
    </div>
  )
}
