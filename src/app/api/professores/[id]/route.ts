import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { nome, categoria } = await request.json()
  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const professor = await prisma.professor.update({
    where: { id },
    data: { nome: nome.trim(), categoria: categoria?.trim() || 'Beach Tennis' },
    include: { aulas: { include: { quadra: true } } },
  })
  return Response.json(professor)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.professor.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
