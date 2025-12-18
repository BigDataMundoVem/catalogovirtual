'use client'

import { useState, useMemo, useEffect } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'
import { ImageGallery } from '@/components/ImageGallery'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Package, SlidersHorizontal } from 'lucide-react'

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
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryProductName, setGalleryProductName] = useState('')
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)

  useEffect(() => {
    const loadData = async () => {
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
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        selectedCategory === '' || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('')
  }

  const hasActiveFilters = search || selectedCategory

  const handleImageClick = (product: Product, imageIndex: number) => {
    const allImages = [product.image, ...(product.images || [])].filter(Boolean)
    setGalleryImages(allImages)
    setGalleryProductName(product.name)
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
            </div>
            <a
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          {categories.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors sm:w-auto"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && categories.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Filtrar por Família</h2>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
                onImageClick={handleImageClick as any}
              />
            ))}
          </div>
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
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Catálogo de Produtos. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Image Gallery Modal */}
      <ImageGallery
        images={galleryImages}
        productName={galleryProductName}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryInitialIndex}
      />
    </div>
  )
}
