import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const quadras = await prisma.quadra.findMany({
    where: { ativa: true },
    orderBy: { nome: 'asc' },
  })
  return Response.json(quadras)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome } = await request.json()
  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const quadra = await prisma.quadra.create({ data: { nome: nome.trim() } })
  return Response.json(quadra, { status: 201 })
}
