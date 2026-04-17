import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProdutosClient } from './produtos-client'

export default async function ProdutosPage() {
  await requireAuth()
  const produtosRaw = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })
  const produtos = produtosRaw.map((p) => ({ ...p, preco: Number(p.preco), createdAt: p.createdAt.toISOString() }))
  return <ProdutosClient produtosIniciais={produtos} />
}
