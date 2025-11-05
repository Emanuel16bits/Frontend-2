<template>
  <div class="client-home-container">
    <!-- Header -->
    <header class="client-header">
      <div class="header-content">
        <div class="logo-section">
          <h1>comidApp</h1>
        </div>
        <div class="user-section">
          <button class="btn-cart" @click="goTo('/carrito')">
            🛒
            <span v-if="cartItemsCount > 0" class="cart-badge">{{ cartItemsCount }}</span>
          </button>
          <button class="btn-profile" @click="showProfileMenu = !showProfileMenu">
            <i class="fa-solid fa-user-circle"></i>
            {{ userName }}
          </button>
          
          <!-- Menú desplegable de perfil -->
          <div v-if="showProfileMenu" class="profile-dropdown">
            <button @click="goTo('/perfil')">
              <i class="fa-solid fa-user"></i> Mi Perfil
            </button>
            <button @click="goTo('/pedidos')">
              <i class="fa-solid fa-receipt"></i> Mis Pedidos
            </button>
            <button @click="goTo('/favoritos')">
              <i class="fa-solid fa-heart"></i> Favoritos
            </button>
            <button @click="logout" class="logout-btn">
              <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <!-- Barra de búsqueda -->
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Buscar restaurantes, comidas..." 
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Filtros de categorías -->
      <div class="categories-filter">
        <button 
          v-for="category in categories" 
          :key="category.id"
          :class="['category-btn', { active: selectedCategory === category.id }] "
          @click="filterByCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </header>

    <main class="client-main">
      <!-- Banner promocional -->
      <section class="promo-banner">
        <div class="banner-content">
          <h2>¡Envío gratis en tu primer pedido!</h2>
          <p>Ordena ahora y disfruta sin costo de envío</p>
        </div>
      </section>

      <!-- Restaurantes destacados -->
      <section v-if="!searchQuery && selectedCategory === 'todos'" class="featured-section">
        <h2>Restaurantes destacados</h2>
        <div class="restaurants-carousel">
          <div 
            v-for="restaurant in featuredRestaurants" 
            :key="restaurant.id"
            class="restaurant-card featured"
            @click="viewRestaurant(restaurant.id)"
          >
            <div class="restaurant-image">
              <img :src="restaurant.image || 'https://via.placeholder.com/300x200'" :alt="restaurant.nombre">
              <button class="favorite-btn" @click.stop="toggleFavorite(restaurant.id)">
                <i :class="isFavorite(restaurant.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
              </button>
              <span v-if="restaurant.promo" class="promo-badge">{{ restaurant.promo }}</span>
            </div>
            <div class="restaurant-info">
              <h3>{{ restaurant.nombre }}</h3>
              <p class="restaurant-category">{{ restaurant.categoria }}</p>
              <div class="restaurant-meta">
                <span class="rating">{{ restaurant.rating || 'N/A' }}</span>
                <span class="delivery-time">{{ restaurant.deliveryTime || '-' }} min</span>
                <span class="delivery-cost">${{ restaurant.deliveryCost || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Listado de todos los restaurantes -->
      <section class="restaurants-section">
        <div class="section-header">
          <h2>{{ getSectionTitle() }}</h2>
          <p>{{ filteredRestaurants.length }} restaurantes disponibles</p>
        </div>

        <div v-if="loading" class="loading-state">
          <p>Cargando restaurantes...</p>
        </div>

        <div v-else-if="filteredRestaurants.length === 0" class="empty-state">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>No se encontraron restaurantes</p>
          <button class="btn btn-primary" @click="clearFilters">Ver todos</button>
        </div>

        <div v-else class="restaurants-grid">
          <div 
            v-for="restaurant in filteredRestaurants" 
            :key="restaurant.id"
            class="restaurant-card"
            @click="viewRestaurant(restaurant.id)"
          >
            <div class="restaurant-image">
              <img :src="restaurant.image || 'https://via.placeholder.com/300x200'" :alt="restaurant.nombre">
              <button class="favorite-btn" @click.stop="toggleFavorite(restaurant.id)">
                <i :class="isFavorite(restaurant.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
              </button>
              <span v-if="restaurant.promo" class="promo-badge">{{ restaurant.promo }}</span>
              <span v-if="!restaurant.isOpen" class="closed-badge">Cerrado</span>
            </div>
            <div class="restaurant-info">
              <h3>{{ restaurant.nombre }}</h3>
              <p class="restaurant-category">{{ restaurant.categoria }}</p>
              <div class="restaurant-meta">
                <span class="rating">{{ restaurant.rating || 'N/A' }}</span>
                <span class="delivery-time">{{ restaurant.deliveryTime || '-' }} min</span>
                <span class="delivery-cost">${{ restaurant.deliveryCost || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Acceso rápido -->
      <section class="quick-access">
        <h2>Acceso rápido</h2>
        <div class="quick-buttons">
          <button class="quick-btn" @click="goTo('/pedidos')">
            <i class="fa-solid fa-receipt"></i>
            <span>Mis Pedidos</span>
          </button>
          <button class="quick-btn" @click="goTo('/favoritos')">
            <i class="fa-solid fa-heart"></i>
            <span>Favoritos</span>
          </button>
          <button class="quick-btn" @click="goTo('/carrito')">
            <i class="fa-solid fa-cart-shopping"></i>
            <span>Mi Carrito</span>
          </button>
        </div>
      </section>
    </main>

    <!-- Botón flotante del carrito -->
    <button v-if="cartItemsCount > 0" class="fab-cart" @click="goTo('/carrito')">
      <i class="fa-solid fa-cart-shopping"></i>
      <span class="fab-badge">{{ cartItemsCount }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import axios from 'axios'

const router = useRouter()
const cartStore = useCartStore()

const userName = ref('Usuario')
const showProfileMenu = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('todos')
const loading = ref(true)
const restaurants = ref([])
const favorites = ref([])

const categories = [
  { id: 'todos', name: 'Todos' },
  { id: 'pizza', name: 'Pizza' },
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'sushi', name: 'Sushi' },
  { id: 'postres', name: 'Postres' },
  { id: 'bebidas', name: 'Bebidas' }
]

// Computed
const cartItemsCount = computed(() => cartStore.totalItems || 0)

const featuredRestaurants = computed(() => {
  return restaurants.value.filter(r => r.rating >= 4.7).slice(0, 3)
})

const filteredRestaurants = computed(() => {
  let filtered = restaurants.value

  if (selectedCategory.value !== 'todos') {
    filtered = filtered.filter(r => 
      r.categoria.toLowerCase() === selectedCategory.value.toLowerCase()
    )
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.nombre.toLowerCase().includes(query) ||
      r.categoria.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Funciones
const getSectionTitle = () => {
  if (searchQuery.value) return `Resultados para "${searchQuery.value}"`
  if (selectedCategory.value !== 'todos') {
    const category = categories.find(c => c.id === selectedCategory.value)
    return category ? category.name : 'Todos'
  }
  return '🍽️ Todos los restaurantes'
}

const handleSearch = () => {}

const clearSearch = () => { searchQuery.value = '' }
const filterByCategory = (categoryId) => { selectedCategory.value = categoryId; searchQuery.value = '' }
const clearFilters = () => { searchQuery.value = ''; selectedCategory.value = 'todos' }

const isFavorite = (restaurantId) => favorites.value.includes(restaurantId)

const toggleFavorite = async (restaurantId) => {
  try {
    if (isFavorite(restaurantId)) {
      await axios.delete(`http://localhost:3000/favorites/${restaurantId}`, { withCredentials: true })
      favorites.value = favorites.value.filter(id => id !== restaurantId)
    } else {
      await axios.post('http://localhost:3000/favorites', { restaurantId }, { withCredentials: true })
      favorites.value.push(restaurantId)
    }
  } catch (error) {
    console.error('Error al actualizar favoritos', error)
  }
}

const viewRestaurant = (restaurantId) => { router.push(`/restaurante/${restaurantId}`) }
const goTo = (path) => { showProfileMenu.value = false; router.push(path) }
const logout = () => { router.push('/login') }

// Cargar datos iniciales
onMounted(async () => {
  try {
    loading.value = true
    const res = await axios.get('http://localhost:3000/restaurants', { withCredentials: true })
    restaurants.value = res.data

    const favRes = await axios.get('http://localhost:3000/favorites', { withCredentials: true })
    favorites.value = favRes.data.map(f => f.restaurantId)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

// Cerrar menú de perfil al hacer click fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-section')) showProfileMenu.value = false
})
</script>




<style scoped>
* {
  box-sizing: border-box;
}

.client-home-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* Header */
.client-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logo-section h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
}

.user-section {
  display: flex;
  gap: 15px;
  align-items: center;
  position: relative;
}

.btn-cart {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  color: white;
  backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.3s;
}

.btn-cart:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.btn-profile {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  color: white;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-profile:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-profile i {
  font-size: 1.2rem;
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-dropdown button {
  width: 100%;
  padding: 15px 20px;
  border: none;
  background: white;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;
  color: #333;
}

.profile-dropdown button:hover {
  background: #f5f5f5;
}

.profile-dropdown button i {
  width: 20px;
  color: #667eea;
}

.logout-btn {
  border-top: 1px solid #eee !important;
}

.logout-btn i {
  color: #ff4757 !important;
}

/* Barra de búsqueda */
.search-bar {
  max-width: 1400px;
  margin: 0 auto 20px;
  background: white;
  border-radius: 50px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-bar i {
  color: #667eea;
  font-size: 1.2rem;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #333;
}

.search-bar input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 1.2rem;
  padding: 5px;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #333;
}

/* Filtros de categorías */
.categories-filter {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.categories-filter::-webkit-scrollbar {
  height: 5px;
}

.categories-filter::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.category-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  color: white;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  transition: all 0.3s;
  font-weight: 600;
}

.category-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.category-btn.active {
  background: white;
  color: #667eea;
}

/* Main content */
.client-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Banner promocional */
.promo-banner {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  color: white;
  text-align: center;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
}

.banner-content h2 {
  margin: 0 0 10px 0;
  font-size: 2rem;
}

.banner-content p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Secciones */
.featured-section,
.restaurants-section {
  margin-bottom: 50px;
}

.featured-section h2,
.restaurants-section h2,
.quick-access h2 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-header p {
  color: #666;
  margin: 0;
}

/* Carrusel de destacados */
.restaurants-carousel {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
  scroll-snap-type: x mandatory;
}

.restaurants-carousel::-webkit-scrollbar {
  height: 8px;
}

.restaurants-carousel::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 10px;
}

/* Grid de restaurantes */
.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

/* Tarjeta de restaurante */
.restaurant-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  scroll-snap-align: start;
}

.restaurant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.restaurant-card.featured {
  min-width: 350px;
}

.restaurant-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.restaurant-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.restaurant-card:hover .restaurant-image img {
  transform: scale(1.1);
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.favorite-btn:hover {
  background: white;
  transform: scale(1.1);
}

.favorite-btn .fa-solid {
  color: #ff4757;
}

.favorite-btn .fa-regular {
  color: #666;
}

.promo-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ff4757;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.closed-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.restaurant-info {
  padding: 20px;
}

.restaurant-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.3rem;
}

.restaurant-category {
  color: #666;
  margin: 0 0 15px 0;
  font-size: 0.9rem;
}

.restaurant-meta {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.restaurant-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: #666;
}

.rating {
  color: #ffa500 !important;
  font-weight: bold;
}

/* Estados de carga y vacío */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
}

.empty-state i {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

/* Acceso rápido */
.quick-access {
  margin-top: 50px;
}

.quick-buttons {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.quick-btn {
  flex: 1;
  min-width: 150px;
  background: white;
  border: none;
  padding: 25px;
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.quick-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.quick-btn i {
  font-size: 2rem;
  color: #667eea;
}

.quick-btn span {
  color: #333;
  font-weight: 600;
}

/* Botón flotante del carrito */
.fab-cart {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  box-shadow: 0 5px 25px rgba(102, 126, 234, 0.5);
  transition: all 0.3s;
  z-index: 999;
}

.fab-cart:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.7);
}

.fab-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  border: 3px solid white;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
  }

  .categories-filter {
    gap: 5px;
  }

  .category-btn {
    font-size: 0.9rem;
    padding: 8px 15px;
  }

  .restaurants-grid {
    grid-template-columns: 1fr;
  }

  .promo-banner {
    padding: 25px;
  }

  .banner-content h2 {
    font-size: 1.5rem;
  }

  .quick-buttons {
    flex-direction: column;
  }

  .fab-cart {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}
</style>