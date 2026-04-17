import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const torneios = await prisma.torneio.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      categorias: true,
      _count: { select: { inscricoes: true } },
    },
  })
  return Response.json(torneios.map((t) => ({
    ...t,
    valor: t.valor ? Number(t.valor) : null,
  })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, descricao, data, local, valor, pixChave, pixTipo } = await request.json()
  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const torneio = await prisma.torneio.create({
    data: {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      data: data ? new Date(data) : null,
      local: local?.trim() || null,
      valor: valor != null && valor !== '' ? valor : null,
      pixChave: pixChave?.trim() || null,
      pixTipo: pixTipo?.trim() || null,
    },
    include: { categorias: true, _count: { select: { inscricoes: true } } },
  })
  return Response.json({ ...torneio, valor: torneio.valor ? Number(torneio.valor) : null }, { status: 201 })
}
