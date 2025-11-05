import axios from 'axios'

const API_URL = 'http://localhost:3000/products'

// Obtener todos los productos
export const getProducts = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

// Obtener un producto por ID
export const getProductById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`)
  return response.data
}

// Crear un nuevo producto
export const createProduct = async (productData) => {
  try {
    const response = await axios.post(API_URL, productData)
    return response.data
  } catch (error) {
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors.join(', '))
    }
    throw error
  }
}

// Actualizar un producto (PUT)
export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, productData)
    return response.data
  } catch (error) {
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors.join(', '))
    }
    throw error
  }
}

// Actualizar parcialmente un producto (PATCH)
export const patchProduct = async (id, partialData) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}`, partialData)
    return response.data
  } catch (error) {
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors.join(', '))
    }
    throw error
  }
}

// Eliminar un producto
export const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`)
  return response.data
}

// Obtener productos por restaurante
export const getProductsByRestaurant = async (restaurantId) => {
  const response = await axios.get(`${API_URL}?restaurantId=${restaurantId}`)
  return response.data
}
