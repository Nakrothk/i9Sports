import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const torneio = await prisma.torneio.findUnique({
    where: { id },
    include: {
      categorias: {
        include: { _count: { select: { inscricoes: { where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } } } } } },
        orderBy: { nome: 'asc' },
      },
    },
  })
  if (!torneio) return Response.json({ error: 'Torneio não encontrado' }, { status: 404 })

  return Response.json({
    ...torneio,
    valor: torneio.valor ? Number(torneio.valor) : null,
    categorias: torneio.categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      vagas: c.vagas,
      vagasRestantes: Math.max(0, c.vagas - c._count.inscricoes),
    })),
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneioId } = await params
  const { categoriaId, nomeJogador, telefoneJogador, nomeParceiro, telefoneParceiro } = await request.json()

  if (!categoriaId || !nomeJogador?.trim() || !nomeParceiro?.trim()) {
    return Response.json({ error: 'Categoria, nome do jogador e parceiro são obrigatórios' }, { status: 400 })
  }

  const torneio = await prisma.torneio.findUnique({ where: { id: torneioId } })
  if (!torneio) return Response.json({ error: 'Torneio não encontrado' }, { status: 404 })
  if (torneio.status === 'ENCERRADO') return Response.json({ error: 'Inscrições encerradas' }, { status: 400 })

  const categoria = await prisma.categoriaTorneio.findUnique({
    where: { id: categoriaId },
    include: { _count: { select: { inscricoes: { where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } } } } } },
  })
  if (!categoria) return Response.json({ error: 'Categoria não encontrada' }, { status: 404 })
  if (categoria._count.inscricoes >= categoria.vagas) {
    return Response.json({ error: 'Não há vagas disponíveis nesta categoria' }, { status: 400 })
  }

  // Cria inscrição
  const inscricao = await prisma.inscricaoTorneio.create({
    data: {
      torneioId,
      categoriaId,
      nomeJogador: nomeJogador.trim(),
      telefoneJogador: telefoneJogador?.trim() || null,
      nomeParceiro: nomeParceiro.trim(),
      telefoneParceiro: telefoneParceiro?.trim() || null,
    },
  })

  // Cria cobrança PIX na OpenPix (só se tiver valor e APP_ID configurado)
  const appId = process.env.OPENPIX_APP_ID
  const valor = torneio.valor ? Number(torneio.valor) : null

  if (appId && valor) {
    try {
      const correlationID = `inscricao-${inscricao.id}`
      const chargeRes = await fetch('https://api.openpix.com.br/api/v1/charge', {
        method: 'POST',
        headers: {
          Authorization: appId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correlationID,
          value: Math.round(valor * 100), // centavos
          comment: `Inscrição - ${torneio.nome} - ${categoria.nome}`,
          expiresIn: 3600 * 24 * 3, // 3 dias
        }),
      })

      if (chargeRes.ok) {
        const { charge } = await chargeRes.json()
        await prisma.inscricaoTorneio.update({
          where: { id: inscricao.id },
          data: {
            pixCorrelationId: correlationID,
            pixBrCode: charge.brCode ?? null,
            pixQrCodeUrl: charge.qrCodeImage ?? null,
          },
        })
        return Response.json({
          ...inscricao,
          pixBrCode: charge.brCode ?? null,
          pixQrCodeUrl: charge.qrCodeImage ?? null,
        }, { status: 201 })
      }
    } catch {
      // Se a OpenPix falhar, inscrição continua criada — confirmação será manual
    }
  }

  return Response.json(inscricao, { status: 201 })
}
