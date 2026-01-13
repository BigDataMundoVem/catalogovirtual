'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, FileSpreadsheet, Filter, Loader2 } from 'lucide-react'
import { isAuthenticated, getCurrentUser, isAdmin } from '@/lib/auth'
import { createSaleEntry, listSaleEntries, SaleEntry } from '@/lib/sales'

type FormState = {
  date: string
  client: string
  origin: string
  status: string
  orderNumber: string
  amountSold: string
  amountInvoiced: string
  observation: string
}

export default function VendasPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [entries, setEntries] = useState<SaleEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().split('T')[0],
    client: '',
    origin: '',
    status: '',
    orderNumber: '',
    amountSold: '',
    amountInvoiced: '',
    observation: '',
  })

  useEffect(() => {
    const init = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return
      }
      const admin = await isAdmin()
      setUserIsAdmin(admin)
      const user = await getCurrentUser()
      setUserId((user as any)?.id || null)
      setMounted(true)
    }
    init()
  }, [router])

  useEffect(() => {
    if (mounted) {
      loadEntries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  const loadEntries = async () => {
    if (!mounted) return
    setLoading(true)
    const data = await listSaleEntries({ admin: userIsAdmin, userId })
    setEntries(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const amountSold = parseFloat(form.amountSold || '0')
    const amountInvoiced = parseFloat(form.amountInvoiced || '0')

    const payload = {
      user_id: userId,
      entry_date: form.date,
      client: form.client,
      origin: form.origin,
      status: form.status,
      order_number: form.orderNumber,
      amount_sold: amountSold,
      amount_invoiced: amountInvoiced,
      observation: form.observation || null,
    }

    const result = await createSaleEntry(payload as any)
    setSaving(false)

    if (result.success) {
      setForm({
        date: new Date().toISOString().split('T')[0],
        client: '',
        origin: '',
        status: '',
        orderNumber: '',
        amountSold: '',
        amountInvoiced: '',
        observation: '',
      })
      loadEntries()
    } else {
      alert(result.error || 'Erro ao salvar')
    }
  }

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.sold += e.amount_sold || 0
        acc.invoiced += e.amount_invoiced || 0
        return acc
      },
      { sold: 0, invoiced: 0 }
    )
  }, [entries])

  const toInvoice = totals.sold - totals.invoiced

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Vendas &amp; Faturamento</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lance pedidos, valores faturados e acompanhe saldo a faturar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Valor vendido</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totals.sold.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Faturado</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totals.invoiced.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">A faturar / Saldo</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {toInvoice.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lançar venda</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os valores conforme a planilha.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Filter className="h-4 w-4" />
              Dados são filtrados por usuário; admins veem todos.
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Cliente"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Origem"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Novo / Inativo</label>
              <input
                type="text"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Novo ou Inativo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do Pedido</label>
              <input
                type="text"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Vendido (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountSold}
                onChange={(e) => setForm({ ...form, amountSold: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Faturado (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountInvoiced}
                onChange={(e) => setForm({ ...form, amountInvoiced: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação</label>
              <textarea
                value={form.observation}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={2}
                placeholder="Notas adicionais"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registros</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{entries.length} lançamentos</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhum lançamento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Pedido</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Origem</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Vendido</th>
                    <th className="px-4 py-3 text-right">Faturado</th>
                    <th className="px-4 py-3 text-right">A faturar</th>
                    {userIsAdmin && <th className="px-4 py-3 text-left">Usuário</th>}
                    <th className="px-4 py-3 text-left">Obs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {entries.map((e) => {
                    const toInv = (e.amount_sold || 0) - (e.amount_invoiced || 0)
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">{new Date(e.entry_date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3">{e.order_number || '-'}</td>
                        <td className="px-4 py-3">{e.client}</td>
                        <td className="px-4 py-3">{e.origin || '-'}</td>
                        <td className="px-4 py-3">{e.status || '-'}</td>
                        <td className="px-4 py-3 text-right">R$ {e.amount_sold.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">R$ {e.amount_invoiced.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">R$ {toInv.toFixed(2)}</td>
                        {userIsAdmin && <td className="px-4 py-3">{e.user_name || e.user_email || '-'}</td>}
                        <td className="px-4 py-3 max-w-xs truncate">{e.observation || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


