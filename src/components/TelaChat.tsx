'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/lib/app-context'

interface Msg { role: 'user' | 'assistant'; text: string }

export default function TelaChat({ ativo }: { ativo: boolean }) {
  const { voltarPara } = useApp()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const enviar = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    const history = msgs.map(m => ({ role: m.role, content: m.text }))
    history.push({ role: 'user', content: q })

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    })

    if (!res.body) { setLoading(false); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let texto = ''
    setMsgs(prev => [...prev, { role: 'assistant', text: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      texto += decoder.decode(value, { stream: true })
      setMsgs(prev => {
        const copia = [...prev]
        copia[copia.length - 1] = { role: 'assistant', text: texto }
        return copia
      })
    }
    setLoading(false)
  }

  return (
    <div id="tela-chat" className={`tela${ativo ? '' : ' oculta'}`}>
      <div style={{ padding: 'calc(var(--safe-top) + 14px) 22px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 13 }}>
        <button
          className="btn-redondo"
          style={{ background: 'var(--cal-warm)', color: 'var(--ink)', border: '1px solid var(--line)' }}
          onClick={() => voltarPara('home')}
        >←</button>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: '1rem' }}>Assistente Dica de Ouro</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', opacity: 0.55 }}>Powered by Claude</div>
        </div>
      </div>

      <div className="chat-messages">
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.5 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: '1.2rem', marginBottom: 8 }}>Olá, viajante!</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem' }}>
              Pergunte sobre restaurantes, pontos turísticos, eventos ou qualquer coisa sobre Ouro Preto.
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'user' ? 'usuario' : 'ia'}`}>
            {m.text || (loading && m.role === 'assistant' ? '…' : '')}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Onde jantar hoje em Ouro Preto?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
        />
        <button className="chat-send" onClick={enviar} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
