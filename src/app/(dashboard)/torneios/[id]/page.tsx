import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TorneioDetailClient } from './torneio-detail-client'

export default async function TorneioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    include: {
      categorias: {
        include: { _count: { select: { inscricoes: true } } },
        orderBy: { nome: 'asc' },
      },
      inscricoes: {
        include: { categoria: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!torneio) notFound()

  const data = {
    ...torneio,
    valor: torneio.valor ? Number(torneio.valor) : null,
    data: torneio.data ? torneio.data.toISOString() : null,
    createdAt: torneio.createdAt.toISOString(),
    updatedAt: torneio.updatedAt.toISOString(),
    inscricoes: torneio.inscricoes.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  }

  return <TorneioDetailClient torneio={data} />
}
