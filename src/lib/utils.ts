import type { Loja } from './types'

export function tempoAtras(d: string | null | undefined): string {
  if (!d) return 'sem data'
  const m = (Date.now() - new Date(d).getTime()) / 60000
  if (m < 60) return `Há ${Math.floor(m)}min`
  if (m < 1440) return `Há ${Math.floor(m / 60)}h`
  const dias = Math.floor(m / 1440)
  return `Há ${dias} dia${dias > 1 ? 's' : ''}`
}

export function corDot(d: string | null | undefined): 'verde' | 'warn' | 'stale' {
  if (!d) return 'stale'
  const h = (Date.now() - new Date(d).getTime()) / 3600000
  return h < 12 ? 'verde' : h < 48 ? 'warn' : 'stale'
}

export function nomeLoja(loja: Loja): string {
  return loja['NOME'] || loja.nome || '—'
}

export function catLoja(loja: Loja): string {
  return loja['CATEGORIA'] || loja.categoria || 'Local'
}

export function endLoja(loja: Loja): string {
  return loja['ENDEREÇO'] || loja.endereco || ''
}

export function fotoLoja(loja: Loja): string {
  return loja['FOTO'] || loja.foto || ''
}

export function atualizadoLoja(loja: Loja): string | null {
  return loja['ATUALIZADO_EM'] || loja.atualizado_em || null
}

export function nomeComItalico(nome: string): { antes: string; ultima: string } {
  const partes = nome.split(' ')
  const ultima = partes.pop() || ''
  return { antes: partes.join(' '), ultima }
}

export function getFavoritos(): import('./types').Favorito[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('dica_favoritos') || '[]')
  } catch {
    return []
  }
}

export function setFavoritos(favs: import('./types').Favorito[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('dica_favoritos', JSON.stringify(favs))
}
