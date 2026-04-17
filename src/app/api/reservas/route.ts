import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const data = searchParams.get('data')

  const where = data ? { data: new Date(data) } : {}

  const reservas = await prisma.reserva.findMany({
    where,
    include: { quadra: true },
    orderBy: [{ data: 'asc' }, { horario: 'asc' }],
  })
  return Response.json(reservas)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { nomeCliente, telefone, quadraId, data, horario, observacoes, recorrente, semanas = 4 } = body

  if (!nomeCliente || !quadraId || !data || !horario) {
    return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  // Monta lista de datas a criar
  const [ano, mes, dia] = (data as string).split('-').map(Number)
  const datas: Date[] = []
  for (let i = 0; i < (recorrente ? semanas : 1); i++) {
    const d = new Date(ano, mes - 1, dia + i * 7, 0, 0, 0, 0)
    datas.push(d)
  }

  const grupoRecorrencia = recorrente ? randomUUID() : null

  const criadas: object[] = []
  const conflitos: string[] = []

  for (const dataDate of datas) {
    const existente = await prisma.reserva.findUnique({
      where: { quadraId_data_horario: { quadraId, data: dataDate, horario } },
    })
    if (existente) {
      conflitos.push(dataDate.toLocaleDateString('pt-BR'))
      continue
    }
    const reserva = await prisma.reserva.create({
      data: { nomeCliente, telefone, quadraId, data: dataDate, horario, observacoes, recorrente: !!recorrente, grupoRecorrencia },
      include: { quadra: true },
    })
    criadas.push(reserva)
  }

  if (criadas.length === 0) {
    return Response.json({ error: 'Todos os horários já estão ocupados' }, { status: 409 })
  }

  return Response.json({ criadas, conflitos }, { status: 201 })
}
