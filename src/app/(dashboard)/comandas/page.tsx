import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ComandasClient } from './comandas-client'

export default async function ComandasPage() {
  await requireAuth()

  const [comandasRaw, produtosRaw] = await Promise.all([
    prisma.comanda.findMany({
      include: { itens: { include: { produto: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ])

  const comandas = comandasRaw.map((c) => ({
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
  }))

  const produtos = produtosRaw.map((p) => ({ ...p, preco: Number(p.preco), createdAt: p.createdAt.toISOString() }))

  return <ComandasClient comandasIniciais={comandas} produtosIniciais={produtos} />
}
