import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Obtener todos los productos de un restaurante por su ID
 */
export const getProductsByRestaurant = async (restaurantId) => {
  try {
    console.log('🔍 Obteniendo productos del restaurante ID:', restaurantId)
    
    // Opción 1: Si tienes el endpoint específico
    try {
      const response = await axios.get(`${API_URL}/products/restaurant/${restaurantId}`)
      if (response.data.success) {
        console.log('✅ Productos obtenidos:', response.data.data)
        return response.data.data
      }
    } catch (endpointError) {
      console.log('ℹ️ Endpoint /restaurant/:id no disponible, usando método alternativo')
    }
    
    // Opción 2: Obtener todos y filtrar (si el endpoint específico no existe)
    const response = await axios.get(`${API_URL}/products`)
    console.log('📦 Todos los productos:', response.data)
    
    // Filtrar por restaurantId o por el ID del restaurante
    const filtered = response.data.filter(product => {
      // Buscar por diferentes nombres de campo
      return product.restaurantId == restaurantId || 
             product.idRestaurante == restaurantId ||
             product.restaurant_id == restaurantId
    })
    
    console.log('✅ Productos filtrados:', filtered)
    return filtered
    
  } catch (error) {
    console.error('❌ Error al obtener productos:', error)
    throw new Error(error.response?.data?.message || 'Error al cargar productos')
  }
}

/**
 * Crear un nuevo producto
 */
export const createProduct = async (productData) => {
  try {
    console.log('📤 Creando producto:', productData)
    
    const response = await axios.post(`${API_URL}/products`, productData)
    
    console.log('✅ Producto creado:', response.data)
    
    if (response.data.success) {
      return response.data.data
    }
    
    return response.data
    
  } catch (error) {
    console.error('❌ Error al crear producto:', error)
    throw new Error(error.response?.data?.message || 'Error al crear el producto')
  }
}

/**
 * Actualizar un producto existente
 */
export const updateProduct = async (productId, productData) => {
  try {
    console.log('🔄 Actualizando producto ID:', productId, 'con:', productData)
    
    const response = await axios.patch(`${API_URL}/products/${productId}`, productData)
    
    console.log('✅ Producto actualizado:', response.data)
    
    if (response.data.success) {
      return response.data.data
    }
    
    return response.data
    
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error)
    throw new Error(error.response?.data?.message || 'Error al actualizar el producto')
  }
}

/**
 * Eliminar un producto
 */
export const deleteProduct = async (productId) => {
  try {
    console.log('🗑️ Eliminando producto ID:', productId)
    
    const response = await axios.delete(`${API_URL}/products/${productId}`)
    
    console.log('✅ Producto eliminado:', response.data)
    
    return response.data
    
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error)
    throw new Error(error.response?.data?.message || 'Error al eliminar el producto')
  }
}

/**
 * Obtener un producto por ID
 */
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}`)
    
    if (response.data.success) {
      return response.data.data
    }
    
    return response.data
    
  } catch (error) {
    console.error('❌ Error al obtener producto:', error)
    throw new Error(error.response?.data?.message || 'Error al cargar el producto')
  }
}