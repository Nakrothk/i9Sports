'use client'

import { useState, useCallback } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ReservaDialog } from './reserva-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type Quadra = { id: string; nome: string; ativa: boolean; coberta: boolean }
type Reserva = {
  id: string
  nomeCliente: string
  telefone: string | null
  quadraId: string
  data: string
  horario: string
  observacoes: string | null
  recorrente: boolean
  grupoRecorrencia: string | null
  quadra: Quadra
}
const CATEGORIA_TAG: Record<string, string> = {
  'Beach Tennis': 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
  'Futvolei':     'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
  'Vôlei':        'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
}

type AulaProf = {
  id: string
  horario: string
  quadraId: string
  diaSemana: number
  professor: { id: string; nome: string; categoria: string }
  quadra: Quadra
}

const HORARIOS = Array.from({ length: 14 }, (_, i) => {
  const h = 9 + i
  return `${String(h).padStart(2, '0')}:00`
})

type Prof = { id: string; nome: string; categoria: string }

type Props = {
  quadrasIniciais: Quadra[]
  reservasIniciais: Reserva[]
  aulasIniciais: AulaProf[]
  professoresIniciais: Prof[]
  dataInicial: string
}

export function AgendamentoClient({ quadrasIniciais, reservasIniciais, aulasIniciais, professoresIniciais, dataInicial }: Props) {
  const [data, setData] = useState(dataInicial)
  const [reservas, setReservas] = useState<Reserva[]>(reservasIniciais)
  const [aulas, setAulas] = useState<AulaProf[]>(aulasIniciais)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Reserva | null>(null)
  const [slotSelecionado, setSlotSelecionado] = useState<{ quadraId: string; horario: string } | null>(null)

  // Estado para o dialog de cancelamento de recorrente
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reservaParaCancelar, setReservaParaCancelar] = useState<Reserva | null>(null)

  const loadReservas = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const [resReservas, resAulas] = await Promise.all([
        fetch(`/api/reservas?data=${d}`),
        fetch(`/api/aulas-do-dia?data=${d}`),
      ])
      if (resReservas.ok) setReservas(await resReservas.json())
      if (resAulas.ok) setAulas(await resAulas.json())
    } catch {
      toast.error('Erro ao carregar reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  const mudarData = (dias: number) => {
    const novaData = format(
      dias > 0 ? addDays(parseISO(data), dias) : subDays(parseISO(data), Math.abs(dias)),
      'yyyy-MM-dd'
    )
    setData(novaData)
    loadReservas(novaData)
  }

  const getReserva = (quadraId: string, horario: string) =>
    reservas.find((r) => r.quadraId === quadraId && r.horario === horario)

  const getAula = (quadraId: string, horario: string) =>
    aulas.find((a) => a.quadraId === quadraId && a.horario === horario)

  const handleCellClick = (quadraId: string, horario: string) => {
    if (getAula(quadraId, horario)) return // bloqueia células de aula
    const reserva = getReserva(quadraId, horario)
    if (reserva) {
      setEditando(reserva)
      setSlotSelecionado(null)
    } else {
      setSlotSelecionado({ quadraId, horario })
      setEditando(null)
    }
    setDialogOpen(true)
  }

  const iniciarCancelamento = (e: React.MouseEvent, reserva: Reserva) => {
    e.stopPropagation()
    if (reserva.recorrente && reserva.grupoRecorrencia) {
      setReservaParaCancelar(reserva)
      setCancelDialogOpen(true)
    } else {
      handleDelete(reserva.id, false)
    }
  }

  const handleDelete = async (id: string, todos: boolean) => {
    setCancelDialogOpen(false)
    try {
      const url = todos ? `/api/reservas/${id}?todos=true` : `/api/reservas/${id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(todos ? 'Reservas futuras canceladas' : 'Reserva cancelada')
      loadReservas(data)
    } catch {
      toast.error('Erro ao cancelar reserva')
    }
  }

  const handleSaved = () => {
    setDialogOpen(false)
    loadReservas(data)
  }

  const dataFormatada = format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-4 md:p-6 max-w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Agendamento</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => mudarData(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <div className="text-center min-w-40">
            <p className="text-sm font-medium capitalize">{dataFormatada}</p>
            <input
              type="date"
              value={data}
              onChange={(e) => { setData(e.target.value); loadReservas(e.target.value) }}
              className="text-xs text-muted-foreground border-0 bg-transparent cursor-pointer"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => mudarData(1)}>
            <ChevronRight size={16} />
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => { setEditando(null); setSlotSelecionado(null); setDialogOpen(true) }}
          >
            <Plus size={16} className="mr-1" />
            Nova
          </Button>
        </div>
      </div>

      {/* Grade */}
      <ScrollArea className="w-full">
        <div className="min-w-[600px]">
          {/* Header da grade */}
          <div
            className="grid gap-0 border rounded-t-lg overflow-hidden"
            style={{ gridTemplateColumns: `80px repeat(${quadrasIniciais.length}, 1fr)` }}
          >
            <div className="bg-muted/50 p-2 border-r text-xs font-medium text-center">Horário</div>
            {quadrasIniciais.map((q) => (
              <div key={q.id} className="bg-muted/50 p-2 border-r last:border-r-0 text-xs font-semibold text-center">
                <p>{q.nome}</p>
                {q.coberta && (
                  <span className="inline-block mt-0.5 text-[10px] font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded-full">
                    coberta
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Linhas de horário */}
          <div className="border border-t-0 rounded-b-lg overflow-hidden">
            {HORARIOS.map((horario, idx) => (
              <div
                key={horario}
                className="grid gap-0"
                style={{ gridTemplateColumns: `80px repeat(${quadrasIniciais.length}, 1fr)` }}
              >
                <div className="bg-muted/30 p-2 border-r border-b text-xs font-medium text-center text-muted-foreground">
                  {horario}
                </div>
                {quadrasIniciais.map((q) => {
                  const reserva = getReserva(q.id, horario)
                  const aula = getAula(q.id, horario)
                  const isAula = !!aula
                  const isRecorrente = reserva?.recorrente

                  return (
                    <div
                      key={q.id}
                      onClick={() => handleCellClick(q.id, horario)}
                      className={`border-r border-b last:border-r-0 p-1.5 min-h-[52px] transition-colors ${
                        isAula
                          ? 'bg-blue-50 dark:bg-blue-950/40 cursor-default'
                          : isRecorrente
                          ? 'bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 cursor-pointer'
                          : reserva
                          ? 'bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer'
                          : 'bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer'
                      }`}
                    >
                      {isAula ? (
                        <div className="flex items-center gap-1 h-full">
                          <div className="w-1 self-stretch bg-blue-400 dark:bg-blue-500 rounded-full shrink-0" />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-semibold truncate text-blue-800 dark:text-blue-300">
                              {aula.professor.nome}
                            </p>
                            <span className={`inline-block text-[9px] font-semibold px-1.5 py-0 rounded-full leading-4 ${CATEGORIA_TAG[aula.professor.categoria] ?? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'}`}>
                              {aula.professor.categoria}
                            </span>
                          </div>
                        </div>
                      ) : reserva ? (
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className={`text-xs font-semibold truncate ${isRecorrente ? 'text-yellow-800 dark:text-yellow-300' : 'text-green-800 dark:text-green-300'}`}>
                                {reserva.nomeCliente}
                              </p>
                              {isRecorrente && (
                                <RefreshCw size={9} className="text-yellow-600 dark:text-yellow-400 shrink-0" title="Mensal" />
                              )}
                            </div>
                            {reserva.telefone && (
                              <p className={`text-xs truncate ${isRecorrente ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-700 dark:text-green-400'}`}>
                                {reserva.telefone}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditando(reserva); setDialogOpen(true) }}
                              className={`p-0.5 rounded ${isRecorrente ? 'hover:bg-yellow-200 dark:hover:bg-yellow-800' : 'hover:bg-green-200 dark:hover:bg-green-800'}`}
                            >
                              <Pencil size={10} className={isRecorrente ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'} />
                            </button>
                            <button
                              onClick={(e) => iniciarCancelamento(e, reserva)}
                              className={`p-0.5 rounded ${isRecorrente ? 'hover:bg-yellow-200 dark:hover:bg-yellow-800' : 'hover:bg-green-200 dark:hover:bg-green-800'}`}
                            >
                              <Trash2 size={10} className={isRecorrente ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100">
                          <Plus size={14} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white dark:bg-zinc-900 border border-gray-300 rounded" />
          Livre
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          Ocupado
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
          Mensal
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
          Aula professor
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block text-[10px] font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded-full">coberta</span>
          Quadra coberta
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-lg">Carregando...</div>
        </div>
      )}

      <ReservaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quadras={quadrasIniciais}
        professores={professoresIniciais}
        reserva={editando}
        slotInicial={slotSelecionado}
        data={data}
        onSaved={handleSaved}
      />

      {/* Dialog de cancelamento de recorrente */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar reserva recorrente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{reservaParaCancelar?.nomeCliente}</strong> tem reservas semanais. O que deseja cancelar?
          </p>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => reservaParaCancelar && handleDelete(reservaParaCancelar.id, false)}
            >
              Cancelar apenas esta semana
            </Button>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => reservaParaCancelar && handleDelete(reservaParaCancelar.id, true)}
            >
              Cancelar esta e todas as futuras
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
