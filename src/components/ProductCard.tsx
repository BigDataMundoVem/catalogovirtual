'use client'

import Image from 'next/image'
import { Product } from '@/lib/types'
import { ZoomIn } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onImageClick: (product: Product, imageIndex: number) => void
}

export function ProductCard({ product, onImageClick }: ProductCardProps) {
  const allImages = [product.image, ...(product.images || [])].filter(Boolean)
  const hasMultipleImages = allImages.length > 1

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => onImageClick(product, 0)}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-2 rounded-full">
            <ZoomIn className="h-5 w-5 text-gray-700" />
          </div>
        </div>

        {/* Image count badge */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1">
            <span>{allImages.length} fotos</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <div className="flex gap-1 p-2 border-b border-gray-100">
          {allImages.slice(0, 4).map((img, index) => (
            <button
              key={index}
              onClick={() => onImageClick(product, index)}
              className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
            >
              <Image
                src={img}
                alt={`${product.name} - Foto ${index + 1}`}
                fill
                className="object-cover"
                sizes="40px"
              />
              {index === 3 && allImages.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+{allImages.length - 4}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
          {product.category.replace('-', ' ')}
        </span>
        <h3 className="mt-1 text-lg font-semibold text-gray-900 line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-3">
          {product.description}
        </p>
      </div>
    </div>
  )
}
