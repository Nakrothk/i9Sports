'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Clock, CheckCircle, ChevronRight, User, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Produto = { id: string; nome: string; preco: string | number }
type ItemComanda = { id: string; produtoId: string; quantidade: number; precoUnit: string | number; produto: Produto }
type Comanda = {
  id: string
  nomeCliente: string
  status: 'ABERTA' | 'FECHADA'
  total: string | number
  createdAt: string
  updatedAt: string
  itens: ItemComanda[]
}
type ClienteBasico = { id: string; nome: string; telefone: string | null }

type Props = {
  comandasIniciais: Comanda[]
  produtosIniciais: Produto[]
}

export function ComandasClient({ comandasIniciais }: Props) {
  const [comandas, setComandas] = useState<Comanda[]>(comandasIniciais)

  // Dialog nova comanda
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBasico | null>(null)
  const [clienteQuery, setClienteQuery] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteBasico[]>([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filtro de data nas fechadas
  const [dataFiltro, setDataFiltro] = useState('')

  const abertas = comandas.filter((c) => c.status === 'ABERTA')

  const fechadas = useMemo(() => {
    const lista = comandas.filter((c) => c.status === 'FECHADA')
    if (!dataFiltro) return lista
    return lista.filter((c) => {
      const data = new Date(c.updatedAt)
      return format(data, 'yyyy-MM-dd') === dataFiltro
    })
  }, [comandas, dataFiltro])

  const reloadComandas = async () => {
    try {
      const res = await fetch('/api/comandas')
      const json = await res.json()
      setComandas(json)
    } catch {
      toast.error('Erro ao atualizar comandas')
    }
  }

  const buscarClientes = async (q: string) => {
    setClienteQuery(q)
    if (!q.trim()) { setClientesEncontrados([]); return }
    setBuscandoClientes(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      if (res.ok) setClientesEncontrados(await res.json())
    } finally { setBuscandoClientes(false) }
  }

  const selecionarCliente = (c: ClienteBasico) => {
    setClienteSelecionado(c)
    setClienteId(c.id)
    setNomeCliente(c.nome)
    setTelefone(c.telefone ?? '')
    setClienteQuery('')
    setClientesEncontrados([])
  }

  const desvincularCliente = () => {
    setClienteSelecionado(null)
    setClienteId(null)
    setNomeCliente('')
    setTelefone('')
  }

  const resetDialog = () => {
    setNomeCliente(''); setTelefone(''); setClienteId(null)
    setClienteSelecionado(null); setClienteQuery(''); setClientesEncontrados([])
  }

  const handleCreate = async () => {
    if (!nomeCliente.trim()) { toast.error('Informe o nome do cliente'); return }
    if (!telefone.trim()) { toast.error('Telefone é obrigatório'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCliente, telefone, clienteId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao criar comanda'); return }
      toast.success('Comanda aberta!')
      setDialogOpen(false)
      resetDialog()
      reloadComandas()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comandas</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus size={16} className="mr-1" />
          Nova Comanda
        </Button>
      </div>

      <Tabs defaultValue="abertas">
        <TabsList className="w-full">
          <TabsTrigger value="abertas" className="flex-1">
            Abertas <Badge variant="secondary" className="ml-2">{abertas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="fechadas" className="flex-1">
            Fechadas <Badge variant="secondary" className="ml-2">{comandas.filter(c => c.status === 'FECHADA').length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abertas" className="space-y-2 mt-4">
          {abertas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardListIcon />
              <p className="mt-2">Nenhuma comanda aberta</p>
            </div>
          ) : (
            abertas.map((c) => <ComandaCard key={c.id} comanda={c} />)
          )}
        </TabsContent>

        <TabsContent value="fechadas" className="mt-4 space-y-3">
          {/* Filtro de data */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {dataFiltro && (
              <Button variant="ghost" size="sm" onClick={() => setDataFiltro('')} className="gap-1 shrink-0">
                <X size={14} />
                Limpar
              </Button>
            )}
          </div>

          {fechadas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{dataFiltro ? `Nenhuma comanda fechada em ${format(new Date(dataFiltro + 'T12:00:00'), "d/MM/yyyy")}` : 'Nenhuma comanda fechada'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fechadas.map((c) => <ComandaCard key={c.id} comanda={c} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog nova comanda */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog() }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Comanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Busca de cliente */}
            {!clienteSelecionado ? (
              <div className="space-y-1.5">
                <Label>Vincular cliente (opcional)</Label>
                <div className="relative">
                  <Input
                    value={clienteQuery}
                    onChange={(e) => buscarClientes(e.target.value)}
                    placeholder="Buscar cliente por nome ou telefone..."
                    className="h-11"
                  />
                  {buscandoClientes && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Buscando...</span>
                  )}
                </div>
                {clientesEncontrados.length > 0 && (
                  <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {clientesEncontrados.map((c, idx) => (
                      <div key={c.id}>
                        <button
                          type="button"
                          onClick={() => selecionarCliente(c)}
                          className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm font-medium">{c.nome}</p>
                          {c.telefone && <p className="text-xs text-muted-foreground">{c.telefone}</p>}
                        </button>
                        {idx < clientesEncontrados.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{clienteSelecionado.nome}</p>
                    {clienteSelecionado.telefone && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">{clienteSelecionado.telefone}</p>
                    )}
                  </div>
                </div>
                <button onClick={desvincularCliente} className="text-blue-400 hover:text-blue-600 p-1 rounded">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Nome do Cliente *</Label>
              <Input
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Nome ou número da comanda"
                className="h-11"
                autoFocus={!clienteSelecionado}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone *</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Abrindo...' : 'Abrir Comanda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ComandaCard({ comanda }: { comanda: Comanda }) {
  return (
    <Link href={`/comandas/${comanda.id}`}>
      <div className="bg-card border rounded-lg p-4 flex items-center justify-between hover:border-green-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center gap-3">
          {comanda.status === 'ABERTA' ? (
            <Clock size={20} className="text-orange-500 shrink-0" />
          ) : (
            <CheckCircle size={20} className="text-green-500 shrink-0" />
          )}
          <div>
            <p className="font-semibold">{comanda.nomeCliente}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(comanda.createdAt), "d/MM 'às' HH:mm", { locale: ptBR })} •{' '}
              {comanda.itens.length} iten(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-green-700">
              {Number(comanda.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <Badge variant={comanda.status === 'ABERTA' ? 'outline' : 'secondary'} className="text-xs">
              {comanda.status === 'ABERTA' ? 'Aberta' : 'Fechada'}
            </Badge>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}

function ClipboardListIcon() {
  return (
    <svg className="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
