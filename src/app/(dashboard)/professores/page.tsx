import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfessoresClient } from './professores-client'

export default async function ProfessoresPage() {
  await requireAuth()

  const [professores, quadras] = await Promise.all([
    prisma.professor.findMany({
      where: { ativo: true },
      include: { aulas: { include: { quadra: true }, orderBy: [{ diaSemana: 'asc' }, { horario: 'asc' }] } },
      orderBy: { nome: 'asc' },
    }),
    prisma.quadra.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } }),
  ])

  return <ProfessoresClient professoresIniciais={professores} quadras={quadras} />
}
