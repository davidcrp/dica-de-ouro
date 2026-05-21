'use client'

import { useApp } from '@/lib/app-context'

export default function TelaEvento({ ativo }: { ativo: boolean }) {
  const { eventoAtual, voltarPara } = useApp()
  if (!eventoAtual) return null

  const ev = eventoAtual
  const data = new Date(ev.data_evento + 'T12:00:00')
  const dataStr = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const partes = ev.nome.split(' ')
  const ul = partes.pop()
  const nomeHtml = partes.length ? `${partes.join(' ')} <em>${ul}</em>` : ev.nome

  const abrirMaps = () => {
    if (!ev.local) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.local + ' Ouro Preto MG')}`, '_blank')
  }
  const abrirSite = () => {
    if (!ev.link) return
    window.open(ev.link.startsWith('http') ? ev.link : 'https://' + ev.link, '_blank')
  }

  return (
    <div id="tela-evento" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="evento-hero">
        {ev.foto && <div className="evento-hero-foto" style={{ backgroundImage: `url('${ev.foto}')` }} />}
        <div className="detalhe-nav">
          <button className="btn-redondo" onClick={() => voltarPara('agenda')}>←</button>
        </div>
        <div className="evento-fundo">
          <div className="data-chip">📅 {dataStr}</div>
          <h2 dangerouslySetInnerHTML={{ __html: nomeHtml }} />
          <div className="evento-fonte">{ev.fonte || 'Dica de Ouro'}</div>
        </div>
      </div>

      <div className="evento-corpo">
        {ev.descricao && <p className="evento-desc">{ev.descricao}</p>}
        {ev.horario && (
          <div className="evento-info-row">
            <div className="ic">⏰</div>
            <div className="cnt"><div className="lbl">Horário</div><div className="val">{ev.horario}</div></div>
          </div>
        )}
        {ev.local && (
          <div className="evento-info-row">
            <div className="ic">📍</div>
            <div className="cnt"><div className="lbl">Local</div><div className="val">{ev.local}</div></div>
          </div>
        )}
        {ev.link && (
          <div className="evento-info-row">
            <div className="ic">🔗</div>
            <div className="cnt">
              <div className="lbl">Site</div>
              <div className="val" style={{ color: 'var(--gold-deep)' }}>{ev.link}</div>
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
        <button className={`btn-site${!ev.link ? ' sem-link' : ''}`} onClick={abrirSite}>
          {ev.link ? 'Ver site do evento' : 'Sem site cadastrado'}
        </button>
      </div>
    </div>
  )
}
