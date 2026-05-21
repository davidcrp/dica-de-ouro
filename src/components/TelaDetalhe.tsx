'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import { tempoAtras, corDot, nomeLoja, catLoja, endLoja, fotoLoja, atualizadoLoja, getFavoritos, setFavoritos } from '@/lib/utils'
import type { Avaliacao } from '@/lib/types'

export default function TelaDetalhe({ ativo }: { ativo: boolean }) {
  const { lojaAtual, lojaAvaliando, irPara, voltarPara } = useApp()
  const [avals, setAvals] = useState<Avaliacao[]>([])
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (!ativo || !lojaAtual) return
    setAvals([])

    const favs = getFavoritos()
    setIsFav(!!favs.find(f => f.id === lojaAtual.id))

    supabase
      .from('avaliacoes')
      .select('*')
      .eq('loja_id', lojaAtual.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAvals(data) })
  }, [ativo, lojaAtual])

  if (!lojaAtual) return null

  const nome = nomeLoja(lojaAtual)
  const cat = catLoja(lojaAtual)
  const end = endLoja(lojaAtual)
  const foto = fotoLoja(lojaAtual)
  const at = atualizadoLoja(lojaAtual)
  const desc = lojaAtual['DESCRIÇÃO'] || lojaAtual.descricao || ''
  const tel = lojaAtual['TELEFONE'] || lojaAtual.telefone || ''
  const horario = lojaAtual['HORARIO'] || lojaAtual.horario || ''
  const site = lojaAtual['SITE'] || lojaAtual.site || ''

  const total = avals.length
  const mediaGeral = total ? (avals.reduce((s, a) => s + (a.nota_geral || 0), 0) / total).toFixed(1) : null
  const mediaProd = total ? (avals.reduce((s, a) => s + (a.nota_produto || 0), 0) / total).toFixed(1) : '—'
  const mediaSrv = total ? (avals.reduce((s, a) => s + (a.nota_servico || 0), 0) / total).toFixed(1) : '—'
  const mediaEstr = total ? (avals.reduce((s, a) => s + (a.nota_estrutura || 0), 0) / total).toFixed(1) : '—'
  const comentarios = avals.filter(a => a.comentario?.trim()).slice(0, 5)

  const h = at ? (Date.now() - new Date(at).getTime()) / 3600000 : 999
  const pct = Math.max(0, Math.min(100, 100 - (h / 72 * 100)))
  const barraColor = h < 12
    ? 'linear-gradient(90deg,#6db96d,#b8893a)'
    : h < 48 ? 'linear-gradient(90deg,#b8893a,#d4a04a)'
    : 'linear-gradient(90deg,#8a3a1f,#c46b48)'

  const partes = nome.split(' ')
  const ultima = partes.pop()
  const nomeHtml = partes.length ? `${partes.join(' ')} <em>${ultima}</em>` : nome

  const toggleFav = () => {
    const favs = getFavoritos()
    const idx = favs.findIndex(f => f.id === lojaAtual.id)
    if (idx >= 0) {
      favs.splice(idx, 1)
      setIsFav(false)
    } else {
      favs.push({ id: lojaAtual.id, nome, cat, end, foto: foto || null })
      setIsFav(true)
    }
    setFavoritos(favs)
  }

  return (
    <div id="tela-detalhe" className={`tela${ativo ? '' : ' oculta'}`}>
      {/* HERO */}
      <div className="detalhe-hero">
        {foto && <div className="detalhe-hero-foto" style={{ backgroundImage: `url('${foto}')` }} />}
        <div className="detalhe-nav">
          <button className="btn-redondo" onClick={() => voltarPara('home')}>←</button>
          <button
            className={`btn-redondo btn-fav${isFav ? ' curtido' : ''}`}
            onClick={toggleFav}
          >
            {isFav ? '♥' : '♡'}
          </button>
        </div>
        <div className="detalhe-fundo">
          <div className="cat-tag">{cat}</div>
          <h2 dangerouslySetInnerHTML={{ __html: nomeHtml }} />
          <div className="detalhe-quick">
            <span className="stars">★ {mediaGeral || '—'}</span>
            <span>{total ? `· ${total} avaliação${total > 1 ? 'ões' : ''}` : '· Sem avaliações ainda'}</span>
          </div>
        </div>
      </div>

      {/* FRESCOR */}
      <div className="frescor-strip">
        <div className="frescor-esq">
          <div className="frescor-ic">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="frescor-info">
            <div className="lbl">Informação fresca</div>
            <div className="val">{at ? 'Atualizado ' + tempoAtras(at).toLowerCase() : 'Nunca atualizado'}</div>
          </div>
        </div>
        <div className="barra-val">
          <div className="barra-fill" style={{ width: `${pct}%`, background: barraColor }} />
        </div>
      </div>

      {/* CORPO */}
      <div className="detalhe-corpo">
        <div className="notas-trio">
          <div className="nota-cel"><div className="lbl">Produto</div><div className="num">{mediaProd}<span>/5</span></div></div>
          <div className="nota-cel"><div className="lbl">Serviço</div><div className="num">{mediaSrv}<span>/5</span></div></div>
          <div className="nota-cel"><div className="lbl">Estrutura</div><div className="num">{mediaEstr}<span>/5</span></div></div>
        </div>

        {comentarios.length > 0 && (
          <div className="sec-det">
            <h3>O que disseram</h3>
            {comentarios.map(a => (
              <div key={a.id} className="comentario-card">
                <div className="com-header">
                  <span className="com-nome">{a.nome_avaliador || 'Anônimo'}</span>
                  <span className="com-nota">★ {parseFloat(String(a.nota_geral || 0)).toFixed(1)}</span>
                </div>
                <div className="com-texto">&ldquo;{a.comentario}&rdquo;</div>
                <div className="com-data">{new Date(a.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
              </div>
            ))}
          </div>
        )}

        {desc && (
          <div className="sec-det">
            <h3>Sobre o local</h3>
            <p>{desc}</p>
          </div>
        )}

        <div className="sec-det">
          <div className="info-linhas">
            {horario && (
              <div className="info-linha">
                <div className="ic">⏰</div>
                <div className="cnt"><div className="lbl">Horário</div><div className="val">{horario}</div></div>
              </div>
            )}
            <div className="info-linha">
              <div className="ic">📍</div>
              <div className="cnt"><div className="lbl">Endereço</div><div className="val">{end}</div></div>
            </div>
            {tel && (
              <div className="info-linha">
                <div className="ic">📞</div>
                <div className="cnt"><div className="lbl">Contato</div><div className="val">{tel}</div></div>
              </div>
            )}
            {site && (
              <div className="info-linha">
                <div className="ic">🌐</div>
                <div className="cnt">
                  <div className="lbl">Site</div>
                  <div
                    className="val"
                    style={{ color: 'var(--gold-deep)', cursor: 'pointer' }}
                    onClick={() => window.open(site.startsWith('http') ? site : 'https://' + site, '_blank')}
                  >
                    {site.replace(/^https?:\/\//, '')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA FIXO */}
      <div className="cta-fixo">
        <button
          className="btn-mapa"
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end + ' Ouro Preto MG')}`, '_blank')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-6 8-12a8 8 0 0 0-16 0c0 6 8 12 8 12z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </button>
        <button className="btn-avaliar" onClick={() => irPara('avaliar')}>
          Avaliar este lugar
        </button>
      </div>
    </div>
  )
}
