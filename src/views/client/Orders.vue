<template>
  <div class="orders-container">
    <header class="orders-header">
      <h1>📦 Mis Pedidos</h1>
      <button class="btn btn-back" @click="goTo('/home')">
        ← Volver
      </button>
    </header>

    <main class="orders-main">
      <!-- Filtros de estado -->
      <div class="order-filters">
        <button 
          v-for="status in orderStatuses" 
          :key="status.value"
          :class="['filter-btn', { active: filterStatus === status.value }]"
          @click="filterStatus = status.value"
        >
          {{ status.icon }} {{ status.label }}
        </button>
      </div>

      <!-- Listado de pedidos -->
      <div v-if="loading" class="loading">
        <p>Cargando pedidos...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button class="btn btn-retry" @click="fetchOrders">Reintentar</button>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="no-orders">
        <p>📭 No tienes pedidos {{ filterStatus !== 'todos' ? `en estado "${filterStatus}"` : '' }}</p>
        <button class="btn btn-primary" @click="goTo('/buscar-restaurantes')">
          Hacer un pedido
        </button>
      </div>

      <div v-else class="orders-list">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id"
          class="order-card"
          :class="`status-${order.estado}`"
        >
          <!-- Header del pedido -->
          <div class="order-header">
            <div class="order-info">
              <h3>{{ order.restauranteNombre }}</h3>
              <span class="order-id">Pedido #{{ order.id }}</span>
            </div>
            <span :class="['order-status', `status-${order.estado}`]">
              {{ getStatusLabel(order.estado) }}
            </span>
          </div>

          <!-- Detalles del pedido -->
          <div class="order-details">
            <div class="order-date">
              <i class="fa-regular fa-clock"></i>
              {{ formatDate(order.fecha) }}
            </div>
            
            <div class="order-items">
              <p><strong>Productos:</strong></p>
              <ul>
                <li v-for="item in order.items" :key="item.id">
                  {{ item.cantidad }}x {{ item.nombre }} - ${{ item.precio * item.cantidad }}
                </li>
              </ul>
            </div>

            <div class="order-total">
              <strong>Total:</strong> ${{ order.total }}
            </div>

            <!-- Información del repartidor (si está asignado) -->
            <div v-if="order.repartidor" class="order-driver">
              <i class="fa-solid fa-motorcycle"></i>
              <span>Repartidor: {{ order.repartidor.nombre }}</span>
            </div>

            <!-- Dirección de entrega -->
            <div class="order-address">
              <i class="fa-solid fa-location-dot"></i>
              <span>{{ order.direccion }}</span>
            </div>
          </div>

          <!-- Acciones según estado -->
          <div class="order-actions">
            <button 
              v-if="order.estado === 'pendiente'" 
              class="btn btn-danger btn-sm"
              @click="cancelOrder(order.id)"
            >
              Cancelar pedido
            </button>
            
            <button 
              v-if="order.estado === 'entregado'" 
              class="btn btn-primary btn-sm"
              @click="rateOrder(order.id)"
            >
              Calificar
            </button>

            <button 
              class="btn btn-secondary btn-sm"
              @click="viewOrderDetails(order.id)"
            >
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrdersByDriver } from '@/services/orderService'

const router = useRouter()

const orders = ref([])
const loading = ref(false)
const error = ref(null)
const filterStatus = ref('todos')

const orderStatuses = [
  { value: 'todos', label: 'Todos', icon: '📋' },
  { value: 'pendiente', label: 'Pendiente', icon: '⏳' },
  { value: 'preparando', label: 'Preparando', icon: '👨‍🍳' },
  { value: 'en_camino', label: 'En camino', icon: '🛵' },
  { value: 'entregado', label: 'Entregado', icon: '✅' },
  { value: 'cancelado', label: 'Cancelado', icon: '❌' }
]

const filteredOrders = computed(() => {
  if (filterStatus.value === 'todos') return orders.value
  return orders.value.filter(o => o.estado === filterStatus.value)
})

const fetchOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Simular llamada a API - reemplazar con tu servicio real
    // const response = await getOrdersByDriver(clientId)
    
    // Datos de ejemplo
    orders.value = [
      {
        id: 1,
        restauranteNombre: 'Pizza Palace',
        fecha: new Date(),
        estado: 'en_camino',
        total: 2500,
        direccion: 'Av. Colón 1234',
        repartidor: { nombre: 'Juan Pérez' },
        items: [
          { id: 1, nombre: 'Pizza Muzzarella', cantidad: 2, precio: 1000 },
          { id: 2, nombre: 'Coca Cola 1.5L', cantidad: 1, precio: 500 }
        ]
      },
      {
        id: 2,
        restauranteNombre: 'Burger King',
        fecha: new Date(Date.now() - 86400000),
        estado: 'entregado',
        total: 1800,
        direccion: 'Av. Colón 1234',
        repartidor: { nombre: 'María García' },
        items: [
          { id: 3, nombre: 'Whopper Combo', cantidad: 1, precio: 1800 }
        ]
      }
    ]
  } catch (err) {
    error.value = 'Error al cargar los pedidos'
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
  }
}

const getStatusLabel = (status) => {
  const statusObj = orderStatuses.find(s => s.value === status)
  return statusObj ? `${statusObj.icon} ${statusObj.label}` : status
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) {
    return `Hace ${diffMins} minutos`
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60)
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    return d.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const cancelOrder = async (orderId) => {
  if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
    try {
      // Implementar lógica de cancelación
      console.log('Cancelando pedido:', orderId)
      await fetchOrders()
    } catch (err) {
      alert('Error al cancelar el pedido')
    }
  }
}

const rateOrder = (orderId) => {
  router.push(`/calificar/${orderId}`)
}

const viewOrderDetails = (orderId) => {
  router.push(`/pedido/${orderId}`)
}

const goTo = (path) => {
  router.push(path)
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.orders-header h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-3px);
}

.orders-main {
  max-width: 1200px;
  margin: 0 auto;
}

.order-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.filter-btn.active {
  background: white;
  color: #667eea;
  border-color: white;
}

.loading, .error-message, .no-orders {
  background: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.orders-list {
  display: grid;
  gap: 20px;
}

.order-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}

.order-card:hover {
  transform: translateY(-5px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.order-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.order-id {
  color: #999;
  font-size: 0.9rem;
}

.order-status {
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.status-pendiente { background: #fff3cd; color: #856404; }
.status-preparando { background: #cfe2ff; color: #084298; }
.status-en_camino { background: #d1ecf1; color: #0c5460; }
.status-entregado { background: #d4edda; color: #155724; }
.status-cancelado { background: #f8d7da; color: #721c24; }

.order-details {
  margin: 15px 0;
}

.order-date, .order-driver, .order-address {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  color: #666;
}

.order-items {
  margin: 15px 0;
}

.order-items ul {
  list-style: none;
  padding: 0;
  margin: 5px 0;
}

.order-items li {
  padding: 5px 0;
  color: #666;
}

.order-total {
  font-size: 1.2rem;
  color: #667eea;
  margin: 15px 0;
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #f0f0f0;
}

.btn-sm {
  padding: 8px 15px;
  font-size: 0.9rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-retry {
  margin-top: 15px;
  background: #667eea;
  color: white;
}

@media (max-width: 768px) {
  .orders-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .order-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  .filter-btn {
    font-size: 0.9rem;
    padding: 8px 15px;
  }
}
</style>