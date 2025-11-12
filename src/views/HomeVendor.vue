<template>
  <div class="home-container">
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

      <div class="add-restaurant-container">
        <button class="add-restaurant-btn" @click="goTo('/registrar-restaurante')">
          <i class="fa-solid fa-plus"></i> Agregar Restaurante
        </button>
      </div>

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
              
              <div class="restaurant-actions">
                <button class="btn-edit" @click.stop="editRestaurant(restaurant.id)">
                  <i class="fa-regular fa-pen-to-square"></i> Editar
                </button>
                <button class="btn-delete" @click.stop="deleteRestaurant(restaurant.id)">
                  <i class="fa-regular fa-trash"></i> Eliminar
                </button>
              </div>
              
              <div class="restaurant-status" :class="{'active': restaurant.activo}">
                {{ restaurant.activo ? 'Activo' : 'Inactivo' }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="products-section" v-if="products.length > 0">
        <div class="section-header">
          <h2>Mis Productos</h2>
        </div>
        
        <div class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-image">
              <img :src="product.imagen || 'https://via.placeholder.com/300x180'" :alt="product.nombre">
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.nombre }}</h3>
              <div class="product-details">
                <div class="price-stock">
                  <span class="price">${{ Number(product.precio).toFixed(2) }}</span>
                </div>
                <span class="category" style="background: #4f46e5; color: white; padding: 0.2rem 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize; display: inline-block; margin-top: 0.3rem; position: relative; z-index: 1;">
  {{ 'Comida' }}
</span>
              </div>
              <p class="product-description" v-if="product.descripcion">{{ product.descripcion }}</p>
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
import { getProductsByUser } from '../services/productsService';
import { watch } from 'vue';

const router = useRouter()
const authStore = useAuthStore()
const restaurants = ref([])
const products = ref([])
const loading = ref(false)
const error = ref(null)
const selectedRestaurantId = ref(null);


const API_URL = 'http://localhost:3000'

const goTo = (path) => router.push(path)

const formatTime = (timeString) => {
  if (!timeString) return ''
  return timeString.slice(0, 5) 
}

watch(selectedRestaurantId, (newId) => {
  if (newId) {
    fetchProducts();
  }
});
const fetchRestaurants = async () => {
  try {
    loading.value = true;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id ? Number(user.id) : null;
    
    console.log('id de usuario:', userId);
    
    if (!userId) {
      throw new Error('Ususuario no autenticado');
    }

    const response = await fetch('http://localhost:3000/restaurants');
    const allRestaurants = await response.json();
    
    console.log('restaurantes de api:', allRestaurants);
    
    const userRestaurants = Array.isArray(allRestaurants) 
      ? allRestaurants.filter(rest => {
          console.log(`Restaurant ${rest.id} - idUsuario: ${rest.idUsuario}, userId: ${userId}`);
          return rest.idUsuario == userId;
        })
      : [];
    
    console.log('restaurantes filtrados:', userRestaurants);
    restaurants.value = userRestaurants;
    
    if (userRestaurants.length > 0) {
      selectedRestaurantId.value = userRestaurants[0].id;
    }
    
  } catch (err) {
    console.error('Error:', err);
    error.value = 'No se pudieron cargar los restaurantes. ' + err.message;
  } finally {
    loading.value = false;
  }
};
const fetchProducts = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    
    if (!userId) {
      console.error('Usuario no autenticado');
      return;
    }

    console.log('id de usuario:', userId);
    const userProducts = await getProductsByUser(userId);
    
    products.value = (Array.isArray(userProducts) ? userProducts : []).map(product => {
      console.log('Producto crudo:', product);
      const mappedProduct = {
        ...product,
        id: product.id || product.idProduct,
        categoria: product.categoria || product.category || 'Sin cat.'
      };
      console.log('Producto mapeado:', mappedProduct);
      return mappedProduct;
    });
    
    console.log('productos procesados:', JSON.parse(JSON.stringify(products.value)));
    
  } catch (error) {
    console.error('Error al cargar productos:', error);
    products.value = [];
  }
};
const editRestaurant = (id) => {
  router.push(`/editar-restaurante/${id}`);
};
const deleteRestaurant = async (id) => {
  if (confirm('¿Queres eliminar este restaurante?')) {
    try {
      await axios.delete(`http://localhost:3000/restaurants/${id}`);
      await fetchRestaurants();
      if (authStore.restaurant?.id === id) {
        authStore.setRestaurant(null);
      }
    } catch (error) {
      console.error('Error al eliminar el restaurante', error);
      alert('No se pudo eliminar el restaurante');
    }
  }
};

onMounted(async () => {
  if (!authStore.token) {
    router.push('/login');
    return;
  }
  
  try {
    await fetchRestaurants();
    
    if (restaurants.value.length > 0) {
      await fetchProducts();
    }
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
});
</script>

<style scoped>
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.4rem;
  margin: 0.3rem;
  padding: 0 0.3rem;
  width: 100%;
  box-sizing: border-box;
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 0.8rem;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 80px;
  overflow: hidden;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-name {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.price-stock {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price {
  font-weight: 700;
  color: #2563eb;
  font-size: 1rem;
  white-space: nowrap;
}

.category {
  font-size: 0.7rem;
  color: white;
  background: #4f46e5;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-transform: capitalize;
}

.product-description {
  color: #64748b;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  
  .product-image {
    height: 120px;
  }
  
  .product-info {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .product-image {
    height: 100px;
  }
  
  .product-name {
    font-size: 0.9rem;
  }
  
  .price {
    font-size: 0.9rem;
  }
  
  .product-description {
    font-size: 0.8rem;
  }
  
  .category {
    font-size: 0.6rem;
    padding: 0.15rem 0.4rem;
  }
}
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
.restaurants-section, .products-section {
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

.restaurants-grid, .products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.restaurant-card, .product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e2e8f0;
}

.restaurant-card:hover, .product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.restaurant-image img, .product-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-bottom: 1px solid #e2e8f0;
}

.restaurant-info, .product-info {
  padding: 1.25rem;
  position: relative;
}

.restaurant-info h3, .product-info h3 {
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

.restaurant-address, .product-description {
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
.restaurant-actions {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-edit {
  background-color: #e2e8f0;
  color: #2d3748;
}

.btn-delete {
  background-color: #fed7d7;
  color: #c53030;
}

.btn-edit:hover {
  background-color: #cbd5e0;
  transform: translateY(-1px);
}

.btn-delete:hover {
  background-color: #feb2b2;
  transform: translateY(-1px);
}

.restaurant-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.5rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.add-restaurant-btn:hover {
  background: #5a6bc8;
}
.product-price {
  font-weight: bold;
  color: #2f855a;
  margin: 0.5rem 0;
}

.product-description {
  color: #4a5568;
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
}
@media (max-width: 768px) {
  .home-options,
  .restaurants-grid,
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .home-main {
    padding: 1rem;
  }
  
  .restaurants-section,
  .products-section {
    padding: 1rem;
  }
}
</style>