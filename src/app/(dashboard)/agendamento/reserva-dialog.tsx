'use client'

import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { RefreshCw, GraduationCap, User, Search } from 'lucide-react'

type Quadra = { id: string; nome: string }
type Prof = { id: string; nome: string }
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
}

const HORARIOS = Array.from({ length: 14 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quadras: Quadra[]
  professores: Prof[]
  reserva: Reserva | null
  slotInicial: { quadraId: string; horario: string } | null
  data: string
  onSaved: () => void
}

export function ReservaDialog({ open, onOpenChange, quadras, professores, reserva, slotInicial, data, onSaved }: Props) {
  const [tipo, setTipo] = useState<'reserva' | 'aula'>('reserva')

  // Campos de reserva
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [quadraId, setQuadraId] = useState('')
  const [horario, setHorario] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [recorrente, setRecorrente] = useState(false)
  const [semanas, setSemanas] = useState(4)

  // Campos de aula
  const [professorId, setProfessorId] = useState('')

  const [saving, setSaving] = useState(false)

  // Busca de cliente existente
  const [clienteQuery, setClienteQuery] = useState('')
  const [clientesSugestoes, setClientesSugestoes] = useState<{ id: string; nome: string; telefone: string | null }[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [sugestoesOpen, setSugestoesOpen] = useState(false)
  const buscaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) setSugestoesOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const buscarClientes = async (q: string) => {
    setClienteQuery(q)
    if (!q.trim()) { setClientesSugestoes([]); setSugestoesOpen(false); return }
    setBuscandoCliente(true)
    setSugestoesOpen(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      if (res.ok) setClientesSugestoes(await res.json())
    } finally { setBuscandoCliente(false) }
  }

  const selecionarCliente = (c: { nome: string; telefone: string | null }) => {
    setNomeCliente(c.nome)
    setTelefone(c.telefone ?? '')
    setClienteQuery('')
    setClientesSugestoes([])
    setSugestoesOpen(false)
  }

  useEffect(() => {
    setTipo('reserva')
    setProfessorId(professores[0]?.id ?? '')
    setClienteQuery('')
    setClientesSugestoes([])
    setSugestoesOpen(false)
    if (reserva) {
      setNomeCliente(reserva.nomeCliente)
      setTelefone(reserva.telefone ?? '')
      setQuadraId(reserva.quadraId)
      setHorario(reserva.horario)
      setObservacoes(reserva.observacoes ?? '')
      setRecorrente(false)
      setSemanas(4)
    } else if (slotInicial) {
      setNomeCliente('')
      setTelefone('')
      setQuadraId(slotInicial.quadraId)
      setHorario(slotInicial.horario)
      setObservacoes('')
      setRecorrente(false)
      setSemanas(4)
    } else {
      setNomeCliente('')
      setTelefone('')
      setQuadraId(quadras[0]?.id ?? '')
      setHorario(HORARIOS[0])
      setObservacoes('')
      setRecorrente(false)
      setSemanas(4)
    }
  }, [reserva, slotInicial, quadras, professores, open])

  const handleSave = async () => {
    if (tipo === 'aula') {
      if (!professorId || !quadraId || !horario) {
        toast.error('Selecione professor, quadra e horário')
        return
      }
      setSaving(true)
      try {
        // Calcula o dia da semana a partir da data atual do agendamento
        const [ano, mes, dia] = data.split('-').map(Number)
        const diaSemana = new Date(ano, mes - 1, dia).getDay()

        const res = await fetch(`/api/professores/${professorId}/aulas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quadraId, diaSemana, horario }),
        })
        const json = await res.json()
        if (!res.ok) { toast.error(json.error ?? 'Erro ao agendar aula'); return }
        toast.success('Aula agendada!')
        onSaved()
      } catch { toast.error('Erro de conexão') }
      finally { setSaving(false) }
      return
    }

    // Reserva normal
    if (!nomeCliente.trim() || !quadraId || !horario) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    if (!telefone.trim()) {
      toast.error('Telefone é obrigatório')
      return
    }
    setSaving(true)
    try {
      const url = reserva ? `/api/reservas/${reserva.id}` : '/api/reservas'
      const method = reserva ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCliente, telefone, quadraId, data, horario, observacoes, recorrente, semanas }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao salvar'); return }

      if (!reserva && recorrente) {
        const { criadas, conflitos } = json as { criadas: unknown[]; conflitos: string[] }
        toast.success(`${criadas.length} reserva(s) criada(s)!`)
        if (conflitos.length > 0) {
          toast.warning(`${conflitos.length} semana(s) com conflito ignorada(s): ${conflitos.join(', ')}`)
        }
      } else {
        toast.success(reserva ? 'Reserva atualizada!' : 'Reserva criada!')
      }
      onSaved()
    } catch { toast.error('Erro de conexão') }
    finally { setSaving(false) }
  }

  const isEdicao = !!reserva

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdicao ? 'Editar Reserva' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>

        {/* Toggle Reserva / Aula — só na criação e se tiver professores */}
        {!isEdicao && professores.length > 0 && (
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setTipo('reserva')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                tipo === 'reserva'
                  ? 'bg-green-600 text-white'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <User size={15} />
              Reserva
            </button>
            <button
              onClick={() => setTipo('aula')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                tipo === 'aula'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <GraduationCap size={15} />
              Aula
            </button>
          </div>
        )}

        <div className="space-y-4">
          {tipo === 'aula' ? (
            /* Campos de aula */
            <>
              <div className="space-y-1.5">
                <Label>Professor *</Label>
                <select
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quadra *</Label>
                  <Select value={quadraId} onValueChange={(v) => setQuadraId(v ?? '')}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {quadras.map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Horário *</Label>
                  <Select value={horario} onValueChange={(v) => setHorario(v ?? '')}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {HORARIOS.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                A aula será agendada toda semana neste dia e horário.
              </p>
            </>
          ) : (
            /* Campos de reserva */
            <>
              {/* Busca de cliente cadastrado */}
              <div className="space-y-1.5" ref={buscaRef}>
                <Label className="flex items-center gap-1.5 text-muted-foreground">
                  <Search size={13} /> Buscar cliente cadastrado
                </Label>
                <div className="relative">
                  <Input
                    value={clienteQuery}
                    onChange={(e) => buscarClientes(e.target.value)}
                    onFocus={() => clienteQuery.trim() && setSugestoesOpen(true)}
                    placeholder="Digite nome ou telefone..."
                    className="h-11"
                    autoFocus
                  />
                  {sugestoesOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {buscandoCliente ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Buscando...</p>
                      ) : clientesSugestoes.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Nenhum cliente encontrado</p>
                      ) : (
                        clientesSugestoes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => selecionarCliente(c)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted flex items-center justify-between gap-2"
                          >
                            <span className="font-medium">{c.nome}</span>
                            {c.telefone && <span className="text-xs text-muted-foreground shrink-0">{c.telefone}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Nome do Cliente *</Label>
                <Input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Nome completo" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone *</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quadra *</Label>
                  <Select value={quadraId} onValueChange={(v) => setQuadraId(v ?? '')}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {quadras.map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Horário *</Label>
                  <Select value={horario} onValueChange={(v) => setHorario(v ?? '')}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {HORARIOS.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reserva recorrente */}
              {!isEdicao && (
                <div className={`rounded-lg border p-3 space-y-3 transition-colors ${recorrente ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : ''}`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={recorrente}
                      onChange={(e) => setRecorrente(e.target.checked)}
                      className="w-4 h-4 accent-green-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <RefreshCw size={15} className={recorrente ? 'text-green-600' : 'text-muted-foreground'} />
                      <span className={`text-sm font-medium ${recorrente ? 'text-green-700 dark:text-green-400' : ''}`}>
                        Reserva mensal (repetir semanalmente)
                      </span>
                    </div>
                  </label>
                  {recorrente && (
                    <div className="flex items-center gap-3 pl-7">
                      <Label className="text-sm whitespace-nowrap">Repetir por</Label>
                      <Input
                        type="number"
                        value={semanas}
                        onChange={(e) => setSemanas(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                        min={1} max={12}
                        className="h-9 w-20 text-center"
                      />
                      <span className="text-sm text-muted-foreground">semana(s)</span>
                    </div>
                  )}
                </div>
              )}

              {reserva?.recorrente && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg px-3 py-2">
                  <RefreshCw size={14} />
                  Esta é uma reserva recorrente mensal
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações opcionais..." rows={2} />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className={tipo === 'aula' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {saving
              ? 'Salvando...'
              : tipo === 'aula'
              ? 'Agendar Aula'
              : recorrente
              ? `Criar ${semanas} reservas`
              : isEdicao
              ? 'Salvar'
              : 'Criar Reserva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
