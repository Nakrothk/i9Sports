import { requireAuth } from '@/lib/auth'
import { AgendamentoClient } from './agendamento-client'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export default async function AgendamentoPage() {
  await requireAuth()

  const hoje = format(new Date(), 'yyyy-MM-dd')
  const [ano, mes, dia] = hoje.split('-').map(Number)
  const diaSemana = new Date(ano, mes - 1, dia).getDay()

  const [quadras, reservasRaw, aulasIniciais, professores] = await Promise.all([
    prisma.quadra.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } }),
    prisma.reserva.findMany({ where: { data: new Date(hoje) }, include: { quadra: true } }),
    prisma.aulaProfessor.findMany({ where: { diaSemana }, include: { professor: true, quadra: true } }),
    prisma.professor.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ])

  const reservas = reservasRaw.map((r) => ({ ...r, data: format(r.data, 'yyyy-MM-dd') }))

  return (
    <AgendamentoClient
      quadrasIniciais={quadras}
      reservasIniciais={reservas}
      aulasIniciais={aulasIniciais}
      professoresIniciais={professores}
      dataInicial={hoje}
    />
  )
}
