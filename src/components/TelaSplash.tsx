'use client'

import { useApp } from '@/lib/app-context'

export default function TelaSplash({ ativo }: { ativo: boolean }) {
  const { irPara } = useApp()

  return (
    <div
      id="tela-splash"
      className={`tela escura${ativo ? '' : ' oculta'}`}
    >
      <img
        className="splash-base"
        src="https://dica-de-ouro.github.io/dica-de-ouro/imagembase.png?v=1"
        alt="Ouro Preto"
      />
      <div className="splash-content">
        <img
          src="https://dica-de-ouro.github.io/dica-de-ouro/logo.png?v=2"
          alt="Dica de Ouro"
          style={{ width: '88%', maxWidth: 360, marginBottom: 40, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.7))' }}
        />
        <button
          className="btn-primario"
          onClick={() => irPara('home')}
        >
          Explorar Ouro Preto
        </button>
      </div>
      <div className="splash-rodape">Ouro Preto · Minas Gerais</div>
    </div>
  )
}
