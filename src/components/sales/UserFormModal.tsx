import React from 'react'
import { ChannelName, UserEntry } from './useSalesCalculations'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<UserEntry, 'id' | 'valorRealizado' | 'pedidosEmAberto'>) => void
  initial?: UserEntry | null
  channel: ChannelName
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, onSave, initial, channel }) => {
  const [nome, setNome] = React.useState(initial?.nome || '')
  const [codigo, setCodigo] = React.useState(String(initial?.codigo ?? ''))
  const [setor, setSetor] = React.useState<ChannelName>(initial?.setor || channel)
  const [metaMensal, setMetaMensal] = React.useState(String(initial?.metaMensal ?? '0'))
  const [valorRealizado, setValorRealizado] = React.useState(String(initial?.valorRealizado ?? '0'))
  const [pedidosEmAberto, setPedidosEmAberto] = React.useState(String(initial?.pedidosEmAberto ?? '0'))

  React.useEffect(() => {
    setNome(initial?.nome || '')
    setCodigo(String(initial?.codigo ?? ''))
    setSetor(initial?.setor || channel)
    setMetaMensal(String(initial?.metaMensal ?? '0'))
    setValorRealizado(String(initial?.valorRealizado ?? '0'))
    setPedidosEmAberto(String(initial?.pedidosEmAberto ?? '0'))
  }, [initial, channel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{initial ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Fechar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              type="number"
              min="0"
              step="0.01"
              value={metaMensal}
              onChange={(e) => setMetaMensal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Realizado (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorRealizado}
              onChange={(e) => setValorRealizado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pedidos em Aberto (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pedidosEmAberto}
              onChange={(e) => setPedidosEmAberto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button
            onClick={() =>
              onSave({
                nome,
                codigo,
                setor,
                metaMensal: parseFloat(metaMensal || '0'),
                valorRealizado: parseFloat(valorRealizado || '0'),
                pedidosEmAberto: parseFloat(pedidosEmAberto || '0'),
              })
            }
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

