'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Plus, Trash2, Check, X, Link as LinkIcon, Pencil, CalendarDays, MapPin, QrCode, Users } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

type Categoria = { id: string; nome: string; vagas: number; _count: { inscricoes: number } }
type Inscricao = {
  id: string
  categoriaId: string
  categoria: { id: string; nome: string }
  nomeJogador: string
  telefoneJogador: string | null
  nomeParceiro: string
  telefoneParceiro: string | null
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA'
  createdAt: string
}
type Torneio = {
  id: string
  nome: string
  descricao: string | null
  data: string | null
  local: string | null
  valor: number | null
  pixChave: string | null
  pixTipo: string | null
  status: 'ABERTO' | 'ENCERRADO'
  categorias: Categoria[]
  inscricoes: Inscricao[]
}

const PIX_TIPOS = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave aleatória']

const STATUS_LABELS = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  CONFIRMADA: { label: 'Confirmada', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
}

type FiltroStatus = 'TODAS' | 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA'

export function TorneioDetailClient({ torneio: inicial }: { torneio: Torneio }) {
  const [torneio, setTorneio] = useState<Torneio>(inicial)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODAS')
  const [loading, setLoading] = useState(false)

  // Edit torneio dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nome: inicial.nome,
    descricao: inicial.descricao ?? '',
    data: inicial.data ? inicial.data.slice(0, 10) : '',
    local: inicial.local ?? '',
    valor: inicial.valor != null ? String(inicial.valor) : '',
    pixChave: inicial.pixChave ?? '',
    pixTipo: inicial.pixTipo ?? '',
  })

  // Add category
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', vagas: '' })
  const [addingCat, setAddingCat] = useState(false)

  const inscricoesFiltradas = useMemo(() =>
    filtroStatus === 'TODAS' ? torneio.inscricoes : torneio.inscricoes.filter((i) => i.status === filtroStatus),
    [torneio.inscricoes, filtroStatus]
  )

  const reload = async () => {
    const res = await fetch(`/api/torneios/${torneio.id}`)
    if (res.ok) setTorneio(await res.json())
  }

  const copyLink = () => {
    const url = `${window.location.origin}/inscricao/${torneio.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  const handleEditSave = async () => {
    if (!editForm.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/torneios/${torneio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          valor: editForm.valor ? parseFloat(editForm.valor.replace(',', '.')) : null,
        }),
      })
      if (!res.ok) { toast.error('Erro ao salvar'); return }
      toast.success('Torneio atualizado!')
      setEditOpen(false)
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setLoading(false) }
  }

  const toggleStatus = async (torneioStatus: 'ABERTO' | 'ENCERRADO') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/torneios/${torneio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...torneio, data: torneio.data?.slice(0, 10) ?? null, valor: torneio.valor, status: torneioStatus }),
      })
      if (!res.ok) { toast.error('Erro ao atualizar status'); return }
      toast.success(torneioStatus === 'ENCERRADO' ? 'Inscrições encerradas' : 'Inscrições reabertas')
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setLoading(false) }
  }

  const handleAddCategoria = async () => {
    if (!novaCategoria.nome.trim() || !novaCategoria.vagas) { toast.error('Nome e vagas são obrigatórios'); return }
    setAddingCat(true)
    try {
      const res = await fetch(`/api/torneios/${torneio.id}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novaCategoria.nome, vagas: Number(novaCategoria.vagas) }),
      })
      if (!res.ok) { toast.error('Erro ao adicionar categoria'); return }
      setNovaCategoria({ nome: '', vagas: '' })
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setAddingCat(false) }
  }

  const handleDeleteCategoria = async (catId: string) => {
    try {
      const res = await fetch(`/api/torneios/${torneio.id}/categorias/${catId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Não é possível excluir categoria com inscrições'); return }
      await reload()
    } catch { toast.error('Erro de conexão') }
  }

  const handleInscricaoStatus = async (inscId: string, status: 'CONFIRMADA' | 'CANCELADA') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/torneios/${torneio.id}/inscricoes/${inscId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) { toast.error('Erro ao atualizar inscrição'); return }
      toast.success(status === 'CONFIRMADA' ? 'Pagamento confirmado!' : 'Inscrição cancelada')
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setLoading(false) }
  }

  const handleDeleteInscricao = async (inscId: string) => {
    setLoading(true)
    try {
      await fetch(`/api/torneios/${torneio.id}/inscricoes/${inscId}`, { method: 'DELETE' })
      toast.success('Inscrição removida')
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setLoading(false) }
  }

  const isAberto = torneio.status === 'ABERTO'

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/torneios">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{torneio.nome}</h1>
            <Badge variant={isAberto ? 'outline' : 'secondary'}>
              {isAberto ? 'Aberto' : 'Encerrado'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground mt-1">
            {torneio.data && (
              <span className="flex items-center gap-1">
                <CalendarDays size={11} />
                {format(new Date(torneio.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            )}
            {torneio.local && <span className="flex items-center gap-1"><MapPin size={11} />{torneio.local}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-1" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStatus(isAberto ? 'ENCERRADO' : 'ABERTO')}
            disabled={loading}
          >
            {isAberto ? 'Encerrar inscrições' : 'Reabrir inscrições'}
          </Button>
        </div>
      </div>

      {/* Link público */}
      <div className="bg-muted/50 border rounded-lg p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <LinkIcon size={14} /> Link de inscrição pública
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {typeof window !== 'undefined' ? `${window.location.origin}/inscricao/${torneio.id}` : `/inscricao/${torneio.id}`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={copyLink}>Copiar</Button>
      </div>

      {/* PIX info */}
      {(torneio.pixChave || torneio.valor) && (
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm font-semibold flex items-center gap-1.5"><QrCode size={14} /> Pagamento PIX</p>
          {torneio.pixTipo && <p className="text-sm text-muted-foreground">Tipo: <span className="text-foreground">{torneio.pixTipo}</span></p>}
          {torneio.pixChave && <p className="text-sm text-muted-foreground">Chave: <span className="font-mono text-foreground">{torneio.pixChave}</span></p>}
          {torneio.valor && (
            <p className="text-sm text-muted-foreground">Valor: <span className="font-semibold text-foreground">
              {torneio.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span></p>
          )}
        </div>
      )}

      {/* Categorias */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <p className="font-semibold">Categorias ({torneio.categorias.length})</p>
        </div>
        {torneio.categorias.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma categoria. Adicione abaixo.</div>
        ) : (
          <div>
            {torneio.categorias.map((c, idx) => {
              const ocupadas = c._count.inscricoes
              const restantes = Math.max(0, c.vagas - ocupadas)
              return (
                <div key={c.id}>
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {restantes} de {c.vagas} vagas disponíveis · {ocupadas} inscrição(ões)
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 shrink-0">
                          <Trash2 size={14} />
                        </Button>
                      } />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A categoria <strong>{c.nome}</strong> será removida. Não é possível excluir se houver inscrições.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategoria(c.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {idx < torneio.categorias.length - 1 && <Separator />}
                </div>
              )
            })}
          </div>
        )}
        <Separator />
        <div className="p-4 flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Nova categoria</Label>
            <Input
              value={novaCategoria.nome}
              onChange={(e) => setNovaCategoria((n) => ({ ...n, nome: e.target.value }))}
              placeholder="Ex: Masculino A"
              className="h-9"
            />
          </div>
          <div className="w-24 space-y-1.5">
            <Label className="text-xs">Vagas</Label>
            <Input
              value={novaCategoria.vagas}
              onChange={(e) => setNovaCategoria((n) => ({ ...n, vagas: e.target.value }))}
              placeholder="16"
              type="number"
              min="1"
              className="h-9"
            />
          </div>
          <Button onClick={handleAddCategoria} disabled={addingCat} size="sm" className="h-9 bg-green-600 hover:bg-green-700">
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Inscrições */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold flex items-center gap-1.5">
              <Users size={15} /> Inscrições ({torneio.inscricoes.length})
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['TODAS', 'PENDENTE', 'CONFIRMADA', 'CANCELADA'] as FiltroStatus[]).map((f) => {
              const count = f === 'TODAS' ? torneio.inscricoes.length : torneio.inscricoes.filter((i) => i.status === f).length
              return (
                <button
                  key={f}
                  onClick={() => setFiltroStatus(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filtroStatus === f ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'
                  }`}
                >
                  {f === 'TODAS' ? 'Todas' : f === 'PENDENTE' ? 'Pendentes' : f === 'CONFIRMADA' ? 'Confirmadas' : 'Canceladas'} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {inscricoesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma inscrição</div>
        ) : (
          <div>
            {inscricoesFiltradas.map((i, idx) => (
              <div key={i.id}>
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{i.categoria.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[i.status].color}`}>
                        {STATUS_LABELS[i.status].label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="font-medium">{i.nomeJogador}</p>
                        {i.telefoneJogador && <p className="text-xs text-muted-foreground">{i.telefoneJogador}</p>}
                      </div>
                      <div>
                        <p className="font-medium">{i.nomeParceiro}</p>
                        {i.telefoneParceiro && <p className="text-xs text-muted-foreground">{i.telefoneParceiro}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(i.createdAt), "d/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {i.status === 'PENDENTE' && (
                      <Button
                        variant="ghost" size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleInscricaoStatus(i.id, 'CONFIRMADA')}
                        disabled={loading}
                        title="Confirmar pagamento"
                      >
                        <Check size={16} />
                      </Button>
                    )}
                    {i.status !== 'CANCELADA' && (
                      <Button
                        variant="ghost" size="icon"
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        onClick={() => handleInscricaoStatus(i.id, 'CANCELADA')}
                        disabled={loading}
                        title="Cancelar inscrição"
                      >
                        <X size={16} />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />
                        </Button>
                      } />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover inscrição?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remover inscrição de <strong>{i.nomeJogador}</strong> e <strong>{i.nomeParceiro}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteInscricao(i.id)} className="bg-red-600 hover:bg-red-700">Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {idx < inscricoesFiltradas.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog editar torneio */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Torneio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <textarea
                value={editForm.descricao}
                onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input value={editForm.data} onChange={(e) => setEditForm((f) => ({ ...f, data: e.target.value }))} type="date" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input value={editForm.valor} onChange={(e) => setEditForm((f) => ({ ...f, valor: e.target.value }))} type="number" step="0.01" min="0" className="h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Local</Label>
              <Input value={editForm.local} onChange={(e) => setEditForm((f) => ({ ...f, local: e.target.value }))} className="h-11" />
            </div>
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-semibold">Pagamento PIX</p>
              <div className="space-y-1.5">
                <Label>Tipo da chave</Label>
                <select
                  value={editForm.pixTipo}
                  onChange={(e) => setEditForm((f) => ({ ...f, pixTipo: e.target.value }))}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione...</option>
                  {PIX_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Chave PIX</Label>
                <Input value={editForm.pixChave} onChange={(e) => setEditForm((f) => ({ ...f, pixChave: e.target.value }))} className="h-11" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
