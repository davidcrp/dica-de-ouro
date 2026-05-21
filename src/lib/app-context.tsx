'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Tela, Loja, Evento, LugarCultural } from './types'

interface AppState {
  tela: Tela
  telaAnterior: Tela | null
  lojaAtual: Loja | null
  eventoAtual: Evento | null
  lugarAtual: LugarCultural & { categoria?: string } | null
  lojaAvaliando: { id: number; nome: string } | null
  todasLojas: Loja[]
}

interface AppContextType extends AppState {
  irPara: (tela: Tela) => void
  voltarPara: (tela: Tela) => void
  setLojaAtual: (loja: Loja) => void
  setEventoAtual: (evento: Evento) => void
  setLugarAtual: (lugar: LugarCultural & { categoria?: string }) => void
  setLojaAvaliando: (info: { id: number; nome: string }) => void
  setTodasLojas: (lojas: Loja[]) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    tela: 'splash',
    telaAnterior: null,
    lojaAtual: null,
    eventoAtual: null,
    lugarAtual: null,
    lojaAvaliando: null,
    todasLojas: [],
  })

  const irPara = useCallback((tela: Tela) => {
    setState(s => ({ ...s, tela, telaAnterior: s.tela }))
  }, [])

  const voltarPara = useCallback((tela: Tela) => {
    setState(s => ({ ...s, tela, telaAnterior: s.tela }))
  }, [])

  const setLojaAtual = useCallback((loja: Loja) => {
    setState(s => ({ ...s, lojaAtual: loja }))
  }, [])

  const setEventoAtual = useCallback((evento: Evento) => {
    setState(s => ({ ...s, eventoAtual: evento }))
  }, [])

  const setLugarAtual = useCallback((lugar: LugarCultural & { categoria?: string }) => {
    setState(s => ({ ...s, lugarAtual: lugar }))
  }, [])

  const setLojaAvaliando = useCallback((info: { id: number; nome: string }) => {
    setState(s => ({ ...s, lojaAvaliando: info }))
  }, [])

  const setTodasLojas = useCallback((lojas: Loja[]) => {
    setState(s => ({ ...s, todasLojas: lojas }))
  }, [])

  return (
    <AppContext.Provider value={{
      ...state, irPara, voltarPara,
      setLojaAtual, setEventoAtual, setLugarAtual,
      setLojaAvaliando, setTodasLojas,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp fora do AppProvider')
  return ctx
}
