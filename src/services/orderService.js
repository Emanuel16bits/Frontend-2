// src/services/orderService.js
import axios from 'axios'

const API_URL = 'http://localhost:3000'

// Obtener detalles de un pedido por ID
export const getOrderById = async (orderId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${orderId}`, {
      params: {
        _expand: 'usuario,orderItems.producto' // Ajusta según tu API
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener el pedido:', error);
    throw error;
  }
};

// Enviar calificación de un pedido
export const rateOrder = async (orderId, rating, comment = '') => {
  try {
    const response = await axios.post(`${API_URL}/orders/${orderId}/rate`, {
      rating,
      comment
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al calificar el pedido:', error);
    throw error;
  }
};