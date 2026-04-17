import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: professorId } = await params
  const { quadraId, diaSemana, horario } = await request.json()

  if (quadraId == null || diaSemana == null || !horario) {
    return Response.json({ error: 'Quadra, dia e horário são obrigatórios' }, { status: 400 })
  }

  const existente = await prisma.aulaProfessor.findUnique({
    where: { quadraId_diaSemana_horario: { quadraId, diaSemana, horario } },
  })
  if (existente) {
    return Response.json({ error: 'Esse horário já está ocupado nessa quadra' }, { status: 409 })
  }

  const aula = await prisma.aulaProfessor.create({
    data: { professorId, quadraId, diaSemana, horario },
    include: { quadra: true },
  })
  return Response.json(aula, { status: 201 })
}
