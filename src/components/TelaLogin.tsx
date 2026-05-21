'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useApp } from '@/lib/app-context'

export default function TelaLogin({ ativo }: { ativo: boolean }) {
  const { irPara, voltarPara } = useApp()
  const { signIn, fetchStatus } = useSignIn()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const loginGoogle = async () => {
    if (!signIn) { setErro('Auth não carregado. Tente novamente.'); return }
    setErro('')
    try {
      const { error } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectCallbackUrl: `${window.location.origin}/`,
      })
      if (error) setErro(error.longMessage || error.message || 'Erro ao conectar com Google.')
    } catch (e: unknown) {
      const err = e as { message?: string }
      setErro(err.message || 'Erro inesperado.')
    }
  }

  const login = async () => {
    if (!signIn) return
    setErro('')
    if (!email || !senha) { setErro('Preencha email e senha.'); return }
    setCarregando(true)
    try {
      const { error } = await signIn.create({ identifier: email, password: senha })
      if (error) {
        setErro(error.longMessage || error.message || 'Email ou senha incorretos.')
        return
      }
      if (signIn.status === 'complete') {
        await signIn.finalize()
        irPara('painel')
      } else {
        setErro('Autenticação incompleta. Verifique seu email.')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setErro(err.message || 'Erro inesperado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div id="tela-login" className={`tela escura${ativo ? '' : ' oculta'}`}>
      <div className="login-content">
        <div style={{ height: 'calc(var(--safe-top) + 20px)' }} />
        <div className="login-eyebrow">Área do lojista</div>
        <h2 className="login-titulo">Entrar no <em>Dica de Ouro</em></h2>
        <p className="login-sub">Gerencie sua loja e mantenha as informações frescas.</p>
        <div className="campo-grupo">
          <label>Email</label>
          <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="campo-grupo">
          <label>Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
        </div>
        <div id="clerk-captcha" />
        <button className="btn-login" onClick={login} disabled={carregando || fetchStatus === 'fetching'}>
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
        <button className="btn-google" onClick={loginGoogle} disabled={fetchStatus === 'fetching'}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8, flexShrink: 0 }}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Entrar com Google
        </button>
        <div className="login-erro">{erro}</div>
        <div className="login-voltar" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button onClick={() => irPara('cadastro')} style={{ color: 'var(--gold-bright)', opacity: 1, borderBottomColor: 'var(--gold-bright)' }}>
            Não tenho conta — cadastrar
          </button>
          <button onClick={() => voltarPara('home')}>← Voltar para o app</button>
        </div>
      </div>
    </div>
  )
}
