// src/services/driverService.js
import axios from 'axios'

const API_URL = 'http://localhost:3000/drivers'

export const getDrivers = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

export const getDriver = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`)
  return response.data
}

export const createDriver = async (driverData) => {
  const response = await axios.post(API_URL, driverData)
  return response.data
}

export const updateAvailability = async (id, disponible) => {
  const response = await axios.patch(`${API_URL}/${id}/disponibilidad`, { disponible })
  return response.data
}

export const updateEarnings = async (id, monto) => {
  const response = await axios.patch(`${API_URL}/${id}/ganancias`, { monto })
  return response.data
}

export const updateRating = async (id, calificacion) => {
  const response = await axios.patch(`${API_URL}/${id}/calificacion`, { calificacion })
  return response.data
}
