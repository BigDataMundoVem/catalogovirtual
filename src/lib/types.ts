export interface Product {
  id: string
  name: string
  description: string
  category: string
  image: string
  images?: string[]  // Galeria de imagens adicionais
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
}
