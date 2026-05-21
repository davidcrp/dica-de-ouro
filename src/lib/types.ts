export interface Loja {
  id: number
  NOME?: string
  nome?: string
  CATEGORIA?: string
  categoria?: string
  'ENDEREÇO'?: string
  endereco?: string
  DESCRIÇÃO?: string
  descricao?: string
  TELEFONE?: string
  telefone?: string
  HORARIO?: string
  horario?: string
  SITE?: string
  site?: string
  FOTO?: string
  foto?: string
  ATUALIZADO_EM?: string
  atualizado_em?: string
  ACESSOS?: number
  acessos?: number
  lojista_id?: string
  lat?: number
  lng?: number
}

export interface Evento {
  id: string
  nome: string
  descricao?: string
  data_evento: string
  horario?: string
  local?: string
  link?: string
  foto?: string
  fonte?: string
  ativo?: boolean
}

export interface LugarCultural {
  id: string
  nome: string
  descricao?: string
  endereco?: string
  site?: string
  horario_funcionamento?: string
  foto?: string
  lat?: number
  lng?: number
}

export interface Avaliacao {
  id: string
  loja_id: number
  nome_avaliador?: string
  nota_geral?: number
  nota_produto?: number
  nota_servico?: number
  nota_estrutura?: number
  comentario?: string
  created_at: string
}

export interface Favorito {
  id: number
  nome: string
  cat: string
  end: string
  foto?: string | null
}

export interface Republica {
  id: number
  nome: string
  descricao?: string
  endereco?: string
  telefone?: string
  site?: string
  foto?: string
  created_at?: string
  lojista_id?: string
}

export interface UfopConteudo {
  id: number
  titulo: string
  descricao?: string
  subcategoria?: string
  foto?: string
  link?: string
  data_encerramento?: string
  ativo?: boolean
  created_at?: string
}

export type Tela =
  | 'splash'
  | 'home'
  | 'detalhe'
  | 'avaliar'
  | 'agenda'
  | 'explorar'
  | 'evento'
  | 'lugar'
  | 'login'
  | 'cadastro'
  | 'painel'
  | 'chat'
  | 'pagamento'
  | 'admin'
