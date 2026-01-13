'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { ChannelName, UserEntry, useSalesCalculations } from '@/components/sales/useSalesCalculations'
import { TableHeaderGrouped, ChannelRow, ChannelFooter } from '@/components/sales/ChannelComponents'
import { UserFormModal } from '@/components/sales/UserFormModal'

type ChannelKey = 'consumo' | 'revenda' | 'cozinhas'

const CHANNELS: { key: ChannelKey; label: ChannelName }[] = [
  { key: 'consumo', label: 'Consumo' },
  { key: 'revenda', label: 'Revenda' },
  { key: 'cozinhas', label: 'Cozinhas Industriais' },
]

type ChannelState = Record<ChannelKey, UserEntry[]>

const initialData: ChannelState = {
  consumo: [
    { id: 'c1', nome: 'Renata', codigo: 65, setor: 'Consumo', metaMensal: 280000, valorRealizado: 234893.26, pedidosEmAberto: 30519.04 },
    { id: 'c2', nome: 'Andrey', codigo: 67, setor: 'Consumo', metaMensal: 150000, valorRealizado: 1430.14, pedidosEmAberto: 5332.99 },
    { id: 'c3', nome: 'Glaucia', codigo: 66, setor: 'Consumo', metaMensal: 50000, valorRealizado: 20876.97, pedidosEmAberto: 0 },
    { id: 'c4', nome: 'Amadeu', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 2440.43, pedidosEmAberto: 0 },
    { id: 'c5', nome: 'Aparecido', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 515.93 },
    { id: 'c6', nome: 'Luiz', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c7', nome: 'Carlos', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
    { id: 'c8', nome: 'Abilio', codigo: '', setor: 'Consumo', metaMensal: 20000, valorRealizado: 0, pedidosEmAberto: 0 },
  ],
  revenda: [
    { id: 'r1', nome: 'Marcio', codigo: 18, setor: 'Revenda', metaMensal: 300000, valorRealizado: 115511.72, pedidosEmAberto: 14843.82 },
    { id: 'r2', nome: 'Sergio', codigo: 19, setor: 'Revenda', metaMensal: 100000, valorRealizado: 63485.84, pedidosEmAberto: 25161.46 },
    { id: 'r3', nome: 'Jose Geraldo', codigo: 22, setor: 'Revenda', metaMensal: 50000, valorRealizado: 5523.91, pedidosEmAberto: 18139.57 },
    { id: 'r4', nome: 'Fernanda', codigo: 63, setor: 'Revenda', metaMensal: 200000, valorRealizado: 131566.12, pedidosEmAberto: 5832.11 },
    { id: 'r5', nome: 'Glaucia', codigo: 66, setor: 'Revenda', metaMensal: 50000, valorRealizado: 20876.97, pedidosEmAberto: 3399.80 },
  ],
  cozinhas: [
    { id: 'i1', nome: 'Livia - Sodexo', codigo: 16, setor: 'Cozinhas Industriais', metaMensal: 450000, valorRealizado: 497186.19, pedidosEmAberto: 0 },
    { id: 'i2', nome: 'Marcelo - GRSA', codigo: 17, setor: 'Cozinhas Industriais', metaMensal: 400000, valorRealizado: 257710.77, pedidosEmAberto: 0 },
    { id: 'i3', nome: 'Sapore', codigo: 3, setor: 'Cozinhas Industriais', metaMensal: 340000, valorRealizado: 181960.57, pedidosEmAberto: 0 },
  ],
}

export default function SalesAndBillingPage() {
  const [activeTab, setActiveTab] = useState<ChannelKey>('consumo')
  const [data, setData] = useState<ChannelState>(initialData)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<{ channel: ChannelKey; user: UserEntry | null }>({ channel: 'consumo', user: null })

  const { ranked, totals } = useSalesCalculations(data[activeTab])

  const channelLabel = useMemo(() => CHANNELS.find((c) => c.key === activeTab)?.label || 'Consumo', [activeTab])

  const handleSaveUser = (payload: Omit<UserEntry, 'id'> & { valorRealizado: number; pedidosEmAberto: number }) => {
    setData((prev) => {
      const list = prev[activeTab]
      if (editUser.user) {
        return {
          ...prev,
          [activeTab]: list.map((u) =>
            u.id === editUser.user?.id
              ? {
                  ...u,
                  nome: payload.nome,
                  codigo: payload.codigo,
                  setor: payload.setor,
                  metaMensal: payload.metaMensal,
                  valorRealizado: payload.valorRealizado,
                  pedidosEmAberto: payload.pedidosEmAberto,
                }
              : u
          ),
        }
      }
      const newUser: UserEntry = {
        id: `${activeTab}-${Date.now()}`,
        nome: payload.nome,
        codigo: payload.codigo,
        setor: payload.setor,
        metaMensal: payload.metaMensal,
        valorRealizado: payload.valorRealizado,
        pedidosEmAberto: payload.pedidosEmAberto,
      }
      return { ...prev, [activeTab]: [...list, newUser] }
    })
    setModalOpen(false)
    setEditUser({ channel: activeTab, user: null })
  }

  const handleDeleteUser = (id: string) => {
    setData((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((u) => u.id !== id) }))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Header fixo */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">Vendas &amp; Faturamento</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dashboard executivo de acompanhamento</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditUser({ channel: activeTab, user: null })
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo usuário
          </button>
        </div>
      </header>

      {/* Conteúdo principal - largura total */}
      <main className="w-full px-4 lg:px-6 py-4">
        {/* Abas dos canais */}
        <div className="flex gap-2 mb-4">
          {CHANNELS.map((ch) => (
            <button
              key={ch.key}
              onClick={() => setActiveTab(ch.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                activeTab === ch.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Card da tabela */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Cabeçalho do card */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{channelLabel}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ranking por % realizado da meta</p>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {ranked.length} usuário{ranked.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Tabela executiva - SEM overflow-x-auto */}
          <div className="w-full">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <TableHeaderGrouped />
              <tbody>
                {ranked.map((u, idx) => (
                  <ChannelRow
                    key={u.id}
                    user={u}
                    index={idx}
                    onEdit={(user) => {
                      setEditUser({ channel: activeTab, user })
                      setModalOpen(true)
                    }}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </tbody>
              <ChannelFooter totals={totals} />
            </table>
          </div>
        </div>
      </main>

      {/* Modal de criação/edição */}
      <UserFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditUser({ channel: activeTab, user: null })
        }}
        onSave={handleSaveUser}
        initial={editUser.user}
        channel={channelLabel}
      />
    </div>
  )
}
