'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'

const PIX_KEY = 'dicadeouro@pix.banco.com.br'

export default function TelaPagamento({ ativo }: { ativo: boolean }) {
  const { irPara } = useApp()
  const [copiado, setCopiado] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  const copiarPix = () => {
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  const confirmar = () => {
    setConfirmado(true)
    setTimeout(() => irPara('painel'), 2000)
  }

  return (
    <div id="tela-pagamento" className={`tela escura${ativo ? '' : ' oculta'}`}>
      <div className="pag-content">
        <div style={{ height: 'calc(var(--safe-top) + 20px)' }} />
        <div className="pag-eyebrow">Pagamento</div>
        <h2 className="pag-titulo">Plano <em>Premium</em></h2>
        <p className="pag-sub">Mantenha seu estabelecimento visível por 30 dias.</p>

        <div className="pag-card">
          <div className="pag-card-title">Valor total</div>
          <div className="pag-valor">R$ 49<small>,90</small></div>
          <div className="pag-info-row">
            <span className="lbl">Período</span>
            <span className="val">30 dias</span>
          </div>
          <div className="pag-info-row">
            <span className="lbl">Renovação</span>
            <span className="val">Manual</span>
          </div>
        </div>

        <div className="pag-card">
          <div className="pag-card-title">Chave PIX</div>
          <div className="pag-chave-pix" onClick={copiarPix}>{PIX_KEY}</div>
          <button className="btn-copiar" onClick={copiarPix}>
            {copiado ? '✓ Copiado!' : '📋 Copiar chave'}
          </button>
        </div>

        <div className="pag-card">
          <div className="pag-card-title">Como funciona</div>
          <p className="pag-instr"><strong>1. Copie a chave PIX</strong> acima.</p>
          <p className="pag-instr"><strong>2. Abra seu banco</strong> e faça a transferência PIX.</p>
          <p className="pag-instr"><strong>3. Cole a chave</strong> e envie R$ 49,90.</p>
          <p className="pag-instr"><strong>4. Confirme aqui</strong> quando o pagamento for feito.</p>
        </div>

        {confirmado
          ? <div style={{ textAlign: 'center', color: '#9dd49d', padding: '16px 0', fontSize: '0.9rem' }}>✓ Recebemos sua confirmação! Em breve ativaremos seu plano.</div>
          : <button className="btn-pag-pronto" onClick={confirmar}>✓ Já transferi — confirmar pagamento</button>
        }

        <button
          onClick={() => irPara('painel')}
          style={{ width: '100%', padding: 13, background: 'transparent', color: 'var(--cal)', border: '1px solid #ffffff20', borderRadius: 13, fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', cursor: 'pointer', marginTop: 10, opacity: 0.55 }}
        >
          ← Voltar ao painel
        </button>
      </div>
    </div>
  )
}
