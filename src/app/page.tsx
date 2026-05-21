'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { AppProvider, useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import TelaSplash from '@/components/TelaSplash'
import TelaHome from '@/components/TelaHome'
import TelaDetalhe from '@/components/TelaDetalhe'
import TelaAvaliar from '@/components/TelaAvaliar'
import TelaAgenda from '@/components/TelaAgenda'
import TelaEvento from '@/components/TelaEvento'
import TelaLugar from '@/components/TelaLugar'
import TelaExplorar from '@/components/TelaExplorar'
import TelaLogin from '@/components/TelaLogin'
import TelaCadastro from '@/components/TelaCadastro'
import TelaPainel from '@/components/TelaPainel'
import TelaPagamento from '@/components/TelaPagamento'
import TelaAdmin from '@/components/TelaAdmin'
import TelaChat from '@/components/TelaChat'
import TabBar from '@/components/TabBar'

function App() {
  const { tela, irPara } = useApp()
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !user) return
    const pendente = localStorage.getItem('dica_cadastro_pendente')
    if (pendente) {
      localStorage.removeItem('dica_cadastro_pendente')
      const { tipo, nome, cat, sub, end, tel } = JSON.parse(pendente)
      const uid = user.id
      if (tipo === 'loja') {
        const catFinal = sub ? `${cat} · ${sub}` : cat
        supabase.from('lojas').insert({ NOME: nome, CATEGORIA: catFinal, 'ENDEREÇO': end || null, TELEFONE: tel || null, lojista_id: uid, ATUALIZADO_EM: new Date().toISOString() })
      } else if (tipo === 'republica') {
        supabase.from('republicas').insert({ nome, endereco: end || null, telefone: tel || null, lojista_id: uid })
      } else {
        supabase.from('ufop_conteudo').insert({ titulo: nome, subcategoria: cat || null, ativo: true })
      }
    }
    if (tela === 'splash' || tela === 'login' || tela === 'cadastro') {
      irPara('painel')
    }
  }, [isLoaded, isSignedIn, user, tela, irPara])

  return (
    <>
      <TelaSplash ativo={tela === 'splash'} />
      <TelaHome ativo={tela === 'home'} />
      <TelaDetalhe ativo={tela === 'detalhe'} />
      <TelaAvaliar ativo={tela === 'avaliar'} />
      <TelaAgenda ativo={tela === 'agenda'} />
      <TelaEvento ativo={tela === 'evento'} />
      <TelaLugar ativo={tela === 'lugar'} />
      <TelaExplorar ativo={tela === 'explorar'} />
      <TelaLogin ativo={tela === 'login'} />
      <TelaCadastro ativo={tela === 'cadastro'} />
      <TelaPainel ativo={tela === 'painel'} />
      <TelaPagamento ativo={tela === 'pagamento'} />
      <TelaAdmin ativo={tela === 'admin'} />
      <TelaChat ativo={tela === 'chat'} />
      <TabBar />
    </>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}
