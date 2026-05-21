'use client'

import { useApp } from '@/lib/app-context'

const EMOJI_MAP: Record<string, string> = {
  Igrejas: '⛪', Museus: '🏛', Minas: '⛏', 'Parques e Cachoeiras': '🌿',
}

export default function TelaLugar({ ativo }: { ativo: boolean }) {
  const { lugarAtual, voltarPara } = useApp()
  if (!lugarAtual) return null

  const l = lugarAtual
  const cat = l.categoria || ''
  const emoji = EMOJI_MAP[cat] || '📍'
  const horario = l.horario_funcionamento || ''
  const end = l.endereco || ''
  const site = l.site || ''

  const partes = (l.nome || '—').split(' ')
  const ul = partes.pop()
  const nomeHtml = partes.length ? `${partes.join(' ')} <em>${ul}</em>` : (l.nome || '—')

  const abrirMaps = () => {
    if (!end) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end + ' Ouro Preto MG')}`, '_blank')
  }
  const abrirSite = () => {
    if (!site) return
    window.open(site.startsWith('http') ? site : 'https://' + site, '_blank')
  }

  return (
    <div id="tela-lugar" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="evento-hero">
        {l.foto && <div className="evento-hero-foto" style={{ backgroundImage: `url('${l.foto}')` }} />}
        <div className="detalhe-nav">
          <button className="btn-redondo" onClick={() => voltarPara('agenda')}>←</button>
        </div>
        <div className="evento-fundo">
          <div className="data-chip">{emoji} {cat}</div>
          <h2 dangerouslySetInnerHTML={{ __html: nomeHtml }} />
        </div>
      </div>

      <div className="evento-corpo">
        {l.descricao && <p className="evento-desc">{l.descricao}</p>}
        {horario && (
          <div className="evento-info-row">
            <div className="ic">🕐</div>
            <div className="cnt"><div className="lbl">Horário</div><div className="val">{horario}</div></div>
          </div>
        )}
        {end && (
          <div className="evento-info-row">
            <div className="ic">📍</div>
            <div className="cnt"><div className="lbl">Endereço</div><div className="val">{end}</div></div>
          </div>
        )}
        {site && (
          <div className="evento-info-row">
            <div className="ic">🔗</div>
            <div className="cnt">
              <div className="lbl">Site</div>
              <div className="val" style={{ color: 'var(--gold-deep)', wordBreak: 'break-all' }}>{site}</div>
            </div>
          </div>
        )}
      </div>

      <div className="cta-evento">
        <button className="btn-mapa" onClick={abrirMaps}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-6 8-12a8 8 0 0 0-16 0c0 6 8 12 8 12z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </button>
        <button className={`btn-site${!site ? ' sem-link' : ''}`} onClick={abrirSite}>
          {site ? 'Ver site oficial' : 'Sem site cadastrado'}
        </button>
      </div>
    </div>
  )
}
