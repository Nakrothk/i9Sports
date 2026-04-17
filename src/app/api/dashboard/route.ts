import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const agora = new Date()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0)
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 0, 0)

  const [reservasHoje, comandasAbertas, faturamentoHoje] = await Promise.all([
    prisma.reserva.count({
      where: { data: { gte: hoje, lt: amanha } },
    }),
    prisma.comanda.count({
      where: { status: 'ABERTA' },
    }),
    prisma.comanda.aggregate({
      where: {
        status: 'FECHADA',
        updatedAt: { gte: hoje, lt: amanha },
      },
      _sum: { total: true },
    }),
  ])

  return Response.json({
    reservasHoje,
    comandasAbertas,
    faturamentoHoje: Number(faturamentoHoje._sum.total ?? 0),
  })
}
