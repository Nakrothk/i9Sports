import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

function serializeTorneio(t: {
  valor: { toNumber: () => number } | null
  categorias: Array<{ inscricoes: unknown[] }>
  inscricoes: Array<{ precoUnit?: unknown; categoria?: unknown }>
  [key: string]: unknown
}) {
  return {
    ...t,
    valor: t.valor ? Number(t.valor) : null,
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

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
  if (!torneio) return Response.json({ error: 'Não encontrado' }, { status: 404 })
  return Response.json({ ...torneio, valor: torneio.valor ? Number(torneio.valor) : null })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { nome, descricao, data, local, valor, pixChave, pixTipo, status } = await request.json()
  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const torneio = await prisma.torneio.update({
    where: { id },
    data: {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      data: data ? new Date(data) : null,
      local: local?.trim() || null,
      valor: valor != null && valor !== '' ? valor : null,
      pixChave: pixChave?.trim() || null,
      pixTipo: pixTipo?.trim() || null,
      status: status ?? undefined,
    },
  })
  return Response.json({ ...torneio, valor: torneio.valor ? Number(torneio.valor) : null })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.torneio.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
