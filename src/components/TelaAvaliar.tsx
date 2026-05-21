'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'

const StarInput = ({
  label, hint, onChange
}: { label: string; hint: string; onChange: (v: number) => void }) => {
  const [val, setVal] = useState(0)
  const set = (n: number) => { setVal(n); onChange(n) }
  return (
    <div className="aval-bloco">
      <div className="lbl-row">
        <div><h4>{label}</h4><div className="hint">{hint}</div></div>
        <div className="valor">{val || '—'}<span>/5</span></div>
      </div>
      <div className="estrelas-input">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            className={val >= i ? 'acesa' : ''}
            onClick={() => set(i)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={val >= i ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l2.4 7h7l-5.7 4.2 2.2 7L12 16l-5.9 4.2 2.2-7L2.4 9h7z"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TelaAvaliar({ ativo }: { ativo: boolean }) {
  const { lojaAvaliando, voltarPara } = useApp()
  const [nome, setNome] = useState('')
  const [produto, setProduto] = useState(0)
  const [servico, setServico] = useState(0)
  const [estrutura, setEstrutura] = useState(0)
  const [comentario, setComentario] = useState('')
  const [msg, setMsg] = useState('')

  const enviar = async () => {
    if (!lojaAvaliando) return
    if (!produto || !servico || !estrutura) {
      setMsg('Avalie produto, serviço e estrutura.')
      return
    }
    const nota_geral = ((produto + servico + estrutura) / 3)
    const { error } = await supabase.from('avaliacoes').insert({
      loja_id: lojaAvaliando.id,
      nome_avaliador: nome || 'Anônimo',
      nota_produto: produto,
      nota_servico: servico,
      nota_estrutura: estrutura,
      nota_geral,
      comentario: comentario || null,
    })
    if (error) { setMsg('Erro ao enviar. Tente novamente.'); return }
    setMsg('Avaliação enviada! Obrigado.')
    setTimeout(() => voltarPara('detalhe'), 1500)
  }

  return (
    <div id="tela-avaliar" className={`tela${ativo ? '' : ' oculta'}`}>
      <div className="aval-header">
        <button className="btn-redondo" onClick={() => voltarPara('detalhe')}>←</button>
        <div>
          <h2>{lojaAvaliando?.nome || '—'}</h2>
          <div className="sub">Sua impressão importa</div>
        </div>
      </div>
      <div className="aval-corpo">
        <div className="aval-intro">
          Nota separada para produto, serviço e estrutura. Outros viajantes leem antes de cruzar a praça.
        </div>

        <div className="aval-bloco">
          <div className="lbl-row"><div><h4>Seu nome</h4><div className="hint">Para identificar sua avaliação.</div></div></div>
          <input
            type="text"
            placeholder="Como você se chama?"
            value={nome}
            onChange={e => setNome(e.target.value)}
            style={{ width: '100%', padding: '13px 15px', background: 'var(--cal)', border: '1px solid var(--line)', borderRadius: 13, fontFamily: "'Inter',sans-serif", fontSize: '0.88rem', color: 'var(--ink)', outline: 'none' }}
          />
        </div>

        <StarInput label="Produto" hint="A comida, a bebida, o que comprou." onChange={setProduto} />
        <StarInput label="Serviço" hint="Atenção, simpatia, tempo de espera." onChange={setServico} />
        <StarInput label="Estrutura" hint="Espaço, limpeza, conforto, acesso." onChange={setEstrutura} />

        <div className="aval-bloco">
          <h4 style={{ marginBottom: 12 }}>Conte algo a quem chegar amanhã</h4>
          <textarea
            className="caixa-comentario"
            placeholder="O tutu veio sequinho, o garçom soube indicar a melhor cachaça…"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
          />
        </div>

        <button className="btn-enviar" onClick={enviar}>Enviar avaliação</button>
        <div className="salvo-msg">{msg}</div>
      </div>
    </div>
  )
}
