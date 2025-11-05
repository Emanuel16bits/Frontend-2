import { defineStore } from 'pinia'
import { getDriver, updateAvailability } from '@/services/driverService'

export const useDriverStore = defineStore('driverStore', {
  state: () => ({
    driverId: null,  // id del driver logueado
    driver: null,    // datos del driver
    loading: false,
    error: null
  }),

  actions: {
    login(id) {
      this.driverId = id
      localStorage.setItem('driverId', id)
    },

    logout() {
      this.driverId = null
      this.driver = null
      localStorage.removeItem('driverId')
    },

    loadFromStorage() {
      const id = localStorage.getItem('driverId')
      if (id) this.driverId = Number(id)
    },

    async fetchDriver() {
      if (!this.driverId) return
      this.loading = true
      try {
        this.driver = await getDriver(this.driverId)
        this.error = null
      } catch (err) {
        this.error = err.message || 'Error al cargar driver'
      } finally {
        this.loading = false
      }
    },

    async toggleAvailability() {
      if (!this.driver) return
      try {
        const updated = await updateAvailability(this.driver.id, !this.driver.disponible)
        this.driver = updated
      } catch (err) {
        this.error = err.message || 'Error al actualizar disponibilidad'
      }
    }
  }
})
