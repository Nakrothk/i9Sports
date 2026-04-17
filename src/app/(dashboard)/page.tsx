import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, ClipboardList, Clock } from 'lucide-react'
import { FaturamentoCard } from './faturamento-card'
import { DashboardNav } from './dashboard-nav'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getDashboardData(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const inicio = new Date(ano, mes - 1, dia, 0, 0, 0, 0)
  const fim = new Date(ano, mes - 1, dia, 23, 59, 59, 999)

  const isHoje = data === format(new Date(), 'yyyy-MM-dd')

  const [reservasDia, comandasAbertas, faturamento, comandasDia] = await Promise.all([
    prisma.reserva.count({ where: { data: { gte: inicio, lte: fim } } }),
    isHoje ? prisma.comanda.count({ where: { status: 'ABERTA' } }) : Promise.resolve(null),
    prisma.comanda.aggregate({
      where: { status: 'FECHADA', updatedAt: { gte: inicio, lte: fim } },
      _sum: { total: true },
    }),
    isHoje
      ? prisma.comanda.findMany({
          where: { status: 'ABERTA' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { itens: true },
        })
      : prisma.comanda.findMany({
          where: { status: 'FECHADA', updatedAt: { gte: inicio, lte: fim } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: { itens: true },
        }),
  ])

  return {
    reservasDia,
    comandasAbertas: comandasAbertas as number | null,
    faturamentoDia: Number(faturamento._sum.total ?? 0),
    comandasDia,
    isHoje,
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>
}) {
  await requireAuth()

  const { data: dataParam } = await searchParams
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const dataSelecionada = dataParam ?? hoje

  const { reservasDia, comandasAbertas, faturamentoDia, comandasDia, isHoje } =
    await getDashboardData(dataSelecionada)

  const dataFormatada = format(parseISO(dataSelecionada), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header com navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground capitalize">{dataFormatada}</p>
        </div>
        <DashboardNav dataSelecionada={dataSelecionada} hoje={hoje} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays size={16} />
              Reservas {isHoje ? 'Hoje' : 'no Dia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{reservasDia}</p>
          </CardContent>
        </Card>

        {isHoje ? (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList size={16} />
                Comandas Abertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{comandasAbertas}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList size={16} />
                Comandas Fechadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{comandasDia.length}</p>
            </CardContent>
          </Card>
        )}

        <FaturamentoCard valor={faturamentoDia} label={isHoje ? 'Faturamento Hoje' : 'Faturamento do Dia'} />
      </div>

      {/* Ações rápidas — só no dia atual */}
      {isHoje && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/agendamento">
              <Button variant="outline" className="w-full h-16 text-sm flex-col gap-1">
                <CalendarDays size={20} />
                Nova Reserva
              </Button>
            </Link>
            <Link href="/comandas">
              <Button variant="outline" className="w-full h-16 text-sm flex-col gap-1">
                <ClipboardList size={20} />
                Abrir Comanda
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Comandas do dia */}
      {comandasDia.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {isHoje ? 'Comandas em Aberto' : 'Comandas Fechadas no Dia'}
          </h2>
          <div className="space-y-2">
            {comandasDia.map((c) => (
              <Link key={c.id} href={`/comandas/${c.id}`}>
                <div className="bg-card border rounded-lg p-4 flex items-center justify-between hover:border-green-300 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">{c.nomeCliente}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {format(c.createdAt, "HH:mm", { locale: ptBR })} • {c.itens.length} iten(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {Number(c.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
