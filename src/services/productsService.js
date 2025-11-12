import axios from 'axios'

const API_URL = 'http://localhost:3000';

export const getProductsByRestaurant = async (restaurantId) => {
  try {
    console.log(`Obteniendo productos para el restaurante ${restaurantId}`)
    const response = await axios.get(`${API_URL}/products/restaurant/${restaurantId}`)
    console.log('Respuesta de la API (productos)', response.data)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Error al obtener productos del restaurante', error)
    return []
  }
}

export const getProductsByUser = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/products/user/${userId}`)  
    return response.data
  } catch (error) {
    console.error('Error al obtener productos del usuario', error)
    throw error
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_URL}/products`, productData)
    return response.data
  } catch (error) {
    console.error('Error al crear producto', error)
    throw error
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.patch(`${API_URL}/products/${id}`, productData)
    return response.data
  } catch (error) {
    console.error('Error al actualizar producto', error)
    throw error
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/products/${id}`)
    return response.data
  } catch (error) {
    console.error('Error al eliminar producto', error)
    throw error
  }
};