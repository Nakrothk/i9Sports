'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, ChevronRight, Users, Star } from 'lucide-react'
import { ClienteDialog } from './cliente-dialog'

type Cliente = {
  id: string
  nome: string
  dataNascimento: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  mensalista: boolean
  observacoes: string | null
  createdAt: string
  _count: { reservas: number; comandas: number }
}

type Props = { clientesIniciais: Cliente[] }

export function ClientesClient({ clientesIniciais }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const reload = async () => {
    const res = await fetch('/api/clientes')
    if (res.ok) {
      const data = await res.json()
      setClientes(data.map((c: Cliente) => ({
        ...c,
        dataNascimento: c.dataNascimento ? c.dataNascimento.split('T')[0] : null,
      })))
    }
  }

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  )

  const mensalistas = clientes.filter((c) => c.mensalista).length

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes.length} cadastrados · {mensalistas} mensalistas
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus size={16} className="mr-1" />
          Novo Cliente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="mx-auto w-12 h-12 text-muted-foreground/40 mb-3" />
          <p>{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
          {!busca && (
            <Button variant="outline" className="mt-3" onClick={() => setDialogOpen(true)}>
              Cadastrar cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          {filtrados.map((c, idx) => (
            <div key={c.id}>
              <Link href={`/clientes/${c.id}`}>
                <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                      <span className="text-green-700 dark:text-green-400 font-bold text-sm">
                        {c.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{c.nome}</p>
                        {c.mensalista && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs gap-1">
                            <Star size={10} />
                            Mensalista
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        {c.telefone && <span>{c.telefone}</span>}
                        <span>{c._count.reservas} reserva(s)</span>
                        <span>{c._count.comandas} comanda(s)</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </Link>
              {idx < filtrados.length - 1 && <div className="border-t mx-4" />}
            </div>
          ))}
        </div>
      )}

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => { setDialogOpen(false); reload() }}
      />
    </div>
  )
}
