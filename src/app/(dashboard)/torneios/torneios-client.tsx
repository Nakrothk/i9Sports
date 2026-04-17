'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Trophy, Trash2, ChevronRight, CalendarDays, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

type Categoria = { id: string; nome: string; vagas: number }
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
  _count: { inscricoes: number }
}

const PIX_TIPOS = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave aleatória']

const emptyForm = { nome: '', descricao: '', data: '', local: '', valor: '', pixChave: '', pixTipo: '' }

export function TorneiosClient({ torneiosIniciais }: { torneiosIniciais: Torneio[] }) {
  const [torneios, setTorneios] = useState<Torneio[]>(torneiosIniciais)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const reload = async () => {
    const res = await fetch('/api/torneios')
    if (res.ok) setTorneios(await res.json())
  }

  const openCreate = () => { setForm(emptyForm); setDialogOpen(true) }

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/torneios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: form.valor ? parseFloat(form.valor.replace(',', '.')) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao criar torneio'); return }
      toast.success('Torneio criado!')
      setDialogOpen(false)
      await reload()
    } catch { toast.error('Erro de conexão') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/torneios/${id}`, { method: 'DELETE' })
      toast.success('Torneio excluído')
      await reload()
    } catch { toast.error('Erro de conexão') }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Torneios</h1>
          <p className="text-sm text-muted-foreground">{torneios.length} evento(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus size={16} className="mr-1" /> Novo Torneio
        </Button>
      </div>

      {torneios.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="mx-auto w-12 h-12 text-muted-foreground/40 mb-3" />
          <p>Nenhum torneio cadastrado</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>Criar torneio</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {torneios.map((t) => (
            <div key={t.id} className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-semibold text-base">{t.nome}</h2>
                    <Badge variant={t.status === 'ABERTO' ? 'outline' : 'secondary'} className="text-xs">
                      {t.status === 'ABERTO' ? 'Aberto' : 'Encerrado'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                    {t.data && (
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {format(new Date(t.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    )}
                    {t.local && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {t.local}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {t._count.inscricoes} inscrição(ões)
                    </span>
                  </div>
                  {t.categorias.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {t.categorias.map((c) => (
                        <span key={c.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {c.nome} ({c.vagas} vagas)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </Button>
                    } />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir torneio?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todas as categorias e inscrições de <strong>{t.nome}</strong> serão removidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-700">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Link href={`/torneios/${t.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight size={18} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Torneio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={set('nome')} placeholder="Ex: Copa Beach Tennis 2025" className="h-11" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <textarea
                value={form.descricao}
                onChange={set('descricao')}
                placeholder="Informações sobre o torneio..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input value={form.data} onChange={set('data')} type="date" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor da inscrição (R$)</Label>
                <Input value={form.valor} onChange={set('valor')} placeholder="0,00" type="number" step="0.01" min="0" className="h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Local</Label>
              <Input value={form.local} onChange={set('local')} placeholder="Arena XYZ" className="h-11" />
            </div>
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-semibold">Pagamento PIX</p>
              <div className="space-y-1.5">
                <Label>Tipo da chave</Label>
                <select
                  value={form.pixTipo}
                  onChange={set('pixTipo')}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione...</option>
                  {PIX_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Chave PIX</Label>
                <Input value={form.pixChave} onChange={set('pixChave')} placeholder="Sua chave PIX" className="h-11" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Criando...' : 'Criar Torneio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
