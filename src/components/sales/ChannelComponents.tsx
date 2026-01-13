import React, { useState } from 'react'
import { CalculatedUser, ChannelTotals } from './useSalesCalculations'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'

/* ==========================================================================
   UTILITÁRIOS DE FORMATAÇÃO
   ========================================================================== */

/** Formata valor monetário em R$ com separador de milhar */
const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

/** Formata percentual com 2 casas decimais */
const formatPercent = (value: number): string =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

/* ==========================================================================
   COMPONENTES DE EXIBIÇÃO
   ========================================================================== */

type CurrencyProps = { value: number; className?: string }
export const Currency: React.FC<CurrencyProps> = ({ value, className }) => (
  <span className={className}>{formatCurrency(value)}</span>
)

type PercentProps = { value: number; className?: string }
export const Percent: React.FC<PercentProps> = ({ value, className }) => (
  <span className={className}>{formatPercent(value)}</span>
)

/* ==========================================================================
   BADGE DE PERFORMANCE (% Realizado e % Total)
   Destaque visual com cores condicionais
   ========================================================================== */

export const PerformanceBadge: React.FC<{ value: number; size?: 'sm' | 'md' }> = ({ value, size = 'md' }) => {
  const isGood = value >= 100
  const isWarning = value >= 70 && value < 100
  
  let bgColor = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  if (isGood) bgColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  else if (isWarning) bgColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  
  return (
    <span className={`inline-block rounded-full font-bold ${bgColor} ${sizeClass}`}>
      {formatPercent(value)}
    </span>
  )
}

/* ==========================================================================
   LARGURAS FIXAS DAS COLUNAS (em pixels)
   Otimizado para telas >= 1366px sem scroll horizontal
   Total: ~1260px
   ========================================================================== */

const COL_WIDTHS = {
  rank: 40,        // #
  usuario: 130,    // Nome do usuário
  codigo: 50,      // Código
  setor: 85,       // Setor
  meta: 95,        // Meta Mensal
  percentReal: 80, // % Realizado (badge)
  valorReal: 95,   // Valor Realizado
  falta: 95,       // Falta p/ Meta
  dia: 80,         // /Dia
  semana: 85,      // /Semana
  pedAberto: 95,   // Pedidos em Aberto
  fatAbertos: 105, // Faturado + Abertos
  percentTotal: 75,// % Total (badge)
  acoes: 90,       // Ações
}

/* ==========================================================================
   CABEÇALHO DA TABELA
   Duas linhas: grupos e subcolunas
   ========================================================================== */

export const TableHeaderGrouped: React.FC = () => (
  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
    {/* Linha 1: Grupos */}
    <tr className="border-b border-slate-200 dark:border-slate-700">
      <th colSpan={4} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider border-r border-slate-200 dark:border-slate-700">
        Identificação
      </th>
      <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider border-r border-slate-200 dark:border-slate-700">
        Meta
      </th>
      <th colSpan={2} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider border-r border-slate-200 dark:border-slate-700">
        Performance
      </th>
      <th colSpan={3} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider border-r border-slate-200 dark:border-slate-700">
        Falta para Meta
      </th>
      <th colSpan={3} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider border-r border-slate-200 dark:border-slate-700">
        Pedidos
      </th>
      <th className="px-2 py-2" />
    </tr>
    {/* Linha 2: Subcolunas */}
    <tr className="border-b border-slate-300 dark:border-slate-600 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      <th style={{ width: COL_WIDTHS.rank }} className="px-2 py-2 text-center whitespace-nowrap">#</th>
      <th style={{ width: COL_WIDTHS.usuario }} className="px-2 py-2 text-left whitespace-nowrap">Usuário</th>
      <th style={{ width: COL_WIDTHS.codigo }} className="px-2 py-2 text-center whitespace-nowrap">Cód.</th>
      <th style={{ width: COL_WIDTHS.setor }} className="px-2 py-2 text-left whitespace-nowrap border-r border-slate-200 dark:border-slate-700">Setor</th>
      <th style={{ width: COL_WIDTHS.meta }} className="px-2 py-2 text-right whitespace-nowrap border-r border-slate-200 dark:border-slate-700">Meta Mensal</th>
      <th style={{ width: COL_WIDTHS.percentReal }} className="px-2 py-2 text-center whitespace-nowrap">% Real.</th>
      <th style={{ width: COL_WIDTHS.valorReal }} className="px-2 py-2 text-right whitespace-nowrap border-r border-slate-200 dark:border-slate-700">Realizado</th>
      <th style={{ width: COL_WIDTHS.falta }} className="px-2 py-2 text-right whitespace-nowrap">Falta</th>
      <th style={{ width: COL_WIDTHS.dia }} className="px-2 py-2 text-right whitespace-nowrap">/Dia</th>
      <th style={{ width: COL_WIDTHS.semana }} className="px-2 py-2 text-right whitespace-nowrap border-r border-slate-200 dark:border-slate-700">/Semana</th>
      <th style={{ width: COL_WIDTHS.pedAberto }} className="px-2 py-2 text-right whitespace-nowrap">Em Aberto</th>
      <th style={{ width: COL_WIDTHS.fatAbertos }} className="px-2 py-2 text-right whitespace-nowrap">Fat. + Abertos</th>
      <th style={{ width: COL_WIDTHS.percentTotal }} className="px-2 py-2 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700">% Total</th>
      <th style={{ width: COL_WIDTHS.acoes }} className="px-2 py-2 text-center whitespace-nowrap">Ações</th>
    </tr>
  </thead>
)

