import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const comanda = await prisma.comanda.findUnique({
    where: { id },
    include: { itens: true },
  })
  if (!comanda) return Response.json({ error: 'Comanda não encontrada' }, { status: 404 })
  if (comanda.status === 'FECHADA') {
    return Response.json({ error: 'Comanda já está fechada' }, { status: 400 })
  }
  if (comanda.itens.length === 0) {
    return Response.json({ error: 'Comanda não pode ser fechada sem itens' }, { status: 400 })
  }

  const updated = await prisma.comanda.update({
    where: { id },
    data: { status: 'FECHADA' },
    include: { itens: { include: { produto: true } } },
  })
  return Response.json(updated)
}
