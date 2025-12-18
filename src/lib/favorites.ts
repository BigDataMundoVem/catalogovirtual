// Favorites management using localStorage

const FAVORITES_KEY = 'catalogo_favorites'

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(FAVORITES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addFavorite(productId: string): string[] {
  const favorites = getFavorites()
  if (!favorites.includes(productId)) {
    favorites.push(productId)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }
  return favorites
}

export function removeFavorite(productId: string): string[] {
  const favorites = getFavorites().filter(id => id !== productId)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  return favorites
}

export function toggleFavorite(productId: string): { favorites: string[]; isFavorite: boolean } {
  const favorites = getFavorites()
  const isFavorite = favorites.includes(productId)

  if (isFavorite) {
    return { favorites: removeFavorite(productId), isFavorite: false }
  } else {
    return { favorites: addFavorite(productId), isFavorite: true }
  }
}

export function isFavorite(productId: string): boolean {
  return getFavorites().includes(productId)
}
