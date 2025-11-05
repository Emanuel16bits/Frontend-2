import axios from 'axios'

const API_URL = 'http://localhost:3000/api' // Ajusta según tu configuración

export default {
  async getAll() {
    const response = await axios.get(`${API_URL}/restaurants`)
    return response.data
  },

  async getById(id) {
    const response = await axios.get(`${API_URL}/restaurants/${id}`)
    return response.data
  },

  async create(restaurantData) {
    const response = await axios.post(`${API_URL}/restaurants`, restaurantData)
    return response.data
  },

  async update(id, restaurantData) {
    const response = await axios.put(`${API_URL}/restaurants/${id}`, restaurantData)
    return response.data
  },

  async delete(id) {
    await axios.delete(`${API_URL}/restaurants/${id}`)
  },

  async search(query) {
    const response = await axios.get(`${API_URL}/restaurants/search`, {
      params: { q: query },
    })
    return response.data
  },
}
