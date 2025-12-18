import { Product, Category } from './types'

export const categories: Category[] = [
  { id: '1', name: 'Eletrônicos', slug: 'eletronicos' },
  { id: '2', name: 'Roupas', slug: 'roupas' },
  { id: '3', name: 'Casa e Jardim', slug: 'casa-jardim' },
  { id: '4', name: 'Esportes', slug: 'esportes' },
]

export const products: Product[] = [
  {
    id: '1',
    name: 'Fone Bluetooth Premium',
    description: 'Fone de ouvido sem fio com cancelamento de ruído ativo e bateria de longa duração.',
    category: 'eletronicos',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Smartwatch Fitness',
    description: 'Relógio inteligente com monitor cardíaco, GPS e resistência à água.',
    category: 'eletronicos',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Camiseta Algodão Orgânico',
    description: 'Camiseta confortável feita com algodão 100% orgânico e sustentável.',
    category: 'roupas',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Jaqueta Impermeável',
    description: 'Jaqueta leve e impermeável, perfeita para dias chuvosos.',
    category: 'roupas',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
    createdAt: '2024-02-10',
  },
  {
    id: '5',
    name: 'Luminária LED Moderna',
    description: 'Luminária de mesa com ajuste de intensidade e temperatura de cor.',
    category: 'casa-jardim',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
    createdAt: '2024-02-15',
  },
  {
    id: '6',
    name: 'Kit Jardinagem Completo',
    description: 'Kit com ferramentas essenciais para cuidar do seu jardim.',
    category: 'casa-jardim',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
    createdAt: '2024-02-20',
  },
  {
    id: '7',
    name: 'Bola de Futebol Profissional',
    description: 'Bola oficial com tecnologia de estabilidade de voo.',
    category: 'esportes',
    image: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400&h=400&fit=crop',
    createdAt: '2024-03-01',
  },
  {
    id: '8',
    name: 'Tênis Running Pro',
    description: 'Tênis de corrida com amortecimento avançado e respirabilidade.',
    category: 'esportes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    createdAt: '2024-03-05',
  },
]
