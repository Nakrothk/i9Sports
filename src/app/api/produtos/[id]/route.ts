import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { nome, preco, categoria } = await request.json()
  if (!nome?.trim() || preco == null) {
    return Response.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })
  }

  const produto = await prisma.produto.update({
    where: { id },
    data: { nome: nome.trim(), preco, categoria: categoria || null },
  })
  return Response.json(produto)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.produto.update({ where: { id }, data: { ativo: false } })
  return Response.json({ ok: true })
}
