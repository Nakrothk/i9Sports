import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientesClient } from './clientes-client'

export default async function ClientesPage() {
  await requireAuth()

  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { reservas: true, comandas: true } },
    },
  })

  const serialized = clientes.map((c) => ({
    ...c,
    dataNascimento: c.dataNascimento ? c.dataNascimento.toISOString().split('T')[0] : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return <ClientesClient clientesIniciais={serialized} />
}
