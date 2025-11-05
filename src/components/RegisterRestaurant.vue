<template>
  <div class="register-container">
    <h2>Registrar Nuevo Restaurante</h2>
    <form @submit.prevent="handleCreate" class="register-form">
      <!-- Sección de Datos del Restaurante -->
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
          <label for="descripcion">Descripción</label>
          <textarea 
            id="descripcion" 
            v-model="restaurant.descripcion"
            placeholder="Describe tu restaurante"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="direccion">Dirección*</label>
          <input 
            type="text" 
            id="direccion" 
            v-model="restaurant.direccion"
            required
            placeholder="Dirección del restaurante"
          >
        </div>

        <div class="form-group">
          <label for="categoria">Categoría*</label>
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

     <button 
  type="submit" 
  :disabled="loading" 
  class="submit-btn"
  @click="handleCreate"
>
  {{ loading ? 'Registrando...' : 'Registrar Restaurante' }}
</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const restaurant = ref({
  nombre: '',
  descripcion: '',
  direccion: '',
  categoria: '',
  horarioApertura: '08:00',
  horarioCierre: '22:00',
  activo: true
})

const loading = ref(false)
const message = ref('')
const error = ref(false)

    const handleCreate = async () => {
  try {
    loading.value = true;
    message.value = '';
    error.value = false;

   
    const userId = authStore.userId;
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }

    const restaurantData = {
      ...restaurant.value,
      idUsuario: userId, 
      activo: true
    };

    console.log('📤 Enviando datos del restaurante:', restaurantData);

    const response = await axios.post('http://localhost:3000/restaurants', restaurantData);
    
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }

    console.log('✅ Restaurante creado:', response.data);
    message.value = 'Restaurante registrado con éxito';
    error.value = false;

   
    if (authStore.restaurant) {
      await authStore.updateRestaurant(authStore.restaurant.id, response.data);
    } else {
      
      await authStore.refreshUser();
    }

    setTimeout(() => {
      router.push('/home-vendedor');
    }, 1500);

  } catch (err) {
    console.error('❌ Error al registrar restaurante:', err);
    message.value = err.response?.data?.message || 'Error al registrar el restaurante. Por favor, inténtalo de nuevo.';
    error.value = true;
  } finally {
    loading.value = false;
  }
};  
</script>

<style scoped>

.register-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

h3 {
  color: #444;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="time"],
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="time"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.submit-btn:hover {
  background-color: #4338CA;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.submit-btn:disabled {
  background-color: #A5B4FC;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.8;
}
.message {
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background-color: #D1FAE5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.message.error {
  background-color: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FCA5A5;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .register-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>