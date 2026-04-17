import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { InscricaoClient } from './inscricao-client'

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    include: {
      categorias: {
        include: {
          _count: { select: { inscricoes: { where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } } } } },
        },
        orderBy: { nome: 'asc' },
      },
    },
  })
  if (!torneio) notFound()

  const data = {
    id: torneio.id,
    nome: torneio.nome,
    descricao: torneio.descricao,
    data: torneio.data ? torneio.data.toISOString() : null,
    local: torneio.local,
    valor: torneio.valor ? Number(torneio.valor) : null,
    pixChave: torneio.pixChave,
    pixTipo: torneio.pixTipo,
    status: torneio.status as 'ABERTO' | 'ENCERRADO',
    categorias: torneio.categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      vagas: c.vagas,
      vagasRestantes: Math.max(0, c.vagas - c._count.inscricoes),
    })),
  }

  return <InscricaoClient torneio={data} />
}
