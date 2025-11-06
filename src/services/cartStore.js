// src/services/cartStore.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    restaurantId: null,
    restaurantName: '',
    notasPedido: ''
  }),
  
  actions: {
    addItem(item) {
      // Si el carrito está vacío o es del mismo restaurante
      if (this.restaurantId === null || this.restaurantId === item.restaurantId) {
        const existingItem = this.items.find(i => i.id === item.id)
        if (existingItem) {
          existingItem.quantity += 1
        } else {
          this.items.push({ ...item, quantity: 1 })
        }
        this.restaurantId = item.restaurantId
        this.restaurantName = item.restaurantName
      } else {
        // Preguntar si quiere vaciar el carrito
        if (confirm(`¿Deseas vaciar el carrito y agregar productos de ${item.restaurantName}?`)) {
          this.items = [{ ...item, quantity: 1 }]
          this.restaurantId = item.restaurantId
          this.restaurantName = item.restaurantName
        }
      }
    },
    
    removeItem(itemId) {
      const index = this.items.findIndex(item => item.id === itemId)
      if (index !== -1) {
        this.items.splice(index, 1)
        if (this.items.length === 0) {
          this.restaurantId = null
          this.restaurantName = ''
        }
      }
    },
    
    clearCart() {
      this.items = []
      this.restaurantId = null
      this.restaurantName = ''
      this.notasPedido = ''
    },
    
    updateQuantity(itemId, newQuantity) {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.quantity = Math.max(1, newQuantity)
      }
    },
    
    updateNotes(notes) {
      this.notasPedido = notes
    }
  },
  
  getters: {
    totalItems: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((total, item) => total + (item.price * item.quantity), 0),
    getItemQuantity: (state) => (itemId) => {
      const item = state.items.find(i => i.id === itemId)
      return item ? item.quantity : 0
    }
  }
})