import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: torneioId } = await params
  const { nome, vagas } = await request.json()
  if (!nome?.trim() || !vagas || vagas < 1) {
    return Response.json({ error: 'Nome e vagas são obrigatórios' }, { status: 400 })
  }

  const categoria = await prisma.categoriaTorneio.create({
    data: { torneioId, nome: nome.trim(), vagas: Number(vagas) },
    include: { _count: { select: { inscricoes: true } } },
  })
  return Response.json(categoria, { status: 201 })
}
