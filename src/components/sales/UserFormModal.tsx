import React from 'react'
import { ChannelName, UserEntry } from './useSalesCalculations'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<UserEntry, 'id'> & { valorRealizado: number; pedidosEmAberto: number }) => void
  initial?: UserEntry | null
  channel: ChannelName
}

// Funções auxiliares para formatação de valores monetários
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const parseCurrency = (value: string): number => {
  if (!value) return 0
  // Remove pontos (separadores de milhar) e substitui vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned || '0')
  return isNaN(num) ? 0 : num
}

// Formata valor enquanto digita (formato brasileiro: 1.234,56)
const handleCurrencyInput = (value: string): string => {
  if (!value) return ''
  
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  
  // Converte para número e divide por 100 para ter centavos
  const num = parseInt(numbers, 10) / 100
  
  // Formata com separador de milhar e 2 casas decimais
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, onSave, initial, channel }) => {
  const [nome, setNome] = React.useState(initial?.nome || '')
  const [codigo, setCodigo] = React.useState(String(initial?.codigo ?? ''))
  const [setor, setSetor] = React.useState<ChannelName>(initial?.setor || channel)
  const [metaMensal, setMetaMensal] = React.useState(formatCurrency(initial?.metaMensal ?? 0))
  const [valorRealizado, setValorRealizado] = React.useState(formatCurrency(initial?.valorRealizado ?? 0))
  const [pedidosEmAberto, setPedidosEmAberto] = React.useState(formatCurrency(initial?.pedidosEmAberto ?? 0))

  React.useEffect(() => {
    setNome(initial?.nome || '')
    setCodigo(String(initial?.codigo ?? ''))
    setSetor(initial?.setor || channel)
    setMetaMensal(formatCurrency(initial?.metaMensal ?? 0))
    setValorRealizado(formatCurrency(initial?.valorRealizado ?? 0))
    setPedidosEmAberto(formatCurrency(initial?.pedidosEmAberto ?? 0))
  }, [initial, channel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 my-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{initial ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm sm:text-base">Fechar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Código"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
            <input
              value={setor}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Mensal (R$)</label>
            <input
              type="text"
              value={metaMensal}
              onChange={(e) => {
                const formatted = handleCurrencyInput(e.target.value)
                setMetaMensal(formatted)
              }}
              onBlur={(e) => {
                const num = parseCurrency(e.target.value)
                setMetaMensal(formatCurrency(num))
              }}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Realizado (R$)</label>
            <input
              type="text"
              value={valorRealizado}
              onChange={(e) => {
                const formatted = handleCurrencyInput(e.target.value)
                setValorRealizado(formatted)
              }}
              onBlur={(e) => {
                const num = parseCurrency(e.target.value)
                setValorRealizado(formatCurrency(num))
              }}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pedidos em Aberto (R$)</label>
            <input
              type="text"
              value={pedidosEmAberto}
              onChange={(e) => {
                const formatted = handleCurrencyInput(e.target.value)
                setPedidosEmAberto(formatted)
              }}
              onBlur={(e) => {
                const num = parseCurrency(e.target.value)
                setPedidosEmAberto(formatCurrency(num))
              }}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base font-medium">Cancelar</button>
          <button
            onClick={() =>
              onSave({
                nome,
                codigo,
                setor,
                metaMensal: parseCurrency(metaMensal),
                valorRealizado: parseCurrency(valorRealizado),
                pedidosEmAberto: parseCurrency(pedidosEmAberto),
              })
            }
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base font-medium"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

