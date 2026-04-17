import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ catId: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { catId } = await params
  const { nome, vagas } = await request.json()
  if (!nome?.trim() || !vagas || vagas < 1) {
    return Response.json({ error: 'Nome e vagas são obrigatórios' }, { status: 400 })
  }

  const categoria = await prisma.categoriaTorneio.update({
    where: { id: catId },
    data: { nome: nome.trim(), vagas: Number(vagas) },
    include: { _count: { select: { inscricoes: true } } },
  })
  return Response.json(categoria)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ catId: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { catId } = await params
  await prisma.categoriaTorneio.delete({ where: { id: catId } })
  return new Response(null, { status: 204 })
}
