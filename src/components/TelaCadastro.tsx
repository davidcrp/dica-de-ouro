'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'

const CATS = ['Comer', 'Beber', 'Hospedar', 'Visitar', 'Comprar', 'Serviços', 'Saúde']
const UFOP_SUBCATS = [
  { key: 'laboratorios', label: 'Laboratórios' },
  { key: 'extensao', label: 'Extensão' },
  { key: 'vagas', label: 'Vagas' },
  { key: 'iniciacao', label: 'Iniciação Científica' },
  { key: 'estagio', label: 'Estágio' },
  { key: 'pos_graduacao', label: 'Pós-graduação' },
  { key: 'concursos', label: 'Concursos' },
]

type TipoConta = 'loja' | 'republica' | 'ufop'
type Etapa = 'form' | 'verificar'

export default function TelaCadastro({ ativo }: { ativo: boolean }) {
  const { irPara } = useApp()
  const { signUp, fetchStatus } = useSignUp()
  const [etapa, setEtapa] = useState<Etapa>('form')
  const [tipo, setTipo] = useState<TipoConta>('loja')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [cat, setCat] = useState('')
  const [sub, setSub] = useState('')
  const [end, setEnd] = useState('')
  const [tel, setTel] = useState('')
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const inserirRegistro = async (uid: string) => {
    if (tipo === 'loja') {
      const catFinal = sub ? `${cat} · ${sub}` : cat
      await supabase.from('lojas').insert({
        NOME: nome, CATEGORIA: catFinal,
        'ENDEREÇO': end || null, TELEFONE: tel || null,
        lojista_id: uid, ATUALIZADO_EM: new Date().toISOString(),
      })
    } else if (tipo === 'republica') {
      await supabase.from('republicas').insert({
        nome, endereco: end || null, telefone: tel || null,
        lojista_id: uid,
      })
    } else {
      await supabase.from('ufop_conteudo').insert({
        titulo: nome, subcategoria: cat || null, ativo: true,
      })
    }
  }

  const cadastrarGoogle = async () => {
    if (!signUp) { setErro('Auth não carregado. Tente novamente.'); return }
    if (!nome) { setErro('Preencha o nome antes de continuar com Google.'); return }
    if (tipo === 'loja' && !cat) { setErro('Selecione uma categoria antes de continuar com Google.'); return }
    setErro('')
    localStorage.setItem('dica_cadastro_pendente', JSON.stringify({ tipo, nome, cat, sub, end, tel }))
    try {
      const { error } = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectCallbackUrl: `${window.location.origin}/`,
      })
      if (error) {
        localStorage.removeItem('dica_cadastro_pendente')
        setErro(error.longMessage || error.message || 'Erro ao conectar com Google.')
      }
    } catch (e: unknown) {
      localStorage.removeItem('dica_cadastro_pendente')
      const err = e as { message?: string }
      setErro(err.message || 'Erro inesperado.')
    }
  }

  const cadastrar = async () => {
    if (!signUp) return
    setErro('')
    if (!email || !senha || !nome) { setErro('Preencha todos os campos obrigatórios.'); return }
    if (tipo === 'loja' && !cat) { setErro('Selecione uma categoria.'); return }
    setCarregando(true)
    try {
      const { error } = await signUp.create({ emailAddress: email, password: senha })
      if (error) { setErro(error.longMessage || error.message || 'Erro ao criar conta.'); return }

      if (signUp.status === 'complete') {
        if (signUp.createdUserId) await inserirRegistro(signUp.createdUserId)
        await signUp.finalize()
        irPara('painel')
        return
      }

      if (signUp.unverifiedFields.includes('email_address')) {
        const { error: sendErr } = await signUp.verifications.sendEmailCode()
        if (sendErr) { setErro(sendErr.longMessage || sendErr.message || 'Erro ao enviar código.'); return }
        setEtapa('verificar')
      } else {
        setErro('Etapa de verificação desconhecida.')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setErro(err.message || 'Erro inesperado.')
    } finally {
      setCarregando(false)
    }
  }

  const verificar = async () => {
    if (!signUp) return
    setErro('')
    if (!codigo) { setErro('Digite o código enviado por email.'); return }
    setCarregando(true)
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: codigo })
      if (error) { setErro(error.longMessage || error.message || 'Código inválido.'); return }

      if (signUp.status === 'complete') {
        if (signUp.createdUserId) await inserirRegistro(signUp.createdUserId)
        await signUp.finalize()
        irPara('painel')
      } else {
        setErro('Verificação incompleta. Tente novamente.')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setErro(err.message || 'Erro inesperado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div id="tela-cadastro" className={`tela escura${ativo ? '' : ' oculta'}`}>
      <div className="cad-content">
        <div style={{ height: 'calc(var(--safe-top) + 20px)' }} />

        {etapa === 'verificar' ? (
          <>
            <div className="cad-eyebrow">Verificar email</div>
            <h2 className="cad-titulo">Confirme seu <em>email</em></h2>
            <p className="cad-sub">Enviamos um código para <strong>{email}</strong>. Verifique sua caixa de entrada.</p>
            <div className="campo-grupo">
              <label>Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verificar()}
              />
            </div>
            <button className="btn-cadastrar" onClick={verificar} disabled={carregando || fetchStatus === 'fetching'}>
              {carregando ? 'Verificando…' : 'Verificar e entrar'}
            </button>
            <div className="cad-erro">{erro}</div>
            <div className="cad-voltar">
              <button onClick={() => { setEtapa('form'); setErro('') }}>← Voltar</button>
            </div>
          </>
        ) : (
          <>
            <div className="cad-eyebrow">Novo cadastro</div>
            <h2 className="cad-titulo">Anuncie no <em>Dica de Ouro</em></h2>
            <p className="cad-sub">Coloque seu estabelecimento no mapa de Ouro Preto.</p>

            <div className="tipo-selector">
              {(['loja', 'republica', 'ufop'] as TipoConta[]).map(t => (
                <button key={t} className={`tipo-btn${tipo === t ? ' ativo' : ''}`} onClick={() => setTipo(t)}>
                  {t === 'loja' ? '🏪 Loja' : t === 'republica' ? '🏠 República' : '🎓 UFOP'}
                </button>
              ))}
            </div>

            <div className="campo-grupo">
              <label>Email</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="campo-grupo">
              <label>Senha</label>
              <input type="password" placeholder="mínimo 8 caracteres" value={senha} onChange={e => setSenha(e.target.value)} />
            </div>
            <div className="campo-grupo">
              <label>{tipo === 'ufop' ? 'Título do conteúdo' : 'Nome do estabelecimento'}</label>
              <input
                placeholder={tipo === 'loja' ? 'Ex: Café do Largo' : tipo === 'republica' ? 'Ex: República Aurora' : 'Ex: Bolsa PIBIC'}
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
            </div>

            {tipo === 'loja' && (
              <>
                <div className="campo-grupo">
                  <label>Categoria</label>
                  <div className="cat-selector">
                    {CATS.map(c => (
                      <div key={c} className={`cat-option${cat === c ? ' selecionado' : ''}`} onClick={() => setCat(c)}>{c}</div>
                    ))}
                  </div>
                </div>
                <div className="campo-grupo">
                  <label>Detalhe (opcional)</label>
                  <input placeholder="Ex: Cachaça artesanal" value={sub} onChange={e => setSub(e.target.value)} />
                </div>
              </>
            )}

            {tipo === 'ufop' && (
              <div className="campo-grupo">
                <label>Subcategoria</label>
                <div className="cat-selector">
                  {UFOP_SUBCATS.map(s => (
                    <div key={s.key} className={`cat-option${cat === s.key ? ' selecionado' : ''}`} onClick={() => setCat(s.key)}>{s.label}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="campo-grupo">
              <label>Endereço</label>
              <input placeholder="Rua, número, bairro" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
            <div className="campo-grupo">
              <label>Telefone / WhatsApp</label>
              <input type="tel" placeholder="(31) 99999-9999" value={tel} onChange={e => setTel(e.target.value)} />
            </div>

            <div id="clerk-captcha" />
            <button className="btn-cadastrar" onClick={cadastrar} disabled={carregando || fetchStatus === 'fetching'}>
              {carregando ? 'Cadastrando…' : 'Criar conta e anunciar'}
            </button>
            <button className="btn-google" onClick={cadastrarGoogle} disabled={fetchStatus === 'fetching'}>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8, flexShrink: 0 }}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Cadastrar com Google
            </button>
            <div className="cad-erro">{erro}</div>
            <div className="cad-voltar">
              <button onClick={() => irPara('login')}>Já tenho conta — entrar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
