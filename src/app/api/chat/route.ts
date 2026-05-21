import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const { messages } = await req.json()

  const { data: lojas } = await supa
    .from('lojas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const ctx = (lojas || []).map((l: Record<string, string>) =>
    `- ${l.NOME || l.nome} (${l.CATEGORIA || l.categoria}) — ${l['ENDEREÇO'] || l.endereco}${l.HORARIO || l.horario ? ` · ${l.HORARIO || l.horario}` : ''}${l['DESCRIÇÃO'] || l.descricao ? ` · "${l['DESCRIÇÃO'] || l.descricao}"` : ''}`
  ).join('\n')

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `Você é o assistente do Dica de Ouro, guia local de Ouro Preto (MG). Responda em português, de forma calorosa e concisa. Baseie suas respostas nos dados abaixo quando relevante.

LOJAS E LOCAIS CADASTRADOS:
${ctx}

Se o usuário perguntar sobre um local não listado, diga que não tem informação atualizada e sugira verificar pessoalmente.`,
    messages,
    maxOutputTokens: 800,
  })

  return result.toTextStreamResponse()
}
