'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ImageGallery({ images, productName, isOpen, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  // Download image
  const handleDownload = useCallback(async () => {
    const imageUrl = images[currentIndex]
    const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${currentIndex + 1}.jpg`

    try {
      // For base64 images
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // For external URLs - fetch and create blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }, [images, currentIndex, productName])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, goToPrevious, goToNext])

  if (!isOpen || images.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Top buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleDownload}
          className="p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          title="Baixar imagem"
        >
          <Download className="h-6 w-6" />
        </button>
        <button
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          title="Fechar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/40 text-white text-sm rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main image */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 md:p-16">
        <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
          <Image
            src={images[currentIndex]}
            alt={`${productName} - Imagem ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/40 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black/40'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`Miniatura ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Product name */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 text-center">
        <h3 className="text-white text-lg font-medium px-4 py-2 bg-black/40 rounded-lg">
          {productName}
        </h3>
      </div>
    </div>
  )
}

// Thumbnail gallery for product card
interface ProductThumbnailsProps {
  images: string[]
  onImageClick: (index: number) => void
}

export function ProductThumbnails({ images, onImageClick }: ProductThumbnailsProps) {
  if (images.length <= 1) return null

  return (
    <div className="flex gap-1 mt-2">
      {images.slice(0, 4).map((img, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation()
            onImageClick(index)
          }}
          className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
        >
          <Image
            src={img}
            alt={`Miniatura ${index + 1}`}
            fill
            className="object-cover"
            sizes="40px"
          />
          {index === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-xs font-medium">+{images.length - 4}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
