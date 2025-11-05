<template>
  <div class="register-container">
    <h1 class="logo">comidApp</h1>
    <h2>Registro de Usuario</h2>
    <form @submit.prevent="handleCreate" class="register-form">
      <div class="form-section">
        <h3>Datos de Usuario</h3>
        <div class="form-group">
          <label for="nombre">Nombre Completo*</label>
          <input 
            type="text" 
            id="nombre" 
            v-model="newUser.nombre" 
            required
            placeholder="Ingresa tu nombre completo"
          >
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico*</label>
          <input 
            type="email" 
            id="email" 
            v-model="newUser.email" 
            required
            placeholder="tucorreo@ejemplo.com"
          >
        </div>

        <div class="form-group">
          <label for="password">Contraseña*</label>
          <input 
            type="password" 
            id="password" 
            v-model="newUser.password" 
            required
            minlength="6"
            placeholder="Mínimo 6 caracteres"
          >
        </div>

        <div class="form-group">
          <label for="rol">Rol*</label>
          <select id="rol" v-model="newUser.rol" required>
            <option value="">Selecciona un rol</option>
            <option value="cliente">Cliente</option>
            <option value="vendedor">Vendedor</option>
            <option value="repartidor">Repartidor</option>
          </select>
        </div>
      </div>

      <div v-if="newUser.rol === 'vendedor'" class="form-section">
        <h3>Datos del Restaurante</h3>
        <div class="form-group">
          <label for="nombreRestaurante">Nombre del Restaurante*</label>
          <input 
            type="text" 
            id="nombreRestaurante" 
            v-model="newUser.restaurante.nombre" 
            :required="newUser.rol === 'vendedor'"
            placeholder="Nombre de tu restaurante"
          >
        </div>

        <div class="form-group">
          <label for="descripcion">Descripción</label>
          <textarea 
            id="descripcion" 
            v-model="newUser.restaurante.descripcion"
            placeholder="Describe tu restaurante"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="direccion">Dirección*</label>
          <input 
            type="text" 
            id="direccion" 
            v-model="newUser.restaurante.direccion"
            :required="newUser.rol === 'vendedor'"
            placeholder="Dirección del restaurante"
          >
        </div>

        <div class="form-group">
          <label for="categoria">Categoría*</label>
          <select 
            id="categoria" 
            v-model="newUser.restaurante.categoria"
            :required="newUser.rol === 'vendedor'"
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
              v-model="newUser.restaurante.horarioApertura"
              :required="newUser.rol === 'vendedor'"
            >
          </div>

          <div class="form-group">
            <label for="horarioCierre">Hora de Cierre*</label>
            <input 
              type="time" 
              id="horarioCierre" 
              v-model="newUser.restaurante.horarioCierre"
              :required="newUser.rol === 'vendedor'"
            >
          </div>
        </div>
      </div>

      <div v-if="message" :class="['message', error ? 'error' : 'success']">
        {{ message }}
      </div>

      <button type="submit" :disabled="loading" class="submit-btn">
        {{ loading ? 'Registrando...' : 'Registrarse' }}
      </button>

      <p class="login-link">
        ¿Ya tienes una cuenta? 
        <router-link to="/login" class="login-link-text">Inicia sesión aquí</router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const newUser = ref({
  nombre: '',
  email: '',
  password: '',
  rol: '',
  restaurante: {
    nombre: '',
    descripcion: '',
    direccion: '',
    categoria: '',
    horarioApertura: '08:00',
    horarioCierre: '22:00'
  }
})

const loading = ref(false)
const message = ref('')
const error = ref(false)

const handleCreate = async () => {
  try {
    loading.value = true
    message.value = ''
    error.value = false

    const response = await authStore.register(newUser.value)
    
    if (response.success) {
      message.value = '¡Registro exitoso! Redirigiendo...'
      error.value = false
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  } catch (err) {
    console.error('Error en el registro:', err)
    message.value = err.message || 'Error al registrar. Por favor, inténtalo de nuevo.'
    error.value = true
  } finally {
    loading.value = false
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo {
  color: #667eea;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

h2 {
  color: #1F2937;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

h3 {
  color: #374151;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-weight: 500;
  font-size: 0.95rem;
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="time"],
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: white;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="time"]:focus,
select:focus,
textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  outline: none;
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

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #6B7280;
  font-size: 0.95rem;
}

.login-link-text {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.login-link-text:hover {
  color: #4338CA;
  text-decoration: underline;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
  text-align: center;
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
  .register-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .logo {
    font-size: 2rem;
  }
}
</style>