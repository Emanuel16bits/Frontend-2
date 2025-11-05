<template>
  <div class="home-container">
    <!-- Header -->
    <header class="home-header">
      <h1>comidApp</h1>
      <div>
        <button class="btn" @click="goTo('/home')">Volver</button>
      </div>
    </header>

    <main class="home-main">
      <h2>Panel del Vendedor</h2>
      <p>Gestiona tu negocio fácilmente</p>

      <div class="home-options">
        <div class="option-card" @click="goTo('/mis-productos')">
          <i class="fa-solid fa-boxes-stacked"></i>
          <h3>Mis Productos</h3>
          <p>Administra tu menú</p>
        </div>

        <div class="option-card" @click="goTo('/pedidos-vendedor')">
          <i class="fa-solid fa-clipboard-list"></i>
          <h3>Pedidos</h3>
          <p>Revisa y gestiona pedidos</p>
        </div>

        <div class="option-card" @click="goTo('/reportes')">
          <i class="fa-solid fa-chart-line"></i>
          <h3>Reportes</h3>
          <p>Estadísticas de ventas</p>
        </div>

        <div class="option-card" @click="goTo('/perfil-vendedor')">
          <i class="fa-solid fa-user"></i>
          <h3>Mi Perfil</h3>
          <p>Configura tu cuenta</p>
        </div>
      </div>

      <!-- Botón para agregar nuevo restaurante -->
      <div class="add-restaurant-container">
       <button class="add-restaurant-btn" @click="goTo('/registrar-restaurante')">
         <i class="fa-solid fa-plus"></i> Agregar Restaurante
       </button>
      </div>

      <!-- Sección de Restaurantes -->
      <section class="restaurants-section">
        <div class="section-header">
          <h2>Mis Restaurantes</h2>
        </div>

        <div v-if="loading" class="empty-state">
          <p>Cargando restaurantes...</p>
        </div>

        <div v-else-if="restaurants.length === 0" class="empty-state">
          <p>No tienes restaurantes registrados</p>
        </div>

        <div v-else class="restaurants-grid">
          <div v-for="restaurant in restaurants" :key="restaurant.id" class="restaurant-card">
            <div class="restaurant-image">
              <img :src="restaurant.imagenUrl || 'https://via.placeholder.com/300x180'" :alt="restaurant.nombre">
            </div>
            <div class="restaurant-info">
              <h3>{{ restaurant.nombre }}</h3>
              <p class="restaurant-category">{{ restaurant.categoria }}</p>
              <p class="restaurant-address">{{ restaurant.direccion }}</p>
              <p class="restaurant-schedule">
                <i class="fa-regular fa-clock"></i> 
                {{ formatTime(restaurant.horarioApertura) }} - {{ formatTime(restaurant.horarioCierre) }}
              </p>
              <div class="restaurant-status" :class="{'active': restaurant.activo}">
                {{ restaurant.activo ? 'Activo' : 'Inactivo' }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const restaurants = ref([])
const loading = ref(false)
const error = ref(null)

const API_URL = 'http://localhost:3000'

const goTo = (path) => router.push(path)

// Formatear hora (HH:MM:SS a HH:MM)
const formatTime = (timeString) => {
  if (!timeString) return ''
  return timeString.slice(0, 5) // Tomar solo horas y minutos
}

// Obtener restaurantes del vendedor
const fetchRestaurants = async () => {
  try {
    loading.value = true;
    
    // 1. Obtener el ID del usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id ? Number(user.id) : null; // Convertir a número
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    console.log('ID del usuario actual:', userId, 'Tipo:', typeof userId);

    // 2. Obtener todos los restaurantes
    const response = await fetch('http://localhost:3000/restaurants');
    
    if (!response.ok) {
      throw new Error('Error al cargar los restaurantes');
    }
    
    // 3. Filtrar restaurantes por idUsuario
    const allRestaurants = await response.json();
    console.log('Todos los restaurantes (crudo):', JSON.stringify(allRestaurants, null, 2));
    
    const userRestaurants = Array.isArray(allRestaurants) 
      ? allRestaurants.filter(rest => {
          console.log('Comparando:', {
            restauranteId: rest.idUsuario, // Asegúrate de que sea el nombre correcto
            userId: userId,
            iguales: rest.idUsuario == userId,
            tipos: {
              restauranteId: typeof rest.idUsuario,
              userId: typeof userId
            }
          });
          return rest.idUsuario == userId; // Usa el nombre correcto del campo
        })
      : [];
    
    console.log('Restaurantes del usuario:', userRestaurants);
    restaurants.value = userRestaurants;
    
  } catch (err) {
    console.error('Error:', err);
    error.value = 'No se pudieron cargar los restaurantes. ' + err.message;
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  if (!authStore.token) {
    router.push('/login')
    return
  }
  fetchRestaurants()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.home-header {
  background: #667eea;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.home-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.home-header .btn {
  padding: 10px 20px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  background: white;
  color: #667eea;
  font-weight: bold;
  transition: all 0.3s ease;
}

.home-header .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.home-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.home-main h2 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.home-main > p {
  color: #718096;
  margin-bottom: 2rem;
}

.home-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.option-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e2e8f0;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.option-card i {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.option-card h3 {
  margin: 0.5rem 0;
  color: #2d3748;
}

.option-card p {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

/* Estilos para la sección de restaurantes */
.restaurants-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #2d3748;
}

.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.restaurant-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e2e8f0;
}

.restaurant-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.restaurant-image img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-bottom: 1px solid #e2e8f0;
}

.restaurant-info {
  padding: 1.25rem;
}

.restaurant-info h3 {
  margin: 0 0 0.5rem;
  color: #2d3748;
  font-size: 1.25rem;
}

.restaurant-category {
  display: inline-block;
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.restaurant-address {
  color: #4a5568;
  margin: 0.5rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.restaurant-schedule {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.restaurant-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.75rem;
}

.restaurant-status.active {
  background: #c6f6d5;
  color: #22543d;
}

.restaurant-status:not(.active) {
  background: #fed7d7;
  color: #822727;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #718096;
  font-size: 1.1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e0;
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .home-options,
  .restaurants-grid {
    grid-template-columns: 1fr;
  }
  
  .home-main {
    padding: 1rem;
  }
  
  .restaurants-section {
    padding: 1rem;
  }
}

.add-restaurant-container {
  margin-top: 1rem;
}

.add-restaurant-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background 0.3s;
}

.add-restaurant-btn:hover {
  background: #5a6bc8;
}
</style>



