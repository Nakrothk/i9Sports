import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

async function recalcTotal(comandaId: string) {
  const itens = await prisma.itemComanda.findMany({ where: { comandaId } })
  const total = itens.reduce((acc: number, item: { precoUnit: unknown; quantidade: number }) =>
    acc + Number(item.precoUnit) * item.quantidade, 0)
  await prisma.comanda.update({ where: { id: comandaId }, data: { total } })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: comandaId } = await params
  const body = await request.json()

  // Aceita tanto array de itens quanto item único (retrocompatível)
  const itens: { produtoId: string; quantidade: number }[] = Array.isArray(body.itens)
    ? body.itens
    : [{ produtoId: body.produtoId, quantidade: body.quantidade }]

  if (!itens.length) return Response.json({ error: 'Nenhum item enviado' }, { status: 400 })

  const comanda = await prisma.comanda.findUnique({ where: { id: comandaId } })
  if (!comanda) return Response.json({ error: 'Comanda não encontrada' }, { status: 404 })
  if (comanda.status === 'FECHADA') return Response.json({ error: 'Comanda já fechada' }, { status: 400 })

  for (const { produtoId, quantidade } of itens) {
    if (!produtoId || !quantidade || quantidade < 1) continue

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } })
    if (!produto) continue

    // Se o item já existe na comanda, soma a quantidade
    const existente = await prisma.itemComanda.findFirst({ where: { comandaId, produtoId } })
    if (existente) {
      await prisma.itemComanda.update({
        where: { id: existente.id },
        data: { quantidade: existente.quantidade + quantidade },
      })
    } else {
      await prisma.itemComanda.create({
        data: { comandaId, produtoId, quantidade, precoUnit: produto.preco },
      })
    }
  }

  await recalcTotal(comandaId)

  const comandaAtualizada = await prisma.comanda.findUnique({
    where: { id: comandaId },
    include: { itens: { include: { produto: true }, orderBy: { createdAt: 'asc' } } },
  })
  return Response.json(comandaAtualizada, { status: 201 })
}
