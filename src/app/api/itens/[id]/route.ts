import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'
async function recalcTotal(comandaId: string) {
  const itens = await prisma.itemComanda.findMany({ where: { comandaId } })
  const total = itens.reduce((acc: number, item: { precoUnit: unknown; quantidade: number }) => acc + Number(item.precoUnit) * item.quantidade, 0)
  await prisma.comanda.update({
    where: { id: comandaId },
    data: { total },
  })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const item = await prisma.itemComanda.findUnique({ where: { id } })
  if (!item) return Response.json({ error: 'Item não encontrado' }, { status: 404 })

  await prisma.itemComanda.delete({ where: { id } })
  await recalcTotal(item.comandaId)

  return Response.json({ ok: true })
}
