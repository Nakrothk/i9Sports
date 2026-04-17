import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const q = searchParams.get('q')

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: 'insensitive' } },
            { telefone: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { nome: 'asc' },
    include: { _count: { select: { reservas: true, comandas: true } } },
  })
  return Response.json(clientes)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { nome, dataNascimento, email, telefone, endereco, mensalista, observacoes } = body

  if (!nome?.trim()) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const cliente = await prisma.cliente.create({
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
  return Response.json(cliente, { status: 201 })
}
