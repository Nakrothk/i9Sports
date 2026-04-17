import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ inscId: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { inscId } = await params
  const { status } = await request.json()
  if (!['PENDENTE', 'CONFIRMADA', 'CANCELADA'].includes(status)) {
    return Response.json({ error: 'Status inválido' }, { status: 400 })
  }

  const inscricao = await prisma.inscricaoTorneio.update({
    where: { id: inscId },
    data: { status },
    include: { categoria: true },
  })
  return Response.json(inscricao)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ inscId: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { inscId } = await params
  await prisma.inscricaoTorneio.delete({ where: { id: inscId } })
  return new Response(null, { status: 204 })
}
