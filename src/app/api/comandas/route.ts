import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')

  const comandas = await prisma.comanda.findMany({
    where: status ? { status: status as 'ABERTA' | 'FECHADA' } : undefined,
    include: {
      itens: { include: { produto: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(comandas)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { nomeCliente, telefone, clienteId, observacoes } = await request.json()
  if (!nomeCliente?.trim()) {
    return Response.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 })
  }
  if (!telefone?.trim()) {
    return Response.json({ error: 'Telefone é obrigatório' }, { status: 400 })
  }

  const comanda = await prisma.comanda.create({
    data: { nomeCliente: nomeCliente.trim(), telefone: telefone.trim(), clienteId: clienteId || null, observacoes },
    include: { itens: { include: { produto: true } } },
  })
  return Response.json(comanda, { status: 201 })
}
