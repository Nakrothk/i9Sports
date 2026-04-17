import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

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

  if (!cliente) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return Response.json(cliente)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { nome, dataNascimento, email, telefone, endereco, mensalista, observacoes } = body

  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      nome: nome.trim(),
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      email: email?.trim() || null,
      telefone: telefone?.trim() || null,
      endereco: endereco?.trim() || null,
      mensalista: mensalista ?? false,
      observacoes: observacoes?.trim() || null,
    },
  })
  return Response.json(cliente)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.cliente.delete({ where: { id } })
  return Response.json({ ok: true })
}
