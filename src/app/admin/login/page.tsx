'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirecionar para a página de login principal
export default function AdminLoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
