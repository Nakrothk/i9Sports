'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, ShoppingBag, Search } from 'lucide-react'
import { toast } from 'sonner'

type Categoria = 'BEBIDA' | 'COMIDA' | 'SERVICO' | 'OUTRO'
type Produto = { id: string; nome: string; preco: string | number; categoria: Categoria | null }

type Props = { produtosIniciais: Produto[] }

const CATEGORIAS: { value: Categoria; label: string; color: string }[] = [
  { value: 'BEBIDA', label: 'Bebida', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'COMIDA', label: 'Comida', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'SERVICO', label: 'Serviço', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'OUTRO', label: 'Outro', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
]

function categoriaCor(cat: Categoria | null) {
  return CATEGORIAS.find((c) => c.value === cat)?.color ?? ''
}

function categoriaLabel(cat: Categoria | null) {
  return CATEGORIAS.find((c) => c.value === cat)?.label ?? null
}

export function ProdutosClient({ produtosIniciais }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState<Categoria | ''>('')
  const [saving, setSaving] = useState(false)

  const produtosFiltrados = useMemo(() => {
    let lista = [...produtos].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    )
    if (categoriaFiltro) lista = lista.filter((p) => p.categoria === categoriaFiltro)
    if (busca.trim()) lista = lista.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    return lista
  }, [produtos, busca, categoriaFiltro])

  const reloadProdutos = async () => {
    const res = await fetch('/api/produtos')
    if (res.ok) setProdutos(await res.json())
  }

  const openCreate = () => {
    setEditando(null)
    setNome('')
    setPreco('')
    setCategoria('')
    setDialogOpen(true)
  }

  const openEdit = (p: Produto) => {
    setEditando(p)
    setNome(p.nome)
    setPreco(String(Number(p.preco).toFixed(2)))
    setCategoria(p.categoria ?? '')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!nome.trim() || !preco) {
      toast.error('Nome e preço são obrigatórios')
      return
    }
    const precoNum = parseFloat(preco.replace(',', '.'))
    if (isNaN(precoNum) || precoNum < 0) {
      toast.error('Preço inválido')
      return
    }
    setSaving(true)
    try {
      const url = editando ? `/api/produtos/${editando.id}` : '/api/produtos'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, preco: precoNum, categoria: categoria || null }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success(editando ? 'Produto atualizado!' : 'Produto criado!')
      setDialogOpen(false)
      await reloadProdutos()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Erro ao excluir produto'); return }
      toast.success('Produto excluído')
      await reloadProdutos()
    } catch {
      toast.error('Erro de conexão')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{produtos.length} cadastrado(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus size={16} className="mr-1" />
          Novo Produto
        </Button>
      </div>

      {/* Filtro por categoria */}
      {produtos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoriaFiltro(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              categoriaFiltro === null
                ? 'bg-foreground text-background border-foreground'
                : 'border-border hover:bg-muted'
            }`}
          >
            Todos
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoriaFiltro(categoriaFiltro === c.value ? null : c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoriaFiltro === c.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Busca */}
      {produtos.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      )}

      {produtos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="mx-auto w-12 h-12 text-muted-foreground/40 mb-3" />
          <p>Nenhum produto cadastrado</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>
            Cadastrar produto
          </Button>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum produto encontrado</p>
          <Button variant="ghost" className="mt-2 text-sm" onClick={() => { setBusca(''); setCategoriaFiltro(null) }}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          {produtosFiltrados.map((p, idx) => (
            <div key={p.id}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{p.nome}</p>
                    {p.categoria && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoriaCor(p.categoria)}`}>
                        {categoriaLabel(p.categoria)}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil size={16} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    }>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{p.nome}</strong>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-red-600 hover:bg-red-700">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {idx < produtosFiltrados.length - 1 && <div className="border-t mx-4" />}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do produto"
                className="h-11"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$) *</Label>
              <Input
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                className="h-11"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria | '')}
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sem categoria</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
