<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <h1 class="logo">comidApp</h1>
        <p>Inicia sesión en tu cuenta</p>
      </div>

      <div v-if="message" class="error-message">
        {{ message }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input
            v-model="loginData.email"
            type="email"
            class="input"
            placeholder="Correo electrónico"
            required
          />
        </div>

        <div class="form-group">
          <input
            v-model="loginData.password"
            type="password"
            class="input"
            placeholder="Contraseña"
            required
          />
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="text-center mt-4">
        <p class="register-link">
          ¿No tienes una cuenta? 
          <router-link to="/register" class="register-link-text">Regístrate aquí</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginData = ref({
  email: '',
  password: '',
})

const loading = ref(false)
const message = ref('')

const handleLogin = async () => {
  if (!loginData.value.email || !loginData.value.password) {
    message.value = 'Por favor completa todos los campos'
    return
  }

  try {
    loading.value = true
    await authStore.login(loginData.value)
    router.push('/home')
  } catch (error) {
    message.value = error.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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

.logo {
  color: #667eea;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  letter-spacing: -0.5px;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #6B7280;
  font-size: 0.95rem;
}

.register-link-text {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.register-link-text:hover {
  color: #4338CA;
  text-decoration: underline;
}

h2 {
  color: #1F2937;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;
}

input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  outline: none;
}
</style>
