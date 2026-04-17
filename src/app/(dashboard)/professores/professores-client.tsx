'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, GraduationCap, Clock, X } from 'lucide-react'
import { toast } from 'sonner'

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const HORARIOS = Array.from({ length: 14 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`)
const CATEGORIAS = ['Beach Tennis', 'Futvolei', 'Vôlei']

const CATEGORIA_COLORS: Record<string, string> = {
  'Beach Tennis': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  'Futvolei':     'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  'Vôlei':        'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
}
const categoriaColor = (c: string) => CATEGORIA_COLORS[c] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'

type Quadra = { id: string; nome: string }
type Aula = { id: string; diaSemana: number; horario: string; quadraId: string; quadra: Quadra }
type Professor = { id: string; nome: string; categoria: string; aulas: Aula[] }

type Props = { professoresIniciais: Professor[]; quadras: Quadra[] }

export function ProfessoresClient({ professoresIniciais, quadras }: Props) {
  const [professores, setProfessores] = useState<Professor[]>(professoresIniciais)

  // Dialog novo/editar professor
  const [profDialogOpen, setProfDialogOpen] = useState(false)
  const [editandoProf, setEditandoProf] = useState<Professor | null>(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [savingProf, setSavingProf] = useState(false)

  // Dialog de horários do professor
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false)
  const [profSelecionado, setProfSelecionado] = useState<Professor | null>(null)
  const [novaQuadraId, setNovaQuadraId] = useState('')
  const [novoDia, setNovoDia] = useState<string>('')
  const [novoHorario, setNovoHorario] = useState('')
  const [savingAula, setSavingAula] = useState(false)

  const reload = async () => {
    const res = await fetch('/api/professores')
    if (res.ok) {
      const data = await res.json()
      setProfessores(data)
      // Atualiza o professor selecionado no dialog de horários
      if (profSelecionado) {
        const atualizado = data.find((p: Professor) => p.id === profSelecionado.id)
        if (atualizado) setProfSelecionado(atualizado)
      }
    }
  }

  const openCreate = () => {
    setEditandoProf(null)
    setNome('')
    setCategoria(CATEGORIAS[0])
    setProfDialogOpen(true)
  }

  const openEdit = (p: Professor) => {
    setEditandoProf(p)
    setNome(p.nome)
    setCategoria(p.categoria)
    setProfDialogOpen(true)
  }

  const openHorarios = (p: Professor) => {
    setProfSelecionado(p)
    setNovaQuadraId(quadras[0]?.id ?? '')
    setNovoDia('1')
    setNovoHorario(HORARIOS[0])
    setHorarioDialogOpen(true)
  }

  const handleSaveProf = async () => {
    if (!nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSavingProf(true)
    try {
      const url = editandoProf ? `/api/professores/${editandoProf.id}` : '/api/professores'
      const method = editandoProf ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, categoria }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success(editandoProf ? 'Professor atualizado!' : 'Professor cadastrado!')
      setProfDialogOpen(false)
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setSavingProf(false) }
  }

  const handleDeleteProf = async (id: string) => {
    try {
      const res = await fetch(`/api/professores/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Erro ao excluir professor'); return }
      toast.success('Professor excluído')
      await reload()
    } catch { toast.error('Erro de conexão') }
  }

  const handleAddAula = async () => {
    if (!profSelecionado || !novaQuadraId || novoDia === '' || !novoHorario) {
      toast.error('Preencha todos os campos')
      return
    }
    setSavingAula(true)
    try {
      const res = await fetch(`/api/professores/${profSelecionado.id}/aulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quadraId: novaQuadraId, diaSemana: parseInt(novoDia), horario: novoHorario }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao adicionar horário'); return }
      toast.success('Horário adicionado!')
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setSavingAula(false) }
  }

  const handleDeleteAula = async (aulaId: string) => {
    try {
      const res = await fetch(`/api/aulas/${aulaId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Erro ao remover horário'); return }
      toast.success('Horário removido')
      await reload()
    } catch { toast.error('Erro de conexão') }
  }

  // Aulas agrupadas por dia da semana para o dialog
  const aulasPorDia = profSelecionado
    ? DIAS_SEMANA.map((dia, idx) => ({
        dia,
        idx,
        aulas: profSelecionado.aulas.filter((a) => a.diaSemana === idx),
      })).filter((g) => g.aulas.length > 0)
    : []

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Professores</h1>
          <p className="text-sm text-muted-foreground">{professores.length} cadastrado(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus size={16} className="mr-1" />
          Novo Professor
        </Button>
      </div>

      {professores.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="mx-auto w-12 h-12 text-muted-foreground/40 mb-3" />
          <p>Nenhum professor cadastrado</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>Cadastrar professor</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {professores.map((p) => (
            <div key={p.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm shrink-0">
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{p.nome}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${categoriaColor(p.categoria)}`}>
                        {p.categoria}
                      </span>
                    </div>
                  </div>

                  {p.aulas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.aulas.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                          <Clock size={10} />
                          {DIAS_SEMANA[a.diaSemana]} {a.horario} · {a.quadra.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40" onClick={() => openHorarios(p)}>
                    <Clock size={14} className="mr-1" />
                    Horários
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil size={15} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </Button>
                    }></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir professor?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os horários de <strong>{p.nome}</strong> serão removidos do agendamento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteProf(p.id)} className="bg-red-600 hover:bg-red-700">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog novo/editar professor */}
      <Dialog open={profDialogOpen} onOpenChange={setProfDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editandoProf ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do professor" className="h-11" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProf} disabled={savingProf} className="bg-green-600 hover:bg-green-700">
              {savingProf ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de horários */}
      <Dialog open={horarioDialogOpen} onOpenChange={setHorarioDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                {profSelecionado?.nome.charAt(0).toUpperCase()}
              </div>
              Horários — {profSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          {/* Adicionar novo horário */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium">Adicionar horário</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Dia</Label>
                <select
                  value={novoDia}
                  onChange={(e) => setNovoDia(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {DIAS_SEMANA.map((d, i) => (
                    <option key={i} value={String(i)}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horário</Label>
                <select
                  value={novoHorario}
                  onChange={(e) => setNovoHorario(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {HORARIOS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quadra</Label>
                <select
                  value={novaQuadraId}
                  onChange={(e) => setNovaQuadraId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {quadras.map((q) => (
                    <option key={q.id} value={q.id}>{q.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleAddAula} disabled={savingAula} size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus size={14} className="mr-1" />
              {savingAula ? 'Adicionando...' : 'Adicionar horário'}
            </Button>
          </div>

          {/* Horários cadastrados */}
          {profSelecionado?.aulas.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhum horário cadastrado</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {aulasPorDia.map(({ dia, aulas }) => (
                <div key={dia}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{dia}</p>
                  <div className="space-y-1">
                    {aulas.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                        <span className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <Clock size={13} />
                          {a.horario} · {a.quadra.nome}
                        </span>
                        <button
                          onClick={() => handleDeleteAula(a.id)}
                          className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHorarioDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
