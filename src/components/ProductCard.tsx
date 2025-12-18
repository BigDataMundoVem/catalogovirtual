'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { ZoomIn, Heart } from 'lucide-react'
import { isFavorite, toggleFavorite } from '@/lib/favorites'

interface ProductCardProps {
  product: Product
  onImageClick: (product: Product, imageIndex: number) => void
  onFavoriteChange?: () => void
}

export function ProductCard({ product, onImageClick, onFavoriteChange }: ProductCardProps) {
  const [favorite, setFavorite] = useState(false)
  const allImages = [product.image, ...(product.images || [])].filter(Boolean)
  const hasMultipleImages = allImages.length > 1

  useEffect(() => {
    setFavorite(isFavorite(product.id))
  }, [product.id])

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = toggleFavorite(product.id)
    setFavorite(result.isFavorite)
    onFavoriteChange?.()
  }

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200 cursor-pointer"
      onClick={() => onImageClick(product, 0)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
            favorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 p-2 rounded-full">
            <ZoomIn className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </div>
        </div>

        {/* Image count badge */}
        {hasMultipleImages && (
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
            {allImages.length}
          </div>
        )}
      </div>

      {/* Content - Compact */}
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
          {product.category.replace(/-/g, ' ').toUpperCase()}
        </span>
      </div>
    </div>
  )
}
