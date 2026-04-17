import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const comanda = await prisma.comanda.findUnique({
    where: { id },
    include: { itens: { include: { produto: true } }, cliente: true },
  })
  if (!comanda) return Response.json({ error: 'Comanda não encontrada' }, { status: 404 })
  return Response.json(comanda)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { nomeCliente, observacoes, clienteId } = await request.json()

  const comanda = await prisma.comanda.update({
    where: { id },
    data: { nomeCliente, observacoes, clienteId: clienteId ?? undefined },
    include: { itens: { include: { produto: true } }, cliente: true },
  })
  return Response.json(comanda)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.comanda.delete({ where: { id } })
  return Response.json({ ok: true })
}
