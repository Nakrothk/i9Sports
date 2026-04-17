'use client'

import { useRouter } from 'next/navigation'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  dataSelecionada: string
  hoje: string
}

export function DashboardNav({ dataSelecionada, hoje }: Props) {
  const router = useRouter()
  const isHoje = dataSelecionada === hoje

  const navegar = (dias: number) => {
    const novaData = format(
      dias > 0
        ? addDays(parseISO(dataSelecionada), dias)
        : subDays(parseISO(dataSelecionada), Math.abs(dias)),
      'yyyy-MM-dd'
    )
    router.push(novaData === hoje ? '/' : `/?data=${novaData}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navegar(-1)}>
        <ChevronLeft size={16} />
      </Button>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={dataSelecionada}
          max={hoje}
          onChange={(e) => {
            const val = e.target.value
            router.push(val === hoje ? '/' : `/?data=${val}`)
          }}
          className="text-sm border rounded-md px-2 py-1.5 bg-background text-foreground cursor-pointer h-9"
        />
        {!isHoje && (
          <Button variant="outline" size="sm" onClick={() => router.push('/')} className="gap-1 h-9">
            <CalendarDays size={14} />
            Hoje
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navegar(1)}
        disabled={isHoje}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
