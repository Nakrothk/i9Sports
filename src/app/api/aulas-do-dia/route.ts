import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const data = request.nextUrl.searchParams.get('data')
  if (!data) return Response.json({ error: 'Data obrigatória' }, { status: 400 })

  const [ano, mes, dia] = data.split('-').map(Number)
  const diaSemana = new Date(ano, mes - 1, dia).getDay()

  const aulas = await prisma.aulaProfessor.findMany({
    where: { diaSemana },
    include: { professor: true, quadra: true },
  })
  return Response.json(aulas)
}
