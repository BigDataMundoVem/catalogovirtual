import React, { useState } from 'react'
import { CalculatedUser, ChannelTotals } from './useSalesCalculations'
import { Info } from 'lucide-react'

type CurrencyProps = { value: number; className?: string }
export const Currency: React.FC<CurrencyProps> = ({ value, className }) => (
  <span className={className}>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
)

type PercentProps = { value: number; className?: string }
export const Percent: React.FC<PercentProps> = ({ value, className }) => (
  <span className={className}>{value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</span>
)

export const TooltipInfo: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" title={text}>
    <Info className="h-4 w-4" />
  </span>
)

export const PerformanceBadge: React.FC<{ value: number }> = ({ value }) => {
  const isGood = value >= 100
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${isGood ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'}`}>
      <Percent value={value} />
    </div>
  )
}

export const TableHeaderGrouped: React.FC = () => (
  <thead className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/70 sticky top-0 z-10">
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <th colSpan={5} className="px-2 py-2 text-left">Dados</th>
      <th colSpan={2} className="px-2 py-2 text-left">Performance</th>
      <th colSpan={3} className="px-1 py-2 text-left">Falta para Meta</th>
      <th colSpan={3} className="px-1 py-2 text-left">Pedidos</th>
      <th className="px-1 py-2" />
    </tr>
    <tr className="border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
      <th className="px-2 py-2 text-left w-[48px]">Rank</th>
      <th className="px-2 py-2 text-left w-[180px]">Usuário</th>
      <th className="px-2 py-2 text-left w-[60px]">Código</th>
      <th className="px-2 py-2 text-left w-[100px]">Setor</th>
      <th className="px-2 py-2 text-right w-[110px]">Meta</th>
      <th className="px-2 py-2 text-left w-[100px]">% Realizado <TooltipInfo text="% realizado = realizado / meta" /></th>
      <th className="px-2 py-2 text-right w-[120px]">Valor Realizado</th>
      <th className="px-1 py-2 text-right w-[110px]">Falta <TooltipInfo text="Meta restante = Meta - Realizado" /></th>
      <th className="px-1 py-2 text-right w-[80px]">/Dia <TooltipInfo text="Meta restante / dias restantes do mês" /></th>
      <th className="px-1 py-2 text-right w-[80px]">/Semana <TooltipInfo text="Meta restante / semanas restantes do mês" /></th>
      <th className="px-1 py-2 text-right w-[110px]">Pedidos em Aberto</th>
      <th className="px-1 py-2 text-right w-[130px]">Faturado + Abertos</th>
      <th className="px-1 py-2 text-right w-[100px]">% Total Pedidos</th>
      <th className="px-1 py-2 text-right w-[90px]">Ações</th>
    </tr>
  </thead>
)

interface RowProps {
  user: CalculatedUser
  index: number
  onEdit: (user: CalculatedUser) => void
  onDelete: (id: string) => void
}

export const ChannelRow: React.FC<RowProps> = ({ user, index, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false)
  const isGoalHit = user.percentRealizado >= 100
  const faltaCor = user.valorMetaRestante > 0 ? 'text-red-500' : 'text-green-600'

  return (
    <>
      <tr className="border-b border-gray-200 dark:border-gray-700 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-2 py-2 font-semibold">{index + 1}º</td>
        <td className="px-2 py-2 truncate">{user.nome}</td>
        <td className="px-2 py-2">{user.codigo}</td>
        <td className="px-2 py-2 truncate">{user.setor}</td>
        <td className="px-2 py-2 text-right"><Currency className="text-gray-700 dark:text-gray-200 text-sm" value={user.metaMensal} /></td>
        <td className="px-2 py-2">
          <div className="flex flex-col">
            <PerformanceBadge value={user.percentRealizado} />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Realizado</span>
          </div>
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex flex-col items-end leading-tight">
            <Currency className="text-gray-700 dark:text-gray-200 text-sm" value={user.valorRealizado} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Realizado</span>
          </div>
        </td>
        <td className="px-1 py-2 text-right">
          <Currency className={`${faltaCor} text-sm`} value={user.valorMetaRestante} />
        </td>
        <td className="px-1 py-2 text-right">
          <Currency className={`${user.valorDia > 0 ? 'text-red-500' : 'text-green-600'} text-xs`} value={user.valorDia} />
        </td>
        <td className="px-1 py-2 text-right">
          <Currency className={`${user.valorSemana > 0 ? 'text-red-500' : 'text-green-600'} text-xs`} value={user.valorSemana} />
        </td>
        <td className="px-1 py-2 text-right">
          <Currency className="text-gray-700 dark:text-gray-200 text-sm" value={user.pedidosEmAberto} />
        </td>
        <td className="px-1 py-2 text-right">
          <Currency className="text-gray-700 dark:text-gray-200 text-sm" value={user.faturadosMaisAbertos} />
        </td>
        <td className="px-1 py-2 text-right">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            <Percent value={user.percentTotalPedidos} />
          </div>
        </td>
        <td className="px-1 py-2 text-right space-x-1 text-xs">
          <button onClick={() => onEdit(user)} className="text-blue-600 hover:underline">Editar</button>
          <button onClick={() => onDelete(user.id)} className="text-red-600 hover:underline">Excluir</button>
          <button onClick={() => setExpanded((v) => !v)} className="text-gray-500 hover:underline">{expanded ? 'Recolher' : 'Detalhes'}</button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-600 dark:text-gray-300">
          <td colSpan={14} className="px-3 py-2">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-100">Performance</p>
                <p>Realizado: <Currency value={user.valorRealizado} /></p>
                <p>% Realizado: <Percent value={user.percentRealizado} /></p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-100">Falta para Meta</p>
                <p>Meta restante: <Currency value={user.valorMetaRestante} /></p>
                <p>Dia: <Currency value={user.valorDia} /></p>
                <p>Semana: <Currency value={user.valorSemana} /></p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-100">Pedidos</p>
                <p>Aberto: <Currency value={user.pedidosEmAberto} /></p>
                <p>Faturado + Abertos: <Currency value={user.faturadosMaisAbertos} /></p>
                <p>% Total: <Percent value={user.percentTotalPedidos} /></p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

interface FooterProps {
  totals: ChannelTotals
}

export const ChannelFooter: React.FC<FooterProps> = ({ totals }) => (
  <tfoot className="text-sm font-semibold bg-gray-100 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
    <tr>
      <td className="px-3 py-2" colSpan={4}>TOTAL</td>
      <td className="px-3 py-2 text-right"><Currency value={totals.metaTotal} /></td>
      <td className="px-3 py-2 text-right"><Percent value={totals.percentTotal} /></td>
      <td className="px-3 py-2 text-right"><Currency value={totals.valorRealizadoTotal} /></td>
      <td className="px-3 py-2 text-right"><Currency value={totals.valorMetaRestanteTotal} /></td>
      <td className="px-3 py-2 text-right"><Currency value={totals.valorDiaTotal} /></td>
      <td className="px-3 py-2 text-right"><Currency value={totals.valorSemanaTotal} /></td>
      <td className="px-3 py-2 text-right"><Currency value={totals.pedidosEmAbertoTotal} /></td>
      <td className="px-3 py-2 text-right"><Currency value={totals.faturadosMaisAbertosTotal} /></td>
      <td className="px-3 py-2 text-right">
        <Percent value={totals.metaTotal > 0 ? (totals.faturadosMaisAbertosTotal / totals.metaTotal) * 100 : 0} />
      </td>
      <td />
    </tr>
  </tfoot>
)

