import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })
  return Response.json(produtos)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, preco, categoria } = await request.json()
  if (!nome?.trim() || preco == null) {
    return Response.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })
  }

  const produto = await prisma.produto.create({ data: { nome: nome.trim(), preco, categoria: categoria || null } })
  return Response.json(produto, { status: 201 })
}
