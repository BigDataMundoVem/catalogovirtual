'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured, uploadImage, deleteImage } from '@/lib/supabase'
import { isAuthenticated, isAdmin, logout, getCurrentUser, updatePassword, createUser, getLoginHistory, isLocalMode, getUsers, updateUserProfile, deleteUserProfile, blockUser } from '@/lib/auth'
import { getMonthlyGoal, setMonthlyGoal } from '@/lib/goals'
import {
  Plus, Pencil, Trash2, X, Package, ArrowLeft, Save,
  FolderOpen, Tag, LogOut, Settings, Upload, Users, History, AlertCircle, Sun, Moon, Target, Calendar
} from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import Image from 'next/image'
import Link from 'next/link'

// Local storage keys
const PRODUCTS_KEY = 'catalogo_products'
const CATEGORIES_KEY = 'catalogo_categories'

interface Product {
  id: string
  name: string
  description: string
  category_id: string
  image: string
  images: string[] | null
  created_at: string
}

interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

interface LoginHistoryEntry {
  id: string
  user_email: string
  logged_in_at: string
  user_agent: string | null
}

interface UserData {
  id: string
  email: string
  role: 'admin' | 'viewer' | 'blocked'
  full_name?: string | null
  is_sales_active?: boolean | null
}

export default function AdminPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'users' | 'history' | 'settings' | 'goals'>('products')
  const [userEmail, setUserEmail] = useState('')
  const [usingLocalMode, setUsingLocalMode] = useState(false)
  const [users, setUsers] = useState<UserData[]>([])

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
  })
  const [productImages, setProductImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '' })

  // User Modal
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', confirmPassword: '', role: 'viewer' as 'admin' | 'viewer' | 'blocked', name: '', isSalesActive: true })
  const [userMessage, setUserMessage] = useState({ type: '', text: '' })
  const [editUserModal, setEditUserModal] = useState<{ open: boolean; user: UserData | null }>({ open: false, user: null })
  const [editForm, setEditForm] = useState({ name: '', role: 'viewer' as 'admin' | 'viewer' | 'blocked', isSalesActive: true })
  const [editMessage, setEditMessage] = useState<{ type: '' | 'error' | 'success'; text: string }>({ type: '', text: '' })
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Goals Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedUserForGoal, setSelectedUserForGoal] = useState<UserData | null>(null)
  const [goalForm, setGoalForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    contacts: 0,
    quotes: 0,
    orders: 0
  })

  // Login History
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([])

  // Settings
  const [settingsForm, setSettingsForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const init = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return
      }

      // Verificar se é admin
      const adminStatus = await isAdmin()
      if (!adminStatus) {
        router.push('/')
        return
      }

      setUsingLocalMode(isLocalMode())

      const user = await getCurrentUser()
      if (user && 'email' in user) {
        setUserEmail(user.email || '')
      }

      await loadData()
      setMounted(true)
    }
    init()
  }, [router])

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'goals') {
      loadUsers()
    }
  }, [activeTab])

  const loadData = async () => {
    if (isSupabaseConfigured && supabase) {
      // Load from Supabase
      const { data: cats } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('name')
      if (cats) setCategories(cats)

      const { data: prods } = await (supabase as any)
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (prods) setProducts(prods)
    } else {
      // Load from localStorage
      const storedProducts = localStorage.getItem(PRODUCTS_KEY)
      const storedCategories = localStorage.getItem(CATEGORIES_KEY)

      if (storedProducts) setProducts(JSON.parse(storedProducts))
      if (storedCategories) setCategories(JSON.parse(storedCategories))
    }
  }
  
  const loadUsers = async () => {
    const fetchedUsers = await getUsers()
    setUsers(fetchedUsers)
  }

  const openEditUser = (user: UserData) => {
    setEditUserModal({ open: true, user })
    setEditForm({
      name: user.full_name || '',
      role: user.role,
      isSalesActive: user.is_sales_active ?? true
    })
    setEditMessage({ type: '', text: '' })
  }

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUserModal.user) return
    setEditMessage({ type: '', text: '' })

    const result = await updateUserProfile(editUserModal.user.id, {
      role: editForm.role,
      fullName: editForm.name,
      isSalesActive: editForm.isSalesActive
    })

    if (result.success) {
      setEditMessage({ type: 'success', text: 'Usuário atualizado!' })
      await loadUsers()
      setTimeout(() => setEditUserModal({ open: false, user: null }), 600)
    } else {
      setEditMessage({ type: 'error', text: result.error || 'Erro ao atualizar usuário' })
    }
  }

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Deseja excluir o usuário ${user.email || user.id}? Esta ação remove o perfil e a role, mas não exclui o auth user (requer service role).`)) {
      return
    }
    setDeletingUserId(user.id)
    const result = await deleteUserProfile(user.id)
    setDeletingUserId(null)
    if (!result.success) {
      alert(result.error || 'Erro ao excluir usuário')
      return
    }
    await loadUsers()
  }

  const handleToggleBlockUser = async (user: UserData) => {
    const blocked = user.role !== 'blocked'
    if (!confirm(`${blocked ? 'Bloquear' : 'Desbloquear'} o usuário ${user.email || user.id}?`)) return
    const result = await blockUser(user.id, blocked)
    if (!result.success) {
      alert(result.error || 'Erro ao atualizar bloqueio')
      return
    }
    await loadUsers()
  }

  const saveLocalData = (prods: Product[], cats: Category[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods))
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats))
  }

  const loadLoginHistory = async () => {
    const history = await getLoginHistory(100)
    setLoginHistory(history as LoginHistoryEntry[])
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Product functions
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploadingImages(true)

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Imagem "${file.name}" muito grande. Máximo 5MB.`)
        continue
      }

      const url = await uploadImage(file)
      if (url) {
        setProductImages(prev => [...prev, url])
      }
    }

    setUploadingImages(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = async (index: number) => {
    const url = productImages[index]
    if (url.includes('supabase')) {
      await deleteImage(url)
    }
    setProductImages(prev => prev.filter((_, i) => i !== index))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    setProductImages(prev => {
      const newImages = [...prev]
      const [movedImage] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, movedImage)
      return newImages
    })
  }

  const openNewProductModal = () => {
    setEditingProduct(null)
    setProductForm({ name: '', description: '', category_id: categories[0]?.id || '' })
    setProductImages([])
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
    })
    const allImages = [product.image, ...(product.images || [])].filter(Boolean)
    setProductImages(allImages)
    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setEditingProduct(null)
    setProductImages([])
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const mainImage = productImages[0] || 'https://via.placeholder.com/400'
    const additionalImages = productImages.slice(1)

    if (isSupabaseConfigured && supabase) {
      if (editingProduct) {
        await (supabase as any)
          .from('products')
          .update({
            name: productForm.name,
            description: productForm.description,
            category_id: productForm.category_id,
            image: mainImage,
            images: additionalImages.length > 0 ? additionalImages : null,
          })
          .eq('id', editingProduct.id)
      } else {
        await (supabase as any)
          .from('products')
          .insert({
            name: productForm.name,
            description: productForm.description,
            category_id: productForm.category_id,
            image: mainImage,
            images: additionalImages.length > 0 ? additionalImages : null,
          })
      }
      await loadData()
    } else {
      // Local mode
      const newProduct: Product = {
        id: editingProduct?.id || Date.now().toString(),
        name: productForm.name,
        description: productForm.description,
        category_id: productForm.category_id,
        image: mainImage,
        images: additionalImages.length > 0 ? additionalImages : null,
        created_at: editingProduct?.created_at || new Date().toISOString(),
      }

      let newProducts: Product[]
      if (editingProduct) {
        newProducts = products.map(p => p.id === editingProduct.id ? newProduct : p)
      } else {
        newProducts = [newProduct, ...products]
      }
      setProducts(newProducts)
      saveLocalData(newProducts, categories)
    }

    closeProductModal()
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      const product = products.find(p => p.id === id)
      if (product) {
        if (product.image.includes('supabase')) await deleteImage(product.image)
        if (product.images) {
          for (const img of product.images) {
            if (img.includes('supabase')) await deleteImage(img)
          }
        }
      }

      if (isSupabaseConfigured && supabase) {
        await (supabase as any).from('products').delete().eq('id', id)
        await loadData()
      } else {
        const newProducts = products.filter(p => p.id !== id)
        setProducts(newProducts)
        saveLocalData(newProducts, categories)
      }
    }
  }

  // Category functions
  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const openNewCategoryModal = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '' })
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name })
    setIsCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSupabaseConfigured && supabase) {
      if (editingCategory) {
        await (supabase as any)
          .from('categories')
          .update({ name: categoryForm.name, slug: generateSlug(categoryForm.name) })
          .eq('id', editingCategory.id)
      } else {
        await (supabase as any)
          .from('categories')
          .insert({ name: categoryForm.name, slug: generateSlug(categoryForm.name) })
      }
      await loadData()
    } else {
      // Local mode
      const newCategory: Category = {
        id: editingCategory?.id || Date.now().toString(),
        name: categoryForm.name,
        slug: generateSlug(categoryForm.name),
        created_at: editingCategory?.created_at || new Date().toISOString(),
      }

      let newCategories: Category[]
      if (editingCategory) {
        newCategories = categories.map(c => c.id === editingCategory.id ? newCategory : c)
      } else {
        newCategories = [...categories, newCategory]
      }
      setCategories(newCategories)
      saveLocalData(products, newCategories)
    }

    closeCategoryModal()
  }

  const handleDeleteCategory = async (id: string) => {
    const productsInCategory = products.filter(p => p.category_id === id).length
    if (productsInCategory > 0) {
      alert(`Não é possível excluir. Existem ${productsInCategory} produto(s) nesta família.`)
      return
    }
    if (confirm('Tem certeza que deseja excluir esta família?')) {
      if (isSupabaseConfigured && supabase) {
        await (supabase as any).from('categories').delete().eq('id', id)
        await loadData()
      } else {
        const newCategories = categories.filter(c => c.id !== id)
        setCategories(newCategories)
        saveLocalData(products, newCategories)
      }
    }
  }

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '-'

  const getProductImageCount = (product: Product) => 1 + (product.images?.length || 0)

  // User functions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserMessage({ type: '', text: '' })

    if (newUserForm.password !== newUserForm.confirmPassword) {
      setUserMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    if (newUserForm.password.length < 6) {
      setUserMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' })
      return
    }

    const result = await createUser(newUserForm.email, newUserForm.password, newUserForm.role, newUserForm.name, newUserForm.isSalesActive)

    if (result.success) {
      setUserMessage({ type: 'success', text: `Usuário ${newUserForm.role === 'admin' ? 'administrador' : 'visualizador'} criado! Verifique o email para confirmar.` })
      setNewUserForm({ email: '', password: '', confirmPassword: '', role: 'viewer', name: '', isSalesActive: true })
      loadUsers()
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Erro ao criar usuário' })
    }
  }

  // Goals functions
  const openGoalModal = async (user: UserData) => {
    setSelectedUserForGoal(user)
    // Try to load existing goal for current month
    const existing = await getMonthlyGoal(user.id, goalForm.month, goalForm.year)
    if (existing) {
      setGoalForm({
        ...goalForm,
        contacts: existing.target_contacts,
        quotes: existing.target_quotes,
        orders: existing.target_orders
      })
    } else {
      setGoalForm({
        ...goalForm,
        contacts: 0,
        quotes: 0,
        orders: 0
      })
    }
    setIsGoalModalOpen(true)
  }

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForGoal) return

    const result = await setMonthlyGoal(selectedUserForGoal.id, goalForm.month, goalForm.year, {
      contacts: goalForm.contacts,
      quotes: goalForm.quotes,
      orders: goalForm.orders
    })

    if (result.success) {
      setIsGoalModalOpen(false)
      alert('Meta salva com sucesso!')
    } else {
      alert('Erro ao salvar meta: ' + result.error)
    }
  }

  // Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsMessage({ type: '', text: '' })

    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      setSettingsMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    if (settingsForm.newPassword.length < 6) {
      setSettingsMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' })
      return
    }

    const result = await updatePassword(settingsForm.newPassword)

    if (result.success) {
      setSettingsMessage({ type: 'success', text: 'Senha atualizada com sucesso!' })
      setSettingsForm({ newPassword: '', confirmPassword: '' })
    } else {
      setSettingsMessage({ type: 'error', text: result.error || 'Erro ao atualizar senha' })
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <ArrowLeft className="h-5 w-5" /><span>Voltar</span>
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <Image src="/Logo.png" alt="Logo" width={32} height={32} className="object-contain" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{userEmail}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                <LogOut className="h-5 w-5" /><span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {usingLocalMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Modo local ativo. Configure o Supabase para dados persistentes e múltiplos usuários.</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Package className="h-5 w-5" /><span>Produtos ({products.length})</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FolderOpen className="h-5 w-5" /><span>Famílias ({categories.length})</span>
          </button>
          <button onClick={() => { setActiveTab('users'); loadUsers(); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Users className="h-5 w-5" /><span>Usuários</span>
          </button>
          <button onClick={() => { setActiveTab('goals'); loadUsers(); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'goals' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Target className="h-5 w-5" /><span>Metas</span>
          </button>
          <button onClick={() => { setActiveTab('history'); loadLoginHistory() }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <History className="h-5 w-5" /><span>Histórico</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Settings className="h-5 w-5" /><span>Configurações</span>
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Produtos</h2>
              <button onClick={openNewProductModal} disabled={categories.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                <Plus className="h-5 w-5" /><span>Novo Produto</span>
              </button>
            </div>
            {categories.length === 0 && (
              <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-100 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">Crie pelo menos uma família antes de adicionar produtos.</p>
              </div>
            )}
            {products.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                      {getProductImageCount(product) > 1 && (
                        <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded-tl">
                          {getProductImageCount(product)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{product.description}</p>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full mt-1 inline-block">{getCategoryName(product.category_id)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditProductModal(product)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Pencil className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum produto</h3>
                <p className="text-gray-500 dark:text-gray-400">{categories.length === 0 ? 'Crie uma família primeiro.' : 'Adicione seu primeiro produto.'}</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Famílias</h2>
              <button onClick={openNewCategoryModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>Nova Família</span>
              </button>
            </div>
            {categories.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => {
                  const productCount = products.filter(p => p.category_id === category.id).length
                  return (
                    <div key={category.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center"><Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                      <div className="flex-1"><h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{productCount} produto{productCount !== 1 ? 's' : ''}</p></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditCategoryModal(category)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Pencil className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma família</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Crie famílias para organizar produtos.</p>
                <button onClick={openNewCategoryModal} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="h-5 w-5" /><span>Criar Família</span></button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && !usingLocalMode && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Criar Novo Usuário</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-w-md">
              {userMessage.text && <div className={`p-3 rounded-lg text-sm ${userMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>{userMessage.text}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input type="text" required value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Ex: Maria Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" required value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="novo@usuario.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <input type="password" required value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Senha</label>
                <input type="password" required value={newUserForm.confirmPassword} onChange={(e) => setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Usuário</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="viewer"
                      checked={newUserForm.role === 'viewer'}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'admin' | 'viewer' | 'blocked' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Visualizador</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newUserForm.role === 'admin'}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'admin' | 'viewer' | 'blocked' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Administrador</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="blocked"
                      checked={newUserForm.role === 'blocked'}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'admin' | 'viewer' | 'blocked' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Bloqueado</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={newUserForm.isSalesActive}
                      onChange={(e) => setNewUserForm({ ...newUserForm, isSalesActive: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Participa das Metas (Comercial)</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Se marcado, aparecerá no dashboard de vendas</span>
                  </div>
                </label>
              </div>

              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="h-4 w-4" /><span>Criar Usuário</span></button>
            </form>
          </div>
        )}

        {/* Users List */}
        {activeTab === 'users' && !usingLocalMode && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Usuários cadastrados</h3>
            {users.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuário carregado.</p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{u.full_name || u.email || 'Usuário'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email || 'Email desconhecido'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        u.role === 'blocked'
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800'
                          : u.is_sales_active
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}>
                        {u.role === 'blocked' ? 'Bloqueado' : u.is_sales_active ? 'Participa das metas' : 'Fora das metas'}
                      </span>
                      <button
                        onClick={() => openEditUser(u)}
                        className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleBlockUser(u)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          u.role === 'blocked'
                            ? 'border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                            : 'border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                        }`}
                      >
                        {u.role === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingUserId === u.id}
                        className="text-sm px-3 py-1.5 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-60"
                      >
                        {deletingUserId === u.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && !usingLocalMode && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Metas de Vendedores</h2>
            </div>
            
            {users.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                    </div>
                    <button 
                      onClick={() => openGoalModal(user)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Target className="h-4 w-4" />
                      Definir Metas
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                Carregando usuários...
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Logins</h2>
            </div>
            {loginHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data/Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Navegador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loginHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{entry.user_email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(entry.logged_in_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {entry.user_agent?.split(' ')[0] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum registro</h3>
                <p className="text-gray-500 dark:text-gray-400">O histórico de logins aparecerá aqui.</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alterar Senha</h2></div>
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 max-w-md">
              {settingsMessage.text && <div className={`p-3 rounded-lg text-sm ${settingsMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>{settingsMessage.text}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
                <input type="password" required value={settingsForm.newPassword} onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nova Senha</label>
                <input type="password" required value={settingsForm.confirmPassword} onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="h-4 w-4" /><span>Salvar</span></button>
            </form>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeProductModal} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={closeProductModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
                  <textarea required rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Família *</label>
                  <select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Selecione</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagens ({productImages.length})
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">- A primeira é a principal</span>
                  </label>

                  {productImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {productImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}>
                            <Image src={img} alt={`Imagem ${index + 1}`} fill className="object-cover" />
                          </div>
                          {index === 0 && (
                            <span className="absolute -top-1 -left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">Principal</span>
                          )}
                          <button type="button" onClick={() => removeImage(index)} className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                            <X className="h-3 w-3" />
                          </button>
                          {index > 0 && (
                            <button type="button" onClick={() => moveImage(index, 0)} className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                              Principal
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <label className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingImages ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">{uploadingImages ? 'Enviando...' : 'Clique para enviar imagens'}</span>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeProductModal} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="h-4 w-4" /><span>Salvar</span></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeCategoryModal} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editingCategory ? 'Editar Família' : 'Nova Família'}</h2>
                <button onClick={closeCategoryModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label><input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Ex: Eletrônicos" /></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeCategoryModal} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="h-4 w-4" /><span>Salvar</span></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && selectedUserForGoal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsGoalModalOpen(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Definir Metas</h2>
                <button onClick={() => setIsGoalModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
              
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Usuário: <span className="font-medium text-gray-900 dark:text-white">{selectedUserForGoal.email}</span>
              </div>

              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mês</label>
                    <select 
                      value={goalForm.month} 
                      onChange={(e) => setGoalForm({...goalForm, month: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ano</label>
                    <input 
                      type="number" 
                      value={goalForm.year} 
                      onChange={(e) => setGoalForm({...goalForm, year: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta de Contatos</label>
                    <input 
                      type="number" 
                      min="0"
                      value={goalForm.contacts} 
                      onChange={(e) => setGoalForm({...goalForm, contacts: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta de Orçamentos</label>
                    <input 
                      type="number" 
                      min="0"
                      value={goalForm.quotes} 
                      onChange={(e) => setGoalForm({...goalForm, quotes: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta de Pedidos</label>
                    <input 
                      type="number" 
                      min="0"
                      value={goalForm.orders} 
                      onChange={(e) => setGoalForm({...goalForm, orders: parseInt(e.target.value)})} 
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsGoalModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="h-4 w-4" /><span>Salvar Metas</span></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal.open && editUserModal.user && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setEditUserModal({ open: false, user: null })} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Usuário</h2>
                <button onClick={() => setEditUserModal({ open: false, user: null })} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-4">
                {editMessage.text && (
                  <div className={`p-3 rounded-lg text-sm ${editMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                    {editMessage.text}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Usuário</label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editRole"
                        value="viewer"
                        checked={editForm.role === 'viewer'}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'viewer' | 'blocked' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Visualizador</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editRole"
                        value="admin"
                        checked={editForm.role === 'admin'}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'viewer' | 'blocked' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Administrador</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editRole"
                        value="blocked"
                        checked={editForm.role === 'blocked'}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'viewer' | 'blocked' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Bloqueado</span>
                    </label>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={editForm.isSalesActive}
                        onChange={(e) => setEditForm({ ...editForm, isSalesActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Participa das Metas (Comercial)</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Se marcado, aparecerá no dashboard de vendas</span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditUserModal({ open: false, user: null })} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Save className="h-4 w-4" />
                    <span>Salvar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}