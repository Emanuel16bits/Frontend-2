import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const getRestaurants = async () => {
  try {
    const response = await axios.get(`${API_URL}/restaurants`)
    return response.data
  } catch (error) {
    console.error('Error al obtener restaurantes', error)
    throw error
  }
};

export const getRestaurantById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener el restaurante ${id}`, error)
    throw error
  }
};

export const getRestaurantsByUser = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/usuario/${userId}`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener restaurantes del usuario ${userId}`, error)
    if (error.response && error.response.status === 404) {
      return []
    }
    throw error
  }
};

export const createRestaurant = async (restaurantData) => {
  try {
    const response = await axios.post(`${API_URL}/restaurants`, restaurantData)
    return response.data
  } catch (error) {
    console.error('Error al crear restaurante', error)
    throw error
  }
};

export const updateRestaurant = async (id, restaurantData) => {
  try {
    const response = await axios.patch(`${API_URL}/restaurants/${id}`, restaurantData)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar el restaurante ${id}`, error)
    throw error
  }
};

export const deleteRestaurant = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/restaurants/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al eliminar el restaurante ${id}`, error)
    throw error
  }
};

export const searchRestaurants = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/search`, {
      params: { q: query },
    });
    return response.data
  } catch (error) {
    console.error('Error al buscar restaurantes', error)
    throw error
  }
};
