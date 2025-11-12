<template>
  <div class="register-container">
    <h2>{{ isEditing ? 'Editar' : 'Registrar Nuevo' }} Restaurante</h2>
    <form @submit.prevent="handleSubmit" class="register-form">
      <div class="form-section">
        <div class="form-group">
          <label for="nombreRestaurante">Nombre del Restaurante*</label>
          <input 
            type="text" 
            id="nombreRestaurante" 
            v-model="restaurant.nombre" 
            required
            placeholder="Nombre de tu restaurante"
          >
        </div>

        <div class="form-group">
          <label for="descripcion">Descripcion</label>
          <textarea 
            id="descripcion" 
            v-model="restaurant.descripcion"
            placeholder="Describe tu restaurante"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="direccion">Direccion*</label>
          <input 
            type="text" 
            id="direccion" 
            v-model="restaurant.direccion"
            required
            placeholder="Direccion del restaurante"
          >
        </div>

        <div class="form-group">
          <label for="categoria">Categoria*</label>
          <select 
            id="categoria" 
            v-model="restaurant.categoria"
            required
          >
            <option value="">Selecciona una categoría</option>
            <option value="comida_rapida">Comida Rápida</option>
            <option value="restaurante">Restaurante</option>
            <option value="cafeteria">Cafetería</option>
            <option value="postres">Postres</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="horarioApertura">Hora de Apertura*</label>
            <input 
              type="time" 
              id="horarioApertura" 
              v-model="restaurant.horarioApertura"
              required
            >
          </div>

          <div class="form-group">
            <label for="horarioCierre">Hora de Cierre*</label>
            <input 
              type="time" 
              id="horarioCierre" 
              v-model="restaurant.horarioCierre"
              required
            >
          </div>
        </div>
      </div>

      <div v-if="message" :class="['message', error ? 'error' : 'success']">
        {{ message }}
      </div>

      <div class="form-actions">
        <button 
          v-if="isEditing"
          type="button" 
          class="btn btn-danger"
          @click="confirmDelete"
          :disabled="loading"
        >
          Eliminar Restaurante
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ loading ? (isEditing ? 'Actualizando...' : 'Registrando...') : (isEditing ? 'Actualizar' : 'Registrar') }} Restaurante
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const message = ref('')
const error = ref(false)

const isEditing = computed(() => !!route.params.id)

const restaurant = ref({
  nombre: '',
  descripcion: '',
  direccion: '',
  categoria: '',
  horarioApertura: '08:00',
  horarioCierre: '22:00'
})

onMounted(async () => {
  if (isEditing.value) {
    await loadRestaurant()
  }
})

const loadRestaurant = async () => {
  try {
    loading.value = true
    const response = await axios.get(`http://localhost:3000/restaurants/${route.params.id}`)
    if (response.data) {
      restaurant.value = {
        ...response.data,
        horarioApertura: formatTimeForInput(response.data.horarioApertura),
        horarioCierre: formatTimeForInput(response.data.horarioCierre)
      }
    }
  } catch (err) {
    console.error('Error al cargar el restaurante', err)
    message.value = 'Error al cargar los datos del restaurante'
    error.value = true
  } finally {
    loading.value = false
  }
}

const formatTimeForInput = (timeString) => {
  if (!timeString) return '08:00'
  if (timeString.match(/^\d{2}:\d{2}$/)) return timeString
  
  if (timeString.hours !== undefined) {
    return `${String(timeString.hours).padStart(2, '0')}:${String(timeString.minutes || '00').padStart(2, '0')}`
  }
  
  const date = new Date(timeString)
  if (!isNaN(date.getTime())) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  
  return '08:00'
}

const handleSubmit = async () => {
  try {
    loading.value = true
    message.value = ''
    error.value = false

    if (isEditing.value) {
      await updateRestaurant()
    } else {
      await createRestaurant()
    }
  } catch (err) {
    console.error('Error', err)
    message.value = `Error al ${isEditing.value ? 'actualizar' : 'crear'} el restaurante. Intenta de nuevo.`
    error.value = true
  } finally {
    loading.value = false
  }
}

const createRestaurant = async () => {
  const response = await axios.post('http://localhost:3000/restaurants', {
    ...restaurant.value,
    idUsuario: authStore.user.id
  })
  
  if (response.data) {
    message.value = 'Restaurante creado correctamente'
    setTimeout(() => {
      router.push('/home-vendedor')
    }, 1500)
  }
}

const updateRestaurant = async () => {
  const response = await axios.put(
    `http://localhost:3000/restaurants/${route.params.id}`,
    restaurant.value
  )
  
  if (response.data) {
    message.value = 'Restaurante actualizado'
    if (authStore.restaurant?.id === route.params.id) {
      authStore.setRestaurant(response.data)
    }
    setTimeout(() => {
      router.push('/home-vendedor')
    }, 1500)
  }
}

const confirmDelete = () => {
  if (confirm('¿Quieres eliminar el restaurante?')) {
    deleteRestaurant()
  }
}

const deleteRestaurant = async () => {
  try {
    await axios.delete(`http://localhost:3000/restaurants/${route.params.id}`)
    if (authStore.restaurant?.id === route.params.id) {
      authStore.setRestaurant(null)
    }
    message.value = 'Restaurante eliminado correctamente'
    setTimeout(() => {
      router.push('/home-vendedor')
    }, 1000)
  } catch (err) {
    console.error('Error al eliminar el restaurante', err)
    message.value = 'Error al eliminar el restaurante, intenta de nuevo'
    error.value = true
  }
}
</script>

<style scoped>
.register-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input[type="text"],
.form-group input[type="time"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus,
.form-group input[type="time"]:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  text-align: center;
  font-weight: 500;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

@media (max-width: 768px) {
  .register-container {
    margin: 1rem;
    padding: 1rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn {
    width: 100%;
  }
}
</style>