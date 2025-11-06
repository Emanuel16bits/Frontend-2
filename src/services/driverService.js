// src/services/driverService.js
import axios from 'axios'

const API_URL = 'http://localhost:3000'

// Obtener todos los repartidores
export const getDrivers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users?rol=repartidor`)
    return response.data
  } catch (error) {
    console.error('Error al obtener repartidores:', error)
    throw error
  }
}

// Obtener un repartidor por ID
export const getDriver = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}?rol=repartidor`)
    return response.data
  } catch (error) {
    console.error('Error al obtener el repartidor:', error)
    throw error
  }
}

// Obtener pedidos asignados a un repartidor
export const getDriverOrders = async (driverId) => {
  try {
    const response = await axios.get(`${API_URL}/orders?repartidorId=${driverId}`)
    return response.data
  } catch (error) {
    console.error('Error al obtener los pedidos del repartidor:', error)
    throw error
  }
}

// Actualizar estado de un pedido
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axios.patch(`${API_URL}/orders/${orderId}`, { estado: status })
    return response.data
  } catch (error) {
    console.error('Error al actualizar el estado del pedido:', error)
    throw error
  }
}