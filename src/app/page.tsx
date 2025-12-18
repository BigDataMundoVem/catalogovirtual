'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import { SearchBar } from '@/components/SearchBar'
import { ImageGallery } from '@/components/ImageGallery'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Package, Menu, X, FolderOpen, Heart, ChevronLeft, ChevronRight, LogOut, Settings } from 'lucide-react'
import { getFavorites } from '@/lib/favorites'
import { isAuthenticated, isAdmin, logout } from '@/lib/auth'
import Image from 'next/image'

// Local storage keys
const PRODUCTS_KEY = 'catalogo_products'
const CATEGORIES_KEY = 'catalogo_categories'

interface Product {
  id: string
  name: string
  description: string
  category: string
  image: string
  images?: string[]
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function CatalogPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const productsPerPage = 24

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryProductName, setGalleryProductName] = useState('')
  const [galleryProductDescription, setGalleryProductDescription] = useState('')
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/login')
        return false
      }
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)
      return true
    }

    const loadData = async () => {
      const authOk = await checkAuth()
      if (!authOk) return

      if (isSupabaseConfigured && supabase) {
        // Load from Supabase
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (cats) {
          setCategories(cats.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug
          })))
        }

        const { data: prods } = await supabase
          .from('products')
          .select('*, categories(slug)')
          .order('created_at', { ascending: false })

        if (prods) {
          setProducts(prods.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: (p.categories as any)?.slug || '',
            image: p.image,
            images: p.images || undefined
          })))
        }
      } else {
        // Load from localStorage
        const storedProducts = localStorage.getItem(PRODUCTS_KEY)
        const storedCategories = localStorage.getItem(CATEGORIES_KEY)

        if (storedCategories) {
          const cats = JSON.parse(storedCategories)
          setCategories(cats)
        }

        if (storedProducts) {
          const prods = JSON.parse(storedProducts)
          const cats = storedCategories ? JSON.parse(storedCategories) : []
          setProducts(prods.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: cats.find((c: any) => c.id === p.category_id)?.slug || '',
            image: p.image,
            images: p.images || undefined
          })))
        }
      }

      setIsLoading(false)
    }

    loadData()
    setFavorites(getFavorites())
  }, [])

  const refreshFavorites = () => {
    setFavorites(getFavorites())
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        selectedCategory === '' || product.category === selectedCategory

      const matchesFavorites = !showFavorites || favorites.includes(product.id)

      return matchesSearch && matchesCategory && matchesFavorites
    })
  }, [products, search, selectedCategory, showFavorites, favorites])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage
    return filteredProducts.slice(startIndex, startIndex + productsPerPage)
  }, [filteredProducts, currentPage, productsPerPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, showFavorites])

  const getProductCount = (slug: string) => {
    return products.filter(p => p.category === slug).length
  }

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug)
    setShowFavorites(false)
    setSidebarOpen(false)
  }

  const handleFavoritesClick = () => {
    setShowFavorites(true)
    setSelectedCategory('')
    setSidebarOpen(false)
  }

  const handleImageClick = (product: Product, imageIndex: number) => {
    const allImages = [product.image, ...(product.images || [])].filter(Boolean)
    setGalleryImages(allImages)
    setGalleryProductName(product.name)
    setGalleryProductDescription(product.description)
    setGalleryInitialIndex(imageIndex)
    setGalleryOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-2">
                <Image src="/Logo.png" alt="Logo" width={40} height={40} className="object-contain" />
                <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userIsAdmin && (
                <a
                  href="/admin"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </a>
              )}
              <button
                onClick={async () => {
                  await logout()
                  router.push('/login')
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 lg:top-[73px] left-0 z-40 lg:z-10
            w-72 h-screen lg:h-[calc(100vh-73px)]
            bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            overflow-y-auto
          `}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Famílias</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Categories list */}
          <nav className="p-4">
            <h2 className="hidden lg:block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Famílias
            </h2>

            <ul className="space-y-1">
              {/* All products */}
              <li>
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left
                    transition-colors
                    ${selectedCategory === '' && !showFavorites
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    <span>Todos os Produtos</span>
                  </div>
                  <span className={`text-sm ${selectedCategory === '' && !showFavorites ? 'text-blue-600' : 'text-gray-400'}`}>
                    {products.length}
                  </span>
                </button>
              </li>

              {/* Favorites */}
              <li>
                <button
                  onClick={handleFavoritesClick}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left
                    transition-colors
                    ${showFavorites
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Heart className={`h-5 w-5 ${showFavorites ? 'fill-current' : ''}`} />
                    <span>Favoritos</span>
                  </div>
                  <span className={`text-sm ${showFavorites ? 'text-red-600' : 'text-gray-400'}`}>
                    {favorites.length}
                  </span>
                </button>
              </li>

              {/* Separator */}
              {categories.length > 0 && (
                <li className="py-2">
                  <div className="border-t border-gray-200" />
                </li>
              )}

              {/* Category items */}
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => handleCategorySelect(category.slug)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left
                      transition-colors
                      ${selectedCategory === category.slug && !showFavorites
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5" />
                      <span>{category.name}</span>
                    </div>
                    <span className={`text-sm ${selectedCategory === category.slug ? 'text-blue-600' : 'text-gray-400'}`}>
                      {getProductCount(category.slug)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Search */}
          <div className="mb-6">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {showFavorites
                  ? 'Favoritos'
                  : selectedCategory
                    ? categories.find(c => c.slug === selectedCategory)?.name || 'Produtos'
                    : 'Todos os Produtos'
                }
              </h2>
              <p className="text-sm text-gray-500">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as any}
                    onImageClick={handleImageClick as any}
                    onFavoriteChange={refreshFavorites}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {products.length === 0
                  ? 'Adicione produtos no painel admin.'
                  : 'Tente ajustar os filtros ou fazer uma nova busca.'}
              </p>
              {(search || selectedCategory) && (
                <button
                  onClick={() => { setSearch(''); setSelectedCategory(''); }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Catálogo de Produtos. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Image Gallery Modal */}
      <ImageGallery
        images={galleryImages}
        productName={galleryProductName}
        productDescription={galleryProductDescription}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryInitialIndex}
      />
    </div>
  )
}