/* ==========================================================================
   LINHA DE DADOS (USUÁRIO)
   ========================================================================== */

interface RowProps {
  user: CalculatedUser
  index: number
  onEdit: (user: CalculatedUser) => void
  onDelete: (id: string) => void
}

export const ChannelRow: React.FC<RowProps> = ({ user, index, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false)
  
  // Cores para valores de "falta" (vermelho se positivo, verde se zero/negativo)
  const faltaColor = user.valorMetaRestante > 0 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-emerald-600 dark:text-emerald-400'

  return (
    <>
      <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        {/* BLOCO 1: Identificação */}
        <td style={{ width: COL_WIDTHS.rank }} className="px-2 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {index + 1}º
        </td>
        <td style={{ width: COL_WIDTHS.usuario }} className="px-2 py-3 text-left text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis" title={user.nome}>
          {user.nome}
        </td>
        <td style={{ width: COL_WIDTHS.codigo }} className="px-2 py-3 text-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {user.codigo || '-'}
        </td>
        <td style={{ width: COL_WIDTHS.setor }} className="px-2 py-3 text-left text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis border-r border-slate-100 dark:border-slate-700/50" title={user.setor}>
          {user.setor}
        </td>

        {/* BLOCO 2: Meta */}
        <td style={{ width: COL_WIDTHS.meta }} className="px-2 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-slate-700/50">
          {formatCurrency(user.metaMensal)}
        </td>

        {/* BLOCO 3: Performance */}
        <td style={{ width: COL_WIDTHS.percentReal }} className="px-2 py-3 text-center whitespace-nowrap">
          <PerformanceBadge value={user.percentRealizado} size="sm" />
        </td>
        <td style={{ width: COL_WIDTHS.valorReal }} className="px-2 py-3 text-right text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-slate-700/50">
          {formatCurrency(user.valorRealizado)}
        </td>

        {/* BLOCO 4: Falta para Meta */}
        <td style={{ width: COL_WIDTHS.falta }} className={`px-2 py-3 text-right text-xs font-semibold whitespace-nowrap ${faltaColor}`}>
          {formatCurrency(user.valorMetaRestante)}
        </td>
        <td style={{ width: COL_WIDTHS.dia }} className={`px-2 py-3 text-right text-xs whitespace-nowrap ${faltaColor}`}>
          {formatCurrency(user.valorDia)}
        </td>
        <td style={{ width: COL_WIDTHS.semana }} className={`px-2 py-3 text-right text-xs whitespace-nowrap border-r border-slate-100 dark:border-slate-700/50 ${faltaColor}`}>
          {formatCurrency(user.valorSemana)}
        </td>

        {/* BLOCO 5: Pedidos */}
        <td style={{ width: COL_WIDTHS.pedAberto }} className="px-2 py-3 text-right text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {formatCurrency(user.pedidosEmAberto)}
        </td>
        <td style={{ width: COL_WIDTHS.fatAbertos }} className="px-2 py-3 text-right text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
          {formatCurrency(user.faturadosMaisAbertos)}
        </td>
        <td style={{ width: COL_WIDTHS.percentTotal }} className="px-2 py-3 text-center whitespace-nowrap border-r border-slate-100 dark:border-slate-700/50">
          <PerformanceBadge value={user.percentTotalPedidos} size="sm" />
        </td>

        {/* Ações */}
        <td style={{ width: COL_WIDTHS.acoes }} className="px-2 py-3 text-center whitespace-nowrap">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onEdit(user)}
              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              title={expanded ? 'Recolher' : 'Expandir'}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Linha expandida com detalhes */}
      {expanded && (
        <tr className="bg-slate-50 dark:bg-slate-800/30">
          <td colSpan={14} className="px-4 py-3">
            <div className="flex flex-wrap gap-8 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Performance</p>
                <p>Realizado: {formatCurrency(user.valorRealizado)}</p>
                <p>% Realizado: {formatPercent(user.percentRealizado)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Falta para Meta</p>
                <p>Meta restante: {formatCurrency(user.valorMetaRestante)}</p>
                <p>Por dia: {formatCurrency(user.valorDia)}</p>
                <p>Por semana: {formatCurrency(user.valorSemana)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Pedidos</p>
                <p>Em aberto: {formatCurrency(user.pedidosEmAberto)}</p>
                <p>Faturado + Abertos: {formatCurrency(user.faturadosMaisAbertos)}</p>
                <p>% Total: {formatPercent(user.percentTotalPedidos)}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ==========================================================================
   RODAPÉ DA TABELA (TOTAIS)
   ========================================================================== */

interface FooterProps {
  totals: ChannelTotals
}

export const ChannelFooter: React.FC<FooterProps> = ({ totals }) => {
  const faltaColor = totals.valorMetaRestanteTotal > 0 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-emerald-600 dark:text-emerald-400'

  return (
    <tfoot className="bg-slate-200 dark:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200 sticky bottom-0">
      <tr>
        {/* BLOCO 1: Identificação */}
        <td colSpan={4} className="px-2 py-3 text-left text-xs uppercase tracking-wider whitespace-nowrap border-r border-slate-300 dark:border-slate-600">
          Total
        </td>

        {/* BLOCO 2: Meta */}
        <td style={{ width: COL_WIDTHS.meta }} className="px-2 py-3 text-right text-xs whitespace-nowrap border-r border-slate-300 dark:border-slate-600">
          {formatCurrency(totals.metaTotal)}
        </td>

        {/* BLOCO 3: Performance */}
        <td style={{ width: COL_WIDTHS.percentReal }} className="px-2 py-3 text-center whitespace-nowrap">
          <PerformanceBadge value={totals.percentTotal} size="sm" />
        </td>
        <td style={{ width: COL_WIDTHS.valorReal }} className="px-2 py-3 text-right text-xs whitespace-nowrap border-r border-slate-300 dark:border-slate-600">
          {formatCurrency(totals.valorRealizadoTotal)}
        </td>

        {/* BLOCO 4: Falta para Meta */}
        <td style={{ width: COL_WIDTHS.falta }} className={`px-2 py-3 text-right text-xs whitespace-nowrap ${faltaColor}`}>
          {formatCurrency(totals.valorMetaRestanteTotal)}
        </td>
        <td style={{ width: COL_WIDTHS.dia }} className={`px-2 py-3 text-right text-xs whitespace-nowrap ${faltaColor}`}>
          {formatCurrency(totals.valorDiaTotal)}
        </td>
        <td style={{ width: COL_WIDTHS.semana }} className={`px-2 py-3 text-right text-xs whitespace-nowrap border-r border-slate-300 dark:border-slate-600 ${faltaColor}`}>
          {formatCurrency(totals.valorSemanaTotal)}
        </td>

        {/* BLOCO 5: Pedidos */}
        <td style={{ width: COL_WIDTHS.pedAberto }} className="px-2 py-3 text-right text-xs whitespace-nowrap">
          {formatCurrency(totals.pedidosEmAbertoTotal)}
        </td>
        <td style={{ width: COL_WIDTHS.fatAbertos }} className="px-2 py-3 text-right text-xs whitespace-nowrap">
          {formatCurrency(totals.faturadosMaisAbertosTotal)}
        </td>
        <td style={{ width: COL_WIDTHS.percentTotal }} className="px-2 py-3 text-center whitespace-nowrap border-r border-slate-300 dark:border-slate-600">
          <PerformanceBadge value={totals.metaTotal > 0 ? (totals.faturadosMaisAbertosTotal / totals.metaTotal) * 100 : 0} size="sm" />
        </td>

        {/* Ações vazia */}
        <td style={{ width: COL_WIDTHS.acoes }} className="px-2 py-3" />
      </tr>
    </tfoot>
  )
}
