import { useMemo } from 'react'

export type ChannelName = 'Consumo' | 'Revenda' | 'Cozinhas Industriais'

export interface UserEntry {
  id: string
  nome: string
  codigo: number | string
  setor: ChannelName
  metaMensal: number
  valorRealizado: number
  pedidosEmAberto: number
}

export interface CalculatedUser extends UserEntry {
  percentRealizado: number
  valorMetaRestante: number
  valorDia: number
  valorSemana: number
  valorMeta: number
  faturadosMaisAbertos: number
  percentTotalPedidos: number
}

export interface ChannelTotals {
  metaTotal: number
  valorRealizadoTotal: number
  pedidosEmAbertoTotal: number
  faturadosMaisAbertosTotal: number
  percentTotal: number
  valorMetaRestanteTotal: number
  valorDiaTotal: number
  valorSemanaTotal: number
  valorMetaTotal: number
}

function getDaysAndWeeksRemaining() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()
  const diasRestantes = Math.max(1, lastDay - today + 1)
  const semanasRestantes = Math.max(1, Math.ceil(diasRestantes / 7))
  return { diasRestantes, semanasRestantes }
}

export function useSalesCalculations(users: UserEntry[]) {
  const { diasRestantes, semanasRestantes } = getDaysAndWeeksRemaining()

  return useMemo(() => {
    const ranked = [...users].map((u) => {
      const valorMetaRestante = Math.max(0, u.metaMensal - u.valorRealizado)
      const valorDia = valorMetaRestante / diasRestantes
      const valorSemana = valorMetaRestante / semanasRestantes
      const valorMeta = valorMetaRestante
      const faturadosMaisAbertos = u.valorRealizado + u.pedidosEmAberto
      const percentRealizado = u.metaMensal > 0 ? (u.valorRealizado / u.metaMensal) * 100 : 0
      const percentTotalPedidos = u.metaMensal > 0 ? (faturadosMaisAbertos / u.metaMensal) * 100 : 0

      return {
        ...u,
        valorMetaRestante,
        valorDia,
        valorSemana,
        valorMeta,
        faturadosMaisAbertos,
        percentRealizado,
        percentTotalPedidos,
      }
    })

    ranked.sort((a, b) => b.percentRealizado - a.percentRealizado)

    const totals = ranked.reduce<ChannelTotals>(
      (acc, u) => {
        acc.metaTotal += u.metaMensal
        acc.valorRealizadoTotal += u.valorRealizado
        acc.pedidosEmAbertoTotal += u.pedidosEmAberto
        acc.faturadosMaisAbertosTotal += u.faturadosMaisAbertos
        acc.valorMetaRestanteTotal += u.valorMetaRestante
        acc.valorDiaTotal += u.valorDia
        acc.valorSemanaTotal += u.valorSemana
        acc.valorMetaTotal += u.valorMeta
        return acc
      },
      {
        metaTotal: 0,
        valorRealizadoTotal: 0,
        pedidosEmAbertoTotal: 0,
        faturadosMaisAbertosTotal: 0,
        percentTotal: 0,
        valorMetaRestanteTotal: 0,
        valorDiaTotal: 0,
        valorSemanaTotal: 0,
        valorMetaTotal: 0,
      }
    )

    totals.percentTotal = totals.metaTotal > 0 ? (totals.valorRealizadoTotal / totals.metaTotal) * 100 : 0

    return { ranked, totals }
  }, [users, diasRestantes, semanasRestantes])
}


