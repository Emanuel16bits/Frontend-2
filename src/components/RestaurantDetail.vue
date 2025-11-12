<template>
  <div class="restaurant-detail">
    <div class="restaurant-header">
      <img :src="restaurant.image" :alt="restaurant.nombre" class="restaurant-cover">
      <div class="header-overlay">
        <h1>{{ restaurant.nombre }}</h1>
        <div class="restaurant-meta">
          <span class="category">
            <i class="fas fa-utensils"></i> {{ restaurant.categoria }}
          </span>
          <span class="rating">
            <i class="fas fa-star"></i> {{ restaurant.rating?.toFixed(1) || 'Nuevo' }}
          </span>
          <span class="status-badge" :class="isOpen ? 'open' : 'closed'">
            {{ isOpen ? 'Abierto' : 'Cerrado' }}
          </span>
        </div>
      </div>
    </div>

    <div class="restaurant-info">
      <div class="info-section">
        <h2><i class="fas fa-info-circle"></i> Información</h2>
        <p>{{ restaurant.descripcion || 'Sin descripción disponible.' }}</p>
        
        <div class="info-grid">
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <div>
              <h3>Dirección</h3>
              <p>{{ restaurant.direccion || 'No especificada' }}</p>
            </div>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <div>
              <h3>Teléfono</h3>
              <p>{{ restaurant.telefono || 'No especificado' }}</p>
            </div>
          </div>
          <div class="info-item">
            <i class="far fa-clock"></i>
            <div>
              <h3>Horario</h3>
              <p v-if="restaurant.horarioApertura && restaurant.horarioCierre">
                {{ formatTime(restaurant.horarioApertura) }} - {{ formatTime(restaurant.horarioCierre) }}
              </p>
              <p v-else>No especificado</p>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <h2><i class="fas fa-utensils"></i> Menú</h2>
        
        <div v-if="loadingMenu" class="loading-message">
          <p>Cargando menú...</p>
        </div>
        
        <div v-else-if="menuCategories.length === 0" class="empty-menu">
          <p>No hay productos disponibles en este momento</p>
        </div>
        
        <div v-else>
          <div v-for="category in menuCategories" :key="category.id" class="menu-category">
            <h3>{{ category.nombre }}</h3>
            <div class="menu-items">
              <div v-for="item in category.items" :key="item.id" class="menu-item">
                <div class="item-image">
                  <img 
                    :src="item.imagen || 'https://via.placeholder.com/80'" 
                    :alt="item.nombre"
                    @error="(e) => { e.target.src = 'https://via.placeholder.com/80' }"
                  >
                </div>
                <div class="item-info">
                  <h4>{{ item.nombre }}</h4>
                  <p class="item-description">{{ item.descripcion }}</p>
                  <p class="item-price">${{ item.precio.toFixed(2) }}</p>
                </div>
                <button 
                  class="add-to-cart" 
                  @click="addToCart(item)" 
                  :disabled="!isOpen"
                  :title="!isOpen ? 'El restaurante está cerrado' : 'Agregar al carrito'"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useCartStore } from '@/services/cartStore'

const route = useRoute()
const cartStore = useCartStore()

const restaurant = ref({
  id: '',
  nombre: '',
  categoria: '',
  descripcion: '',
  direccion: '',
  telefono: '',
  horarioApertura: '09:00:00',
  horarioCierre: '22:00:00',
  image: 'https://via.placeholder.com/1200x400',
  rating: 0,
  deliveryCost: 0
})

const menuCategories = ref([])
const loadingMenu = ref(true)

const isOpen = computed(() => {
  try {
    if (!restaurant.value.horarioApertura || !restaurant.value.horarioCierre) return false
    
    const now = new Date()
    const [hours, minutes] = [now.getHours(), now.getMinutes()]
    const currentTime = hours * 60 + minutes
    
    const [openH, openM] = restaurant.value.horarioApertura.split(':').map(Number)
    const [closeH, closeM] = restaurant.value.horarioCierre.split(':').map(Number)
    
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM
    
    return currentTime >= openTime && currentTime <= closeTime
  } catch (error) {
    console.error('Error al verificar horario:', error)
    return false
  }
})

