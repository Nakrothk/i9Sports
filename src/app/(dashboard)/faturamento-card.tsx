'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'

export function FaturamentoCard({ valor, label = 'Faturamento Hoje' }: { valor: number; label?: string }) {
  const [visivel, setVisivel] = useState(true)

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp size={16} />
            {label}
          </span>
          <button
            onClick={() => setVisivel((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={visivel ? 'Ocultar valor' : 'Mostrar valor'}
          >
            {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visivel ? (
          <p className="text-3xl font-bold text-blue-600">
            {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        ) : (
          <p className="text-3xl font-bold text-blue-600 tracking-widest select-none">••••••</p>
        )}
      </CardContent>
    </Card>
  )
}
