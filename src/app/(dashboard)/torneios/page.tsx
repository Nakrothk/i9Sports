import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TorneiosClient } from './torneios-client'

export default async function TorneiosPage() {
  await requireAuth()
  const torneiosRaw = await prisma.torneio.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      categorias: true,
      _count: { select: { inscricoes: true } },
    },
  })
  const torneios = torneiosRaw.map((t) => ({
    ...t,
    valor: t.valor ? Number(t.valor) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    data: t.data ? t.data.toISOString() : null,
  }))
  return <TorneiosClient torneiosIniciais={torneios} />
}
