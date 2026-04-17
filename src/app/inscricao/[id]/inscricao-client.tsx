'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, CalendarDays, MapPin, CheckCircle, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

type Categoria = { id: string; nome: string; vagas: number; vagasRestantes: number }
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
}

const emptyForm = {
  categoriaId: '',
  nomeJogador: '',
  telefoneJogador: '',
  nomeParceiro: '',
  telefoneParceiro: '',
}

export function InscricaoClient({ torneio }: { torneio: Torneio }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [pixData, setPixData] = useState<{ brCode?: string; qrCodeUrl?: string } | null>(null)

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoriaId) { toast.error('Selecione uma categoria'); return }
    if (!form.nomeJogador.trim() || !form.nomeParceiro.trim()) {
      toast.error('Nome do jogador e parceiro são obrigatórios'); return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/inscricao/${torneio.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao realizar inscrição'); return }
      setPixData({ brCode: json.pixBrCode ?? undefined, qrCodeUrl: json.pixQrCodeUrl ?? undefined })
    } catch { toast.error('Erro de conexão') }
    finally { setSaving(false) }
  }

  const copyBrCode = () => {
    if (pixData?.brCode) {
      navigator.clipboard.writeText(pixData.brCode)
      toast.success('Código PIX copiado!')
    }
  }

  const categoriaSelecionada = torneio.categorias.find((c) => c.id === form.categoriaId)

  if (pixData !== null) {
    const temPix = pixData.brCode || pixData.qrCodeUrl
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Inscrição realizada!</h1>
            <p className="text-muted-foreground mt-1">
              {temPix
                ? 'Realize o pagamento PIX abaixo para confirmar sua inscrição.'
                : 'Sua inscrição está pendente. O organizador irá confirmar em breve.'}
            </p>
          </div>

          {temPix && (
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <p className="font-semibold text-sm">Pagamento PIX</p>

              {torneio.valor && (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Valor a pagar</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {torneio.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              )}

              {pixData.qrCodeUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pixData.qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 rounded-lg" />
                </div>
              )}

              {pixData.brCode && (
                <div className="space-y-1.5 text-left">
                  <p className="text-xs text-muted-foreground">Ou copie o código PIX:</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <span className="font-mono text-xs flex-1 break-all line-clamp-2">{pixData.brCode}</span>
                    <button onClick={copyBrCode} className="shrink-0 text-muted-foreground hover:text-foreground p-1">
                      <Copy size={15} />
                    </button>
                  </div>
                  <Button onClick={copyBrCode} variant="outline" className="w-full">
                    <Copy size={14} className="mr-1.5" /> Copiar código PIX
                  </Button>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Após o pagamento ser identificado, sua inscrição será confirmada automaticamente.
          </p>
        </div>
      </div>
    )
  }

  if (torneio.status === 'ENCERRADO') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-3">
          <Trophy className="mx-auto w-12 h-12 text-muted-foreground/40" />
          <h1 className="text-xl font-bold">{torneio.nome}</h1>
          <p className="text-muted-foreground">As inscrições para este torneio estão encerradas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full mb-1">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">{torneio.nome}</h1>
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-muted-foreground">
            {torneio.data && (
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                {format(new Date(torneio.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            )}
            {torneio.local && <span className="flex items-center gap-1"><MapPin size={13} />{torneio.local}</span>}
          </div>
          {torneio.descricao && <p className="text-sm text-muted-foreground">{torneio.descricao}</p>}
          {torneio.valor && (
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              Inscrição: {torneio.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>

        {/* Categorias disponíveis */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold">Categorias disponíveis</p>
          {torneio.categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria disponível.</p>
          ) : (
            <div className="space-y-1.5">
              {torneio.categorias.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.nome}</span>
                  <span className={c.vagasRestantes === 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                    {c.vagasRestantes === 0 ? 'Esgotado' : `${c.vagasRestantes} vaga${c.vagasRestantes !== 1 ? 's' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-5 space-y-4">
          <p className="font-semibold">Formulário de inscrição</p>

          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <select
              value={form.categoriaId}
              onChange={set('categoriaId')}
              className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Selecione a categoria...</option>
              {torneio.categorias.map((c) => (
                <option key={c.id} value={c.id} disabled={c.vagasRestantes === 0}>
                  {c.nome}{c.vagasRestantes === 0 ? ' — Esgotado' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Jogador</p>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nomeJogador} onChange={set('nomeJogador')} placeholder="Seu nome completo" className="h-11" required />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefoneJogador} onChange={set('telefoneJogador')} placeholder="(00) 00000-0000" className="h-11" />
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parceiro(a)</p>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nomeParceiro} onChange={set('nomeParceiro')} placeholder="Nome do parceiro" className="h-11" required />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefoneParceiro} onChange={set('telefoneParceiro')} placeholder="(00) 00000-0000" className="h-11" />
            </div>
          </div>

          {categoriaSelecionada && categoriaSelecionada.vagasRestantes > 0 && (
            <p className="text-xs text-muted-foreground">
              Restam <strong>{categoriaSelecionada.vagasRestantes}</strong> vaga(s) em <strong>{categoriaSelecionada.nome}</strong>
            </p>
          )}

          <Button type="submit" disabled={saving} className="w-full h-12 bg-green-600 hover:bg-green-700 text-base">
            {saving ? 'Enviando...' : 'Realizar inscrição'}
          </Button>
        </form>
      </div>
    </div>
  )
}
