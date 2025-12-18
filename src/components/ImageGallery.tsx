'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download, Share2, MessageCircle, Link2, Check } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
  productDescription?: string
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ImageGallery({ images, productName, productDescription, isOpen, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

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
      window.open(imageUrl, '_blank')
    }
  }, [images, currentIndex, productName])

  // Share via WhatsApp
  const shareWhatsApp = useCallback(() => {
    const text = `${productName}${productDescription ? '\n\n' + productDescription : ''}\n\n${window.location.href}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setShowShareMenu(false)
  }, [productName, productDescription])

  // Copy link
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => {
        setLinkCopied(false)
        setShowShareMenu(false)
      }, 1500)
    } catch {
      setShowShareMenu(false)
    }
  }, [])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/60 hover:text-white transition-colors"
        title="Fechar (ESC)"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Action buttons - top right */}
      <div className="absolute top-4 right-14 z-10 flex items-center gap-2">
        {/* Share button */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Compartilhar</span>
          </button>

          {/* Share menu dropdown */}
          {showShareMenu && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[160px]">
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t dark:border-gray-700"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Baixar</span>
        </button>
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main image */}
      <div className="relative w-full h-full flex items-center justify-center p-4 pb-32">
        <div className="relative w-full h-full max-w-5xl max-h-[70vh]">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Bottom info - centered below image */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
        <div className="text-center">
          <h3 className="text-white font-medium text-lg mb-1">{productName}</h3>
          {productDescription && (
            <p className="text-white/70 text-sm max-w-2xl mx-auto">{productDescription}</p>
          )}

          {/* Thumbnails - centered */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative w-12 h-12 rounded overflow-hidden transition-all ${
                    index === currentIndex
                      ? 'ring-2 ring-white'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
