import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

axios.defaults.baseURL = API_URL
axios.defaults.headers.common['Content-Type'] = 'application/json'

export const useAuthStore = defineStore('auth', () => {

  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const restaurant = ref(JSON.parse(localStorage.getItem('restaurant') || 'null'))
  const isAuthenticated = computed(() => !!token.value)
  const userType = computed(() => user.value?.rol || null)
  const userName = computed(() => user.value?.nombre || '')
  const userId = computed(() => user.value?.id || null)

  
  
 async function register(userData) {
  try {
    console.log('Enviando datos de registro:', userData)
    
    const response = await axios.post('/users', userData)
    console.log('Respuesta del servidor:', response.data)
    
    if (response.data) {
      return {
        success: true,
        data: response.data
      }
    }
    
    throw new Error('No se recibieron datos del servidor')
  } catch (error) {
    console.error('Error en register:', error)
    
    let errorMessage = 'Error al registrar'
    
    if (error.response) {
      if (error.response.data?.error?.includes('Duplicate entry') && 
          error.response.data?.error?.includes('email')) {
        errorMessage = 'Este correo electronico ya está registrado'
      } 
      else {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      'Error del servidor'
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor'
    }
    
    throw new Error(errorMessage)
  }
}

  async function login(credentials) {
    try {
      console.log('Intentando login con:', credentials.email)
      
      const response = await axios.get('/users')
      
      if (!response.data.success) {
        throw new Error('Error al obtener usuarios')
      }

      const users = response.data.data
      const foundUser = users.find(u => 
        u.email === credentials.email && u.password === credentials.password
      )

      if (!foundUser) {
        throw new Error('Credenciales invalidas')
      }

      const authToken = 'token-' + Date.now()

      token.value = authToken
      user.value = foundUser
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(foundUser))

      console.log('Login exitoso:', foundUser)

      if (foundUser.rol === 'vendedor') {
        await loadUserRestaurant(foundUser.id)
      }

      return foundUser
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

async function loadUserRestaurant(userId) {
    try {
      console.log('Cargando restaurante del usuario id:', userId)
      
      const response = await axios.get(`/users/${userId}/restaurant`)
      
      console.log('Respuesta del restaurante:', response.data)
      
      if (response.data.success && response.data.data) {
        restaurant.value = response.data.data
        localStorage.setItem('restaurant', JSON.stringify(response.data.data))
        console.log('Restaurante cargado:', restaurant.value)
        return restaurant.value
      } else {
        console.log('Usuario sin restaurante asociado')
        restaurant.value = null
        localStorage.removeItem('restaurant')
        return null
      }
    } catch (error) {
      console.error('Error al cargar restaurante:', error)
      restaurant.value = null
      localStorage.removeItem('restaurant')
      return null
    }
  }

async function updateRestaurant(restaurantId, updates) {
    try {
      console.log('Actualizando restaurante', restaurantId, updates)
      
      const response = await axios.patch(`/restaurants/${restaurantId}`, updates)
      
      if (response.data.success) {
        restaurant.value = response.data.data
        localStorage.setItem('restaurant', JSON.stringify(response.data.data))
        console.log('Restaurante actualizado:', restaurant.value)
        return restaurant.value
      }
      
      throw new Error(response.data.message || 'Error al actualizar')
    } catch (error) {
      console.error('Error al actualizar restaurante', error)
      throw error
    }
  }

function logout() {
    console.log('Cerrando sesión...')
    token.value = null
    user.value = null
    restaurant.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('restaurant')
  }

function checkAuth() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedRestaurant = localStorage.getItem('restaurant')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      
      if (storedRestaurant) {
        restaurant.value = JSON.parse(storedRestaurant)
      }
      
      console.log('Sesión restaurada:', user.value)
      return true
    }
    
    console.log('No hay sesión activa')
    return false
  }

async function refreshUser() {
    if (!userId.value) return null

    try {
      const response = await axios.get(`/users/${userId.value}`)
      
      if (response.data.success) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
        
        if (user.value.rol === 'vendedor') {
          await loadUserRestaurant(userId.value)
        }
        
        return user.value
      }
    } catch (error) {
      console.error('Error al refrescar usuario:', error)
      return null
    }
  }

  return {
    token,
    user,
    restaurant,
    isAuthenticated,
    userType,
    userName,
    userId,
    register,
    login,
    logout,
    checkAuth,
    loadUserRestaurant,
    updateRestaurant,
    refreshUser
  }
})