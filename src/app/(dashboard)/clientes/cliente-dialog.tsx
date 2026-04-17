'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Cliente = {
  id: string
  nome: string
  dataNascimento: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  mensalista: boolean
  observacoes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente | null
  onSaved: () => void
}

export function ClienteDialog({ open, onOpenChange, cliente, onSaved }: Props) {
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [mensalista, setMensalista] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome)
      setDataNascimento(cliente.dataNascimento ?? '')
      setEmail(cliente.email ?? '')
      setTelefone(cliente.telefone ?? '')
      setMensalista(cliente.mensalista)
      setObservacoes(cliente.observacoes ?? '')
    } else {
      setNome(''); setDataNascimento(''); setEmail('')
      setTelefone(''); setMensalista(false); setObservacoes('')
    }
  }, [cliente, open])

  const handleSave = async () => {
    if (!nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    try {
      const url = cliente ? `/api/clientes/${cliente.id}` : '/api/clientes'
      const method = cliente ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, dataNascimento: dataNascimento || null, email, telefone, mensalista, observacoes }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success(cliente ? 'Cliente atualizado!' : 'Cliente cadastrado!')
      onSaved()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="h-11" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="h-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="h-11" />
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="mensalista"
              checked={mensalista}
              onChange={(e) => setMensalista(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <label htmlFor="mensalista" className="text-sm font-medium text-yellow-800 cursor-pointer">
              ⭐ Cliente Mensalista (quadra fixa mensal)
            </label>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Informações adicionais..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
