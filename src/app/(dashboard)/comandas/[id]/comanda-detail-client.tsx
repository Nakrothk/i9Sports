'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, Phone, Minus, ShoppingCart, UserPlus, User } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

type Categoria = 'BEBIDA' | 'COMIDA' | 'SERVICO' | 'OUTRO'
type Produto = { id: string; nome: string; preco: string | number; categoria: Categoria | null }

const CATEGORIAS_FILTRO: { value: Categoria; label: string }[] = [
  { value: 'BEBIDA', label: 'Bebidas' },
  { value: 'COMIDA', label: 'Comidas' },
  { value: 'SERVICO', label: 'Serviços' },
  { value: 'OUTRO', label: 'Outros' },
]
type ItemComanda = { id: string; produtoId: string; quantidade: number; precoUnit: string | number; produto: Produto }
type ClienteBasico = { id: string; nome: string; telefone: string | null }
type Comanda = {
  id: string
  nomeCliente: string
  telefone: string | null
  clienteId: string | null
  cliente: ClienteBasico | null
  status: 'ABERTA' | 'FECHADA'
  total: string | number
  observacoes: string | null
  createdAt: string
  itens: ItemComanda[]
}

function ProdutoCombobox({ produtos, value, onChange, placeholder = 'Buscar produto...' }: { produtos: Produto[]; value: string; onChange: (id: string) => void; placeholder?: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = value ? produtos.find((p) => p.id === value) : null

  const filtered = produtos.filter((p) =>
    p.nome.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative flex-1" ref={containerRef}>
      <Input
        value={open ? query : (selected ? selected.nome : query)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
        onFocus={() => { setOpen(true); setQuery('') }}
        placeholder={placeholder}
        className="h-11"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-lg max-h-52 overflow-y-auto mt-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => { onChange(p.id); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted flex items-center justify-between gap-2"
            >
              <span>{p.nome}</span>
              <span className="text-muted-foreground shrink-0">
                {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type Props = {
  comanda: Comanda
  produtos: Produto[]
}

type CarrinhoItem = { produtoId: string; nome: string; preco: number; quantidade: number }

export function ComandaDetailClient({ comanda: inicial, produtos }: Props) {
  const [comanda, setComanda] = useState<Comanda>(inicial)
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | null>(null)

  // Vincular cliente
  const [vincularOpen, setVincularOpen] = useState(false)
  const [clienteQuery, setClienteQuery] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteBasico[]>([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)

  const buscarClientes = async (q: string) => {
    setClienteQuery(q)
    if (!q.trim()) { setClientesEncontrados([]); return }
    setBuscandoClientes(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      if (res.ok) setClientesEncontrados(await res.json())
    } finally { setBuscandoClientes(false) }
  }

  const handleVincularCliente = async (cliente: ClienteBasico) => {
    try {
      const res = await fetch(`/api/comandas/${comanda.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCliente: comanda.nomeCliente, clienteId: cliente.id }),
      })
      if (!res.ok) { toast.error('Erro ao vincular cliente'); return }
      setComanda((c) => ({ ...c, clienteId: cliente.id, cliente }))
      setVincularOpen(false)
      toast.success(`Comanda vinculada a ${cliente.nome}`)
    } catch { toast.error('Erro de conexão') }
  }

  const handleDesvincularCliente = async () => {
    try {
      const res = await fetch(`/api/comandas/${comanda.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCliente: comanda.nomeCliente, clienteId: null }),
      })
      if (!res.ok) { toast.error('Erro ao desvincular'); return }
      setComanda((c) => ({ ...c, clienteId: null, cliente: null }))
      toast.success('Cliente desvinculado')
    } catch { toast.error('Erro de conexão') }
  }

  const totalCarrinho = useMemo(
    () => carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0),
    [carrinho]
  )

  const addAoCarrinho = (produtoId: string) => {
    if (!produtoId) return
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produtoId === produtoId)
      if (existente) {
        return prev.map((i) => i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i)
      }
      return [...prev, { produtoId, nome: produto.nome, preco: Number(produto.preco), quantidade: 1 }]
    })
  }

  const alterarQtd = (produtoId: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((i) => i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + delta } : i)
        .filter((i) => i.quantidade > 0)
    )
  }

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho((prev) => prev.filter((i) => i.produtoId !== produtoId))
  }

  const reloadComanda = async () => {
    const res = await fetch(`/api/comandas/${comanda.id}`)
    if (res.ok) {
      const json = await res.json()
      setComanda(json)
    }
  }

  const handleAddItens = async () => {
    if (carrinho.length === 0) { toast.error('Adicione pelo menos um item'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/comandas/${comanda.id}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: carrinho.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })) }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao adicionar itens'); return }
      toast.success(`${carrinho.length} item(ns) adicionado(s)!`)
      setCarrinho([])
      setComanda({
        ...json,
        total: Number(json.total),
        createdAt: json.createdAt,
        itens: json.itens.map((i: { precoUnit: unknown; produto: { preco: unknown } }) => ({
          ...i,
          precoUnit: Number(i.precoUnit),
          produto: { ...i.produto, preco: Number(i.produto.preco) },
        })),
      })
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/itens/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Erro ao remover item')
        return
      }
      toast.success('Item removido')
      await reloadComanda()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleFechar = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/comandas/${comanda.id}/fechar`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao fechar comanda')
        return
      }
      toast.success('Comanda fechada!')
      setComanda(json)
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const isAberta = comanda.status === 'ABERTA'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comandas">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{comanda.nomeCliente}</h1>
            <Badge variant={isAberta ? 'outline' : 'secondary'} className="flex items-center gap-1">
              {isAberta ? <Clock size={12} /> : <CheckCircle size={12} />}
              {isAberta ? 'Aberta' : 'Fechada'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Aberta {format(new Date(comanda.createdAt), "d/MM 'às' HH:mm", { locale: ptBR })}
            </p>
            {comanda.telefone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone size={11} />
                {comanda.telefone}
              </p>
            )}
            {comanda.cliente ? (
              <div className="flex items-center gap-1.5">
                <Link href={`/clientes/${comanda.cliente.id}`} className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                  <User size={11} />
                  {comanda.cliente.nome}
                </Link>
                <button onClick={handleDesvincularCliente} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setClienteQuery(''); setClientesEncontrados([]); setVincularOpen(true) }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <UserPlus size={11} />
                Vincular cliente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Adicionar item (só se aberta) */}
      {isAberta && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold">Adicionar Itens</p>

          {/* Filtro por categoria */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoriaFiltro(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                categoriaFiltro === null
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border hover:bg-muted'
              }`}
            >
              Todos
            </button>
            {CATEGORIAS_FILTRO.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategoriaFiltro(categoriaFiltro === c.value ? null : c.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  categoriaFiltro === c.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Combobox de busca */}
          <div className="flex gap-2">
            <ProdutoCombobox
              produtos={categoriaFiltro ? produtos.filter((p) => p.categoria === categoriaFiltro) : produtos}
              value=""
              onChange={addAoCarrinho}
              placeholder="Buscar e adicionar produto..."
            />
          </div>

          {/* Carrinho */}
          {carrinho.length > 0 && (
            <div className="space-y-2">
              {carrinho.map((item) => (
                <div key={item.produtoId} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => alterarQtd(item.produtoId, -1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-muted">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantidade}</span>
                    <button onClick={() => alterarQtd(item.produtoId, 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-muted">
                      <Plus size={12} />
                    </button>
                    <button onClick={() => removerDoCarrinho(item.produtoId)} className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Subtotal + botão confirmar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted-foreground">
                  Subtotal: <strong>{totalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </span>
                <Button onClick={handleAddItens} disabled={loading} className="bg-green-600 hover:bg-green-700 h-9">
                  <ShoppingCart size={15} className="mr-1.5" />
                  {loading ? 'Adicionando...' : `Adicionar ${carrinho.length} item(ns)`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Itens da comanda */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <p className="font-semibold">Itens ({comanda.itens.length})</p>
        </div>
        {comanda.itens.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum item adicionado
          </div>
        ) : (
          <div>
            {comanda.itens.map((item, idx) => (
              <div key={item.id}>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.produto.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantidade}x {Number(item.precoUnit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm">
                      {(item.quantidade * Number(item.precoUnit)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    {isAberta && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {idx < comanda.itens.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
        <Separator />
        <div className="p-4 flex items-center justify-between">
          <p className="font-bold text-lg">Total</p>
          <p className="font-bold text-2xl text-green-700">
            {Number(comanda.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Ações */}
      {isAberta && (
        <AlertDialog>
          <AlertDialogTrigger render={
            <Button
              className="w-full h-14 text-base bg-green-600 hover:bg-green-700"
              disabled={loading || comanda.itens.length === 0}
            >
              <CheckCircle size={20} className="mr-2" />
              Fechar Comanda
            </Button>
          }></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fechar comanda?</AlertDialogTitle>
              <AlertDialogDescription>
                Total de{' '}
                <strong>
                  {Number(comanda.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>{' '}
                para <strong>{comanda.nomeCliente}</strong>.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleFechar} className="bg-green-600 hover:bg-green-700">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog vincular cliente */}
      <Dialog open={vincularOpen} onOpenChange={setVincularOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Vincular cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Buscar por nome ou telefone</Label>
              <Input
                value={clienteQuery}
                onChange={(e) => buscarClientes(e.target.value)}
                placeholder="Digite o nome..."
                className="h-11"
                autoFocus
              />
            </div>
            {buscandoClientes && <p className="text-xs text-muted-foreground text-center">Buscando...</p>}
            {clientesEncontrados.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {clientesEncontrados.map((c, idx) => (
                  <div key={c.id}>
                    <button
                      onClick={() => handleVincularCliente(c)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium">{c.nome}</p>
                      {c.telefone && <p className="text-xs text-muted-foreground">{c.telefone}</p>}
                    </button>
                    {idx < clientesEncontrados.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
            {clienteQuery.trim() && !buscandoClientes && clientesEncontrados.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum cliente encontrado</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVincularOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
