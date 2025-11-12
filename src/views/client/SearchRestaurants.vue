<template>
  <div class="search-restaurants">
    <header class="header">
      <div class="container">
        <h1>Restaurantes</h1>
        <button @click="goBack" class="btn-back">← Volver</button>
      </div>
    </header>
    <div class="search-section">
      <div class="container">
        <div class="search-box">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Buscar restaurantes o categorías..."
            class="search-input"
          />
          <button class="search-btn">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="categories-section">
      <div class="container">
        <h2>Categorías</h2>
        <div class="categories-grid">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card"
            :class="{ active: selectedCategory === category.id }"
            @click="toggleCategory(category.id)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="results-section">
      <div class="container">
        <div class="results-header">
          <h2>
            {{ filteredRestaurants.length }} restaurantes
            <span v-if="searchQuery || selectedCategory">encontrados</span>
          </h2>
          <button v-if="searchQuery || selectedCategory" @click="clearFilters" class="btn-clear">
            Limpiar filtros
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando restaurantes...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="fetchRestaurants" class="btn-retry">Reintentar</button>
        </div>

        <div v-else-if="filteredRestaurants.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No encontramos resultados</h3>
          <p>Intenta con otra búsqueda</p>
        </div>

        <div v-else class="restaurants-grid">
          <div
            v-for="restaurant in filteredRestaurants"
            :key="restaurant.id"
            class="restaurant-card"
            @click="goToRestaurant(restaurant.id)"
          >
            <div class="restaurant-image">
              <img :src="restaurant.image || 'https://via.placeholder.com/400x300'" :alt="restaurant.name" />
              <button
                @click.stop="toggleFavorite(restaurant.id)"
                class="btn-favorite"
                :class="{ active: isFavorite(restaurant.id) }"
              >
                <i :class="isFavorite(restaurant.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
              </button>
              <span v-if="restaurant.isNew" class="badge badge-new">Nuevo</span>
              <span v-if="restaurant.hasPromo" class="badge badge-promo">Promo</span>
            </div>
            <div class="restaurant-info">
              <h3>{{ restaurant.name }}</h3>
              <p class="restaurant-category">{{ restaurant.emoji }} {{ restaurant.category }}</p>
              <div class="restaurant-meta">
                <span class="rating">
                  <i class="fa-solid fa-star"></i>
                  {{ restaurant.rating || '4.5' }}
                </span>
                <span class="delivery-time">
                  <i class="fa-solid fa-clock"></i>
                  {{ restaurant.deliveryTime || '30-40' }} min
                </span>
                <span class="delivery-fee">
                  <i class="fa-solid fa-motorcycle"></i>
                  ${{ restaurant.deliveryFee || 150 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRestaurantsStore } from '@/stores/restaurants'

const router = useRouter()
const restaurantsStore = useRestaurantsStore()

const searchQuery = ref('')
const selectedCategory = ref(null)

const restaurants = computed(() => restaurantsStore.restaurants)
const categories = computed(() => restaurantsStore.categories)
const loading = computed(() => restaurantsStore.loading)
const error = computed(() => restaurantsStore.error)

const filteredRestaurants = computed(() => {
  let result = restaurants.value

  if (selectedCategory.value) {
    result = result.filter(r => r.categoryId === selectedCategory.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    )
  }

  return result
})

const handleSearch = () => {
}

const toggleCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
}

const toggleFavorite = (restaurantId) => {
  restaurantsStore.toggleFavorite(restaurantId)
}

const isFavorite = (restaurantId) => {
  return restaurantsStore.isFavorite(restaurantId)
}

const goToRestaurant = (restaurantId) => {
  router.push(`/restaurante/${restaurantId}`)
}

const goBack = () => {
  router.push('/home-cliente')
}

const fetchRestaurants = async () => {
  await restaurantsStore.fetchRestaurants()
}
onMounted(async () => {
  if (restaurants.value.length === 0) {
    await fetchRestaurants()
  }
})
</script>

<style scoped>
.search-restaurants {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 28px;
}

.btn-back {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-section {
  background-color: white;
  padding: 30px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.search-box {
  display: flex;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-btn {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 18px;
}

.categories-section {
  padding: 30px 0;
}

.categories-section h2 {
  margin-bottom: 20px;
  font-size: 24px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.category-card {
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.category-card.active {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.category-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
}

.results-section {
  padding: 30px 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.results-header h2 {
  margin: 0;
  font-size: 24px;
}

.btn-clear {
  background-color: #ff4757;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.btn-retry {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.restaurants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.restaurant-card {
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.restaurant-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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

.btn-favorite {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: white;
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  font-size: 20px;
  color: #ccc;
  transition: all 0.3s;
  z-index: 10;
}

.btn-favorite.active {
  color: #ff4757;
}

.badge {
  position: absolute;
  top: 15px;
  left: 15px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.badge-new {
  background-color: #10ac84;
  color: white;
}

.badge-promo {
  background-color: #ff9ff3;
  color: white;
}

.restaurant-info {
  padding: 20px;
}

.restaurant-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.restaurant-category {
  color: #666;
  font-size: 14px;
  margin: 0 0 15px 0;
}

.restaurant-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
}

.restaurant-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rating i {
  color: #ffa502;
}

@media (max-width: 768px) {
  .restaurants-grid {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