const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div')
  notification.className = `native-notification ${type}`
  notification.textContent = message
  
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#4caf50' : '#f44336',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: '1000',
    animation: 'slideUp 0.3s ease-out',
    maxWidth: '90%',
    textAlign: 'center'
  })
  
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style')
    style.id = 'notification-styles'
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
      }
      .native-notification {
        animation: slideUp 0.3s ease-out;
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out'
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  return timeString.slice(0, 5)
}

const addToCart = (item) => {
  if (!isOpen.value) {
    showNotification('El restaurante está cerrado en este momento', 'error')
    return
  }

  try {
    const price = typeof item.precio === 'string' 
      ? parseFloat(item.precio) 
      : item.precio

    cartStore.addItem({
      id: item.id,
      name: item.nombre,
      price: price,
      quantity: 1,
      restaurantId: route.params.id,
      restaurantName: restaurant.value.nombre,
      imagen: item.imagen,
      descripcion: item.descripcion
    })
    
    showNotification(`${item.nombre} agregado al carrito`, 'success')
  } catch (error) {
    console.error('Error al agregar al carrito', error)
    showNotification('Error al agregar al carrito', 'error')
  }
}

const fetchRestaurant = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/restaurants/${route.params.id}`)
    restaurant.value = { ...restaurant.value, ...res.data }
  } catch (error) {
    console.error('Error al cargar el restaurante', error)
    showNotification('No se pudo cargar la informacion del restaurante', 'error')
  }
}

const fetchMenu = async () => {
  try {
    loadingMenu.value = true
    
    console.log('id del restaurante en la URL', route.params.id)
    
    const response = await axios.get('http://localhost:3000/products')
    console.log('Todos los productos', response.data)
    
    const restaurantProducts = response.data || []
    
    console.log('Productos del restaurante', restaurantProducts)
    
    if (restaurantProducts.length === 0) {
      console.log('No hay productos para este restaurante')
      menuCategories.value = []
      return
    }
    
    menuCategories.value = [{
      id: 'default-category',
      nombre: 'Menú',
      items: restaurantProducts.map(product => ({
        id: product.idProduct,
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio: parseFloat(product.precio) || 0,
        imagen: product.imagen || 'https://via.placeholder.com/80'
      }))
    }]
    
    console.log('Menu organizado', menuCategories.value)
    
  } catch (error) {
    console.error('Error al cargar el menu', error)
    showNotification('No se pudo cargar el menu del restaurante', 'error')
  } finally {
    loadingMenu.value = false
  }
}

onMounted(async () => {
  await fetchRestaurant()
  await fetchMenu()
})
</script>

<style scoped>
.restaurant-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 40px;
  position: relative;
}

.restaurant-header {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.restaurant-cover {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}

.header-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
}

.header-overlay h1 {
  margin: 0 0 8px;
  font-size: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.restaurant-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.category, .rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
}

.rating {
  background: rgba(255, 215, 0, 0.2);
}

.status-badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.status-badge.open {
  background-color: #4caf50;
  color: white;
}

.status-badge.closed {
  background-color: #f44336;
  color: white;
}

.restaurant-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.info-section, .menu-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-section h2, .menu-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.info-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.info-item i {
  font-size: 1.2rem;
  color: #667eea;
  margin-top: 4px;
}

.info-item h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
  color: #333;
}

.info-item p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.menu-category {
  margin-bottom: 32px;
}

.menu-category h3 {
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.menu-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
  gap: 12px;
}

.menu-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h4 {
  margin: 0 0 8px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-description {
  margin: 0 0 8px;
  color: #666;
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.add-to-cart {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-shrink: 0;
  align-self: center;
}

.add-to-cart:hover:not(:disabled) {
  background-color: #45a049;
}

.add-to-cart:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.loading-message,
.empty-menu {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-message p,
.empty-menu p {
  margin: 0;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .menu-items {
    grid-template-columns: 1fr;
  }
  
  .restaurant-cover {
    height: 200px;
  }
  
  .header-overlay h1 {
    font-size: 1.5rem;
  }
}
</style>