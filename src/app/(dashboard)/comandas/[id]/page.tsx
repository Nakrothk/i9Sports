import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ComandaDetailClient } from './comanda-detail-client'

export default async function ComandaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const [comandaRaw, produtosRaw] = await Promise.all([
    prisma.comanda.findUnique({
      where: { id },
      include: { itens: { include: { produto: true }, orderBy: { createdAt: 'asc' } }, cliente: true },
    }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ])

  if (!comandaRaw) notFound()

  const comanda = {
    ...comandaRaw,
    total: Number(comandaRaw.total),
    createdAt: comandaRaw.createdAt.toISOString(),
    updatedAt: comandaRaw.updatedAt.toISOString(),
    cliente: comandaRaw.cliente
      ? { ...comandaRaw.cliente, createdAt: comandaRaw.cliente.createdAt.toISOString(), updatedAt: comandaRaw.cliente.updatedAt.toISOString() }
      : null,
    itens: comandaRaw.itens.map((i) => ({
      ...i,
      precoUnit: Number(i.precoUnit),
      createdAt: i.createdAt.toISOString(),
      produto: { ...i.produto, preco: Number(i.produto.preco), createdAt: i.produto.createdAt.toISOString() },
    })),
  }

  const produtos = produtosRaw.map((p) => ({ ...p, preco: Number(p.preco), createdAt: p.createdAt.toISOString() }))

  return <ComandaDetailClient comanda={comanda} produtos={produtos} />
}
