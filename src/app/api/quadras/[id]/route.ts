import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { nome } = await request.json()
  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const quadra = await prisma.quadra.update({ where: { id }, data: { nome: nome.trim() } })
  return Response.json(quadra)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.quadra.update({ where: { id }, data: { ativa: false } })
  return Response.json({ ok: true })
}
