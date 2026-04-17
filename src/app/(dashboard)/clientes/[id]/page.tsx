import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ClienteDetailClient } from './cliente-detail-client'

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      reservas: {
        include: { quadra: true },
        orderBy: { data: 'desc' },
        take: 50,
      },
      comandas: {
        include: { itens: { include: { produto: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!cliente) notFound()

  const serialized = {
    ...cliente,
    dataNascimento: cliente.dataNascimento ? cliente.dataNascimento.toISOString().split('T')[0] : null,
    createdAt: cliente.createdAt.toISOString(),
    updatedAt: cliente.updatedAt.toISOString(),
    reservas: cliente.reservas.map((r) => ({
      ...r,
      data: r.data.toISOString().split('T')[0],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    comandas: cliente.comandas.map((c) => ({
      ...c,
      total: Number(c.total),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      itens: c.itens.map((i) => ({
        ...i,
        precoUnit: Number(i.precoUnit),
        createdAt: i.createdAt.toISOString(),
        produto: { ...i.produto, preco: Number(i.produto.preco), createdAt: i.produto.createdAt.toISOString() },
      })),
    })),
  }

  return <ClienteDetailClient cliente={serialized} />
}
