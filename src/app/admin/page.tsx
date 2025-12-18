'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured, uploadImage, deleteImage } from '@/lib/supabase'
import { isAuthenticated, logout, getCurrentUser, updatePassword, createUser, getLoginHistory, isLocalMode } from '@/lib/auth'
import {
  Plus, Pencil, Trash2, X, Package, ArrowLeft, Save,
  FolderOpen, Tag, LogOut, Settings, Upload, Users, History, AlertCircle
} from 'lucide-react'
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

export default function AdminPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'users' | 'history' | 'settings'>('products')
  const [userEmail, setUserEmail] = useState('')
  const [usingLocalMode, setUsingLocalMode] = useState(false)

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
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [userMessage, setUserMessage] = useState({ type: '', text: '' })

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
        router.push('/admin/login')
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

  const loadData = async () => {
    if (isSupabaseConfigured && supabase) {
      // Load from Supabase
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (cats) setCategories(cats)

      const { data: prods } = await supabase
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
    router.push('/admin/login')
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
        await supabase
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
        await supabase
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
        await supabase.from('products').delete().eq('id', id)
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
        await supabase
          .from('categories')
          .update({ name: categoryForm.name, slug: generateSlug(categoryForm.name) })
          .eq('id', editingCategory.id)
      } else {
        await supabase
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
        await supabase.from('categories').delete().eq('id', id)
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

    const result = await createUser(newUserForm.email, newUserForm.password)

    if (result.success) {
      setUserMessage({ type: 'success', text: 'Usuário criado! Verifique o email para confirmar.' })
      setNewUserForm({ email: '', password: '', confirmPassword: '' })
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Erro ao criar usuário' })
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" /><span>Voltar</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <LogOut className="h-5 w-5" /><span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {usingLocalMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Modo local ativo. Configure o Supabase para dados persistentes e múltiplos usuários.</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            <Package className="h-5 w-5" /><span>Produtos ({products.length})</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            <FolderOpen className="h-5 w-5" /><span>Famílias ({categories.length})</span>
          </button>
          {!usingLocalMode && (
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
              <Users className="h-5 w-5" /><span>Usuários</span>
            </button>
          )}
          <button onClick={() => { setActiveTab('history'); loadLoginHistory() }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            <History className="h-5 w-5" /><span>Histórico</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            <Settings className="h-5 w-5" /><span>Configurações</span>
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Produtos</h2>
              <button onClick={openNewProductModal} disabled={categories.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                <Plus className="h-5 w-5" /><span>Novo Produto</span>
              </button>
            </div>
            {categories.length === 0 && (
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
                <p className="text-yellow-800 text-sm">Crie pelo menos uma família antes de adicionar produtos.</p>
              </div>
            )}
            {products.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                      {getProductImageCount(product) > 1 && (
                        <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded-tl">
                          {getProductImageCount(product)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{product.description}</p>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full mt-1 inline-block">{getCategoryName(product.category_id)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditProductModal(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto</h3>
                <p className="text-gray-500">{categories.length === 0 ? 'Crie uma família primeiro.' : 'Adicione seu primeiro produto.'}</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Famílias</h2>
              <button onClick={openNewCategoryModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>Nova Família</span>
              </button>
            </div>
            {categories.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {categories.map((category) => {
                  const productCount = products.filter(p => p.category_id === category.id).length
                  return (
                    <div key={category.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Tag className="h-5 w-5 text-blue-600" /></div>
                      <div className="flex-1"><h3 className="font-medium text-gray-900">{category.name}</h3><p className="text-sm text-gray-500">{productCount} produto{productCount !== 1 ? 's' : ''}</p></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditCategoryModal(category)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma família</h3>
                <p className="text-gray-500 mb-4">Crie famílias para organizar produtos.</p>
                <button onClick={openNewCategoryModal} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="h-5 w-5" /><span>Criar Família</span></button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && !usingLocalMode && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Criar Novo Usuário</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-w-md">
              {userMessage.text && <div className={`p-3 rounded-lg text-sm ${userMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{userMessage.text}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="novo@usuario.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input type="password" required value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <input type="password" required value={newUserForm.confirmPassword} onChange={(e) => setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="h-4 w-4" /><span>Criar Usuário</span></button>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Histórico de Logins</h2>
            </div>
            {loginHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Navegador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loginHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{entry.user_email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(entry.logged_in_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {entry.user_agent?.split(' ')[0] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro</h3>
                <p className="text-gray-500">O histórico de logins aparecerá aqui.</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Alterar Senha</h2></div>
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 max-w-md">
              {settingsMessage.text && <div className={`p-3 rounded-lg text-sm ${settingsMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{settingsMessage.text}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <input type="password" required value={settingsForm.newPassword} onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                <input type="password" required value={settingsForm.confirmPassword} onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={closeProductModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                  <textarea required rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Família *</label>
                  <select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagens ({productImages.length})
                    <span className="text-gray-400 font-normal ml-1">- A primeira é a principal</span>
                  </label>

                  {productImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {productImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}>
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

                  <label className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingImages ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">{uploadingImages ? 'Enviando...' : 'Clique para enviar imagens'}</span>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeProductModal} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
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
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{editingCategory ? 'Editar Família' : 'Nova Família'}</h2>
                <button onClick={closeCategoryModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Eletrônicos" /></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeCategoryModal} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="h-4 w-4" /><span>Salvar</span></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
