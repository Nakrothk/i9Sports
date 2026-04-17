'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Pencil, Trash2, Star, CalendarDays, ClipboardList, Phone, Mail, Cake, CheckCircle, Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format, differenceInYears, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClienteDialog } from '../cliente-dialog'

type Produto = { id: string; nome: string; preco: number }
type ItemComanda = { id: string; produtoId: string; quantidade: number; precoUnit: number; produto: Produto }
type Comanda = { id: string; nomeCliente: string; status: 'ABERTA' | 'FECHADA'; total: number; createdAt: string; itens: ItemComanda[] }
type Reserva = { id: string; nomeCliente: string; quadraId: string; data: string; horario: string; observacoes: string | null; quadra: { id: string; nome: string } }
type Cliente = {
  id: string; nome: string; dataNascimento: string | null; email: string | null
  telefone: string | null; mensalista: boolean
  observacoes: string | null; createdAt: string
  reservas: Reserva[]; comandas: Comanda[]
}

export function ClienteDetailClient({ cliente: inicial }: { cliente: Cliente }) {
  const router = useRouter()
  const [cliente, setCliente] = useState(inicial)
  const [editOpen, setEditOpen] = useState(false)
  const [novaComandaOpen, setNovaComandaOpen] = useState(false)
  const [comandaTelefone, setComandaTelefone] = useState('')
  const [savingComanda, setSavingComanda] = useState(false)

  const reloadCliente = async () => {
    const res = await fetch(`/api/clientes/${cliente.id}`)
    if (res.ok) {
      const data = await res.json()
      setCliente({
        ...data,
        dataNascimento: data.dataNascimento ? data.dataNascimento.split('T')[0] : null,
        reservas: data.reservas.map((r: Reserva & { data: string }) => ({ ...r, data: r.data.split('T')[0] })),
        comandas: data.comandas.map((c: Comanda) => ({ ...c, total: Number(c.total) })),
      })
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/clientes/${cliente.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Cliente excluído')
      router.push('/clientes')
    } else {
      toast.error('Erro ao excluir')
    }
  }

  const handleNovaComanda = async () => {
    if (!comandaTelefone.trim()) { toast.error('Telefone é obrigatório'); return }
    setSavingComanda(true)
    try {
      const res = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCliente: cliente.nome, telefone: comandaTelefone, clienteId: cliente.id }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao criar comanda'); return }
      toast.success('Comanda aberta!')
      router.push(`/comandas/${json.id}`)
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSavingComanda(false)
    }
  }

  const totalGasto = cliente.comandas
    .filter((c) => c.status === 'FECHADA')
    .reduce((acc, c) => acc + c.total, 0)

  const idade = cliente.dataNascimento
    ? differenceInYears(new Date(), parseISO(cliente.dataNascimento))
    : null

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{cliente.nome}</h1>
            {cliente.mensalista && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                <Star size={11} /> Mensalista
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Cliente desde {format(parseISO(cliente.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 gap-1.5"
            onClick={() => { setComandaTelefone(cliente.telefone ?? ''); setNovaComandaOpen(true) }}
          >
            <Plus size={15} />
            Nova Comanda
          </Button>
          <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            }></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir <strong>{cliente.nome}</strong>? O histórico será desvinculado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Informações */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cliente.telefone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={15} className="text-muted-foreground shrink-0" />
              <span>{cliente.telefone}</span>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={15} className="text-muted-foreground shrink-0" />
              <span className="truncate">{cliente.email}</span>
            </div>
          )}
          {cliente.dataNascimento && (
            <div className="flex items-center gap-2 text-sm">
              <Cake size={15} className="text-muted-foreground shrink-0" />
              <span>
                {format(parseISO(cliente.dataNascimento), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {idade !== null && <span className="text-muted-foreground ml-1">({idade} anos)</span>}
              </span>
            </div>
          )}
        </div>
        {cliente.observacoes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="text-sm mt-1">{cliente.observacoes}</p>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{cliente.reservas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Reservas</p>
        </div>
        <div className="bg-card border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{cliente.comandas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Comandas</p>
        </div>
        <div className="bg-card border rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-700">
            {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total gasto</p>
        </div>
      </div>

      {/* Histórico */}
      <Tabs defaultValue="reservas">
        <TabsList className="w-full">
          <TabsTrigger value="reservas" className="flex-1">
            <CalendarDays size={14} className="mr-1" />
            Reservas ({cliente.reservas.length})
          </TabsTrigger>
          <TabsTrigger value="comandas" className="flex-1">
            <ClipboardList size={14} className="mr-1" />
            Comandas ({cliente.comandas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservas" className="mt-3">
          {cliente.reservas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma reserva encontrada</div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              {cliente.reservas.map((r, idx) => (
                <div key={r.id}>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{r.quadra.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(r.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} às {r.horario}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{r.horario}</Badge>
                  </div>
                  {idx < cliente.reservas.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comandas" className="mt-3">
          {cliente.comandas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma comanda encontrada</div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              {cliente.comandas.map((c, idx) => (
                <div key={c.id}>
                  <Link href={`/comandas/${c.id}`}>
                    <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        {c.status === 'ABERTA'
                          ? <Clock size={16} className="text-orange-500" />
                          : <CheckCircle size={16} className="text-green-500" />
                        }
                        <div>
                          <p className="text-sm font-medium">
                            {format(parseISO(c.createdAt), "d/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">{c.itens.length} iten(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-sm text-green-700">
                            {c.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <Badge variant={c.status === 'ABERTA' ? 'outline' : 'secondary'} className="text-xs">
                            {c.status === 'ABERTA' ? 'Aberta' : 'Fechada'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {idx < cliente.comandas.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ClienteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        cliente={cliente}
        onSaved={() => { setEditOpen(false); reloadCliente() }}
      />

      {/* Dialog Nova Comanda */}
      <Dialog open={novaComandaOpen} onOpenChange={setNovaComandaOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Comanda — {cliente.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Telefone *</Label>
              <Input
                value={comandaTelefone}
                onChange={(e) => setComandaTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-11"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNovaComanda()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaComandaOpen(false)}>Cancelar</Button>
            <Button onClick={handleNovaComanda} disabled={savingComanda} className="bg-green-600 hover:bg-green-700">
              {savingComanda ? 'Abrindo...' : 'Abrir Comanda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
