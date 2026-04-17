import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { nomeCliente, telefone, quadraId, data, horario, observacoes } = body

  if (!nomeCliente || !quadraId || !data || !horario) {
    return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const dataDate = new Date(data)

  const existente = await prisma.reserva.findUnique({
    where: { quadraId_data_horario: { quadraId, data: dataDate, horario } },
  })
  if (existente && existente.id !== id) {
    return Response.json({ error: 'Horário já ocupado nessa quadra' }, { status: 409 })
  }

  const reserva = await prisma.reserva.update({
    where: { id },
    data: { nomeCliente, telefone, quadraId, data: dataDate, horario, observacoes },
    include: { quadra: true },
  })
  return Response.json(reserva)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const todos = request.nextUrl.searchParams.get('todos') === 'true'

  if (todos) {
    const reserva = await prisma.reserva.findUnique({ where: { id } })
    if (reserva?.grupoRecorrencia) {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      await prisma.reserva.deleteMany({
        where: { grupoRecorrencia: reserva.grupoRecorrencia, data: { gte: hoje } },
      })
      return Response.json({ ok: true })
    }
  }

  await prisma.reserva.delete({ where: { id } })
  return Response.json({ ok: true })
}
