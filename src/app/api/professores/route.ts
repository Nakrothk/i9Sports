import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const professores = await prisma.professor.findMany({
    where: { ativo: true },
    include: { aulas: { include: { quadra: true }, orderBy: [{ diaSemana: 'asc' }, { horario: 'asc' }] } },
    orderBy: { nome: 'asc' },
  })
  return Response.json(professores)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, categoria } = await request.json()
  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const professor = await prisma.professor.create({
    data: { nome: nome.trim(), categoria: categoria?.trim() || 'Beach Tennis' },
    include: { aulas: { include: { quadra: true } } },
  })
  return Response.json(professor, { status: 201 })
}
