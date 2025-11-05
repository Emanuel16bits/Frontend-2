import { defineStore } from 'pinia'
import axios from 'axios'

export const useRestaurantsStore = defineStore('restaurants', {
  state: () => ({
    restaurants: [],
    loading: false
  }),
  actions: {
    async fetchRestaurants() {
      this.loading = true
      try {
        const res = await axios.get('http://localhost:3000/restaurants')
        this.restaurants = res.data
      } catch (error) {
        console.error('Error cargando restaurantes:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
