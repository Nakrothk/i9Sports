import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// OpenPix envia este evento quando o pagamento é confirmado
export async function POST(request: NextRequest) {
  const body = await request.json()

  // OpenPix manda um ping na primeira configuração — ignorar
  if (body.event === 'OPENPIX:CHARGE_CREATED' || !body.event) {
    return Response.json({ ok: true })
  }

  if (body.event !== 'OPENPIX:CHARGE_COMPLETED') {
    return Response.json({ ok: true })
  }

  const correlationID = body.charge?.correlationID as string | undefined
  if (!correlationID?.startsWith('inscricao-')) {
    return Response.json({ ok: true })
  }

  await prisma.inscricaoTorneio.updateMany({
    where: { pixCorrelationId: correlationID, status: 'PENDENTE' },
    data: { status: 'CONFIRMADA' },
  })

  return Response.json({ ok: true })
}
