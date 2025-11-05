<template>
  <div class="seller-orders-container">
    <header class="seller-header">
      <div class="header-info">
        <h1>🍔 Panel del Vendedor</h1>
        <p>{{ restaurantName }}</p>
      </div>
      <button class="btn btn-logout" @click="goTo('/home')">
        Cerrar sesión
      </button>
    </header>

    <main class="seller-main">
      <!-- Estadísticas rápidas -->
      <div class="stats-grid">
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <h3>{{ pendingOrders }}</h3>
            <p>Pendientes</p>
          </div>
        </div>
        <div class="stat-card preparing">
          <div class="stat-icon">👨‍🍳</div>
          <div class="stat-info">
            <h3>{{ preparingOrders }}</h3>
            <p>En preparación</p>
          </div>
        </div>
        <div class="stat-card ready">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ readyOrders }}</h3>
            <p>Listos</p>
          </div>
        </div>
        <div class="stat-card today">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>${{ todayRevenue }}</h3>
            <p>Ventas hoy</p>
          </div>
        </div>
      </div>

      <!-- Tabs de navegación -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          :class="['tab-btn', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value"
        >
          {{ tab.icon }} {{ tab.label }}
          <span v-if="tab.count" class="tab-badge">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Listado de pedidos -->
      <div v-if="loading" class="loading">
        <p>Cargando pedidos...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="no-orders">
        <p>📭 No hay pedidos {{ activeTab !== 'todos' ? `en estado "${activeTab}"` : '' }}</p>
      </div>

      <div v-else class="orders-grid">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id"
          class="seller-order-card"
          :class="`priority-${order.prioridad || 'normal'}`"
        >
          <!-- Header del pedido -->
          <div class="seller-order-header">
            <div class="order-number">
              <h3>Pedido #{{ order.id }}</h3>
              <span class="order-time">{{ formatTime(order.fecha) }}</span>
            </div>
            <span :class="['order-priority', `priority-${order.prioridad || 'normal'}`]">
              {{ order.prioridad === 'alta' ? '🔥 Urgente' : '⏱️ Normal' }}
            </span>
          </div>

          <!-- Info del cliente -->
          <div class="customer-info">
            <i class="fa-solid fa-user"></i>
            <div>
              <strong>{{ order.clienteNombre }}</strong>
              <p>{{ order.clienteTelefono }}</p>
            </div>
          </div>

          <!-- Items del pedido -->
          <div class="order-items">
            <h4>Productos:</h4>
            <ul>
              <li v-for="item in order.items" :key="item.id">
                <span class="item-qty">{{ item.cantidad }}x</span>
                <span class="item-name">{{ item.nombre }}</span>
                <span v-if="item.notas" class="item-notes">
                  📝 {{ item.notas }}
                </span>
              </li>
            </ul>
          </div>

          <!-- Dirección de entrega -->
          <div class="delivery-info">
            <i class="fa-solid fa-location-dot"></i>
            <span>{{ order.direccion }}</span>
          </div>

          <!-- Total del pedido -->
          <div class="order-total">
            <strong>Total:</strong>
            <span class="total-amount">${{ order.total }}</span>
          </div>

          <!-- Acciones según estado -->
          <div class="seller-order-actions">
            <button 
              v-if="order.estado === 'pendiente'"
              class="btn btn-accept"
              @click="acceptOrder(order.id)"
            >
              ✅ Aceptar
            </button>
            
            <button 
              v-if="order.estado === 'pendiente'"
              class="btn btn-reject"
              @click="rejectOrder(order.id)"
            >
              ❌ Rechazar
            </button>

            <button 
              v-if="order.estado === 'preparando'"
              class="btn btn-ready"
              @click="markAsReady(order.id)"
            >
              🍕 Marcar listo
            </button>

            <button 
              v-if="order.estado === 'listo'"
              class="btn btn-info"
            >
              ⏳ Esperando repartidor
            </button>

            <button 
              class="btn btn-details"
              @click="viewOrderDetails(order.id)"
            >
              Ver detalles
            </button>
          </div>

          <!-- Tiempo de preparación estimado -->
          <div v-if="order.estado === 'preparando'" class="prep-time">
            <i class="fa-regular fa-clock"></i>
            Tiempo estimado: {{ order.tiempoEstimado || 30 }} min
          </div>
        </div>
      </div>
    </main>

    <!-- Botón flotante para gestionar productos -->
    <button class="fab" @click="goTo('/mis-productos')">
      <i class="fa-solid fa-boxes-stacked"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrdersByDriver } from '@/services/orderService'

const router = useRouter()

const restaurantName = ref('Mi Restaurante')
const orders = ref([])
const loading = ref(false)
const error = ref(null)
const activeTab = ref('pendientes')

const tabs = computed(() => [
  { value: 'pendientes', label: 'Pendientes', icon: '⏳', count: pendingOrders.value },
  { value: 'preparando', label: 'En preparación', icon: '👨‍🍳', count: preparingOrders.value },
  { value: 'listo', label: 'Listos', icon: '✅', count: readyOrders.value },
  { value: 'en_camino', label: 'En camino', icon: '🛵', count: 0 },
  { value: 'todos', label: 'Historial', icon: '📋', count: null }
])

const pendingOrders = computed(() => 
  orders.value.filter(o => o.estado === 'pendiente').length
)

const preparingOrders = computed(() => 
  orders.value.filter(o => o.estado === 'preparando').length
)

const readyOrders = computed(() => 
  orders.value.filter(o => o.estado === 'listo').length
)

const todayRevenue = computed(() => {
  const today = new Date().toDateString()
  return orders.value
    .filter(o => new Date(o.fecha).toDateString() === today && o.estado !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0)
})

const filteredOrders = computed(() => {
  if (activeTab.value === 'todos') return orders.value
  return orders.value.filter(o => o.estado === activeTab.value)
})

const fetchOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Datos de ejemplo - reemplazar con llamada real a API
    orders.value = [
      {
        id: 101,
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '351-123-4567',
        fecha: new Date(),
        estado: 'pendiente',
        prioridad: 'alta',
        total: 2500,
        direccion: 'Av. Colón 1234',
        items: [
          { id: 1, nombre: 'Pizza Muzzarella Grande', cantidad: 2, notas: 'Sin aceitunas' },
          { id: 2, nombre: 'Coca Cola 1.5L', cantidad: 1 }
        ],
        tiempoEstimado: 30
      },
      {
        id: 102,
        clienteNombre: 'María García',
        clienteTelefono: '351-987-6543',
        fecha: new Date(Date.now() - 600000),
        estado: 'preparando',
        prioridad: 'normal',
        total: 1800,
        direccion: 'San Martín 567',
        items: [
          { id: 3, nombre: 'Hamburguesa Completa', cantidad: 2 },
          { id: 4, nombre: 'Papas fritas grandes', cantidad: 1 }
        ],
        tiempoEstimado: 20
      },
      {
        id: 103,
        clienteNombre: 'Carlos López',
        clienteTelefono: '351-456-7890',
        fecha: new Date(Date.now() - 1200000),
        estado: 'listo',
        prioridad: 'normal',
        total: 3200,
        direccion: 'Belgrano 890',
        items: [
          { id: 5, nombre: 'Milanesa napolitana', cantidad: 1 },
          { id: 6, nombre: 'Ensalada mixta', cantidad: 1 }
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

const formatTime = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  
  return d.toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

const acceptOrder = async (orderId) => {
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.estado = 'preparando'
      // Llamar a API para actualizar estado
    }
  } catch (err) {
    alert('Error al aceptar el pedido')
  }
}

const rejectOrder = async (orderId) => {
  const reason = prompt('Motivo del rechazo:')
  if (reason) {
    try {
      const order = orders.value.find(o => o.id === orderId)
      if (order) {
        order.estado = 'cancelado'
        // Llamar a API para actualizar estado
      }
    } catch (err) {
      alert('Error al rechazar el pedido')
    }
  }
}

const markAsReady = async (orderId) => {
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.estado = 'listo'
      // Llamar a API para actualizar estado
    }
  } catch (err) {
    alert('Error al marcar como listo')
  }
}

const viewOrderDetails = (orderId) => {
  router.push(`/vendedor/pedido/${orderId}`)
}

const goTo = (path) => {
  router.push(path)
}

onMounted(() => {
  fetchOrders()
  // Actualizar pedidos cada 30 segundos
  setInterval(fetchOrders, 30000)
})
</script>

<style scoped>
.seller-orders-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.seller-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-info h1 {
  color: white;
  font-size: 2rem;
  margin: 0 0 5px 0;
}

.header-info p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.seller-main {
  max-width: 1400px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid transparent;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tab-btn.active {
  background: white;
  color: #f5576c;
}

.tab-badge {
  background: #f5576c;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.85rem;
}

.tab-btn.active .tab-badge {
  background: #f5576c;
  color: white;
}

.loading, .error-message, .no-orders {
  background: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.seller-order-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 4px solid #ccc;
}

.seller-order-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.seller-order-card.priority-alta {
  border-left-color: #ff4757;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 5px 20px rgba(255, 71, 87, 0.2); }
  50% { box-shadow: 0 5px 30px rgba(255, 71, 87, 0.4); }
}

.seller-order-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.order-number h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.3rem;
}

.order-time {
  color: #999;
  font-size: 0.85rem;
}

.order-priority {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: bold;
}

.priority-alta {
  background: #ffebee;
  color: #c62828;
}

.priority-normal {
  background: #e3f2fd;
  color: #1565c0;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 15px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

.customer-info i {
  font-size: 1.5rem;
  color: #f5576c;
}

.customer-info strong {
  display: block;
  color: #333;
}

.customer-info p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.order-items {
  margin: 15px 0;
}

.order-items h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1rem;
}

.order-items ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.order-items li {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #f0f0f0;
}

.order-items li:last-child {
  border-bottom: none;
}

.item-qty {
  color: #f5576c;
  font-weight: bold;
  margin-right: 8px;
}

.item-name {
  color: #333;
}

.item-notes {
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 5px;
}

.delivery-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
  color: #666;
}

.delivery-info i {
  color: #f5576c;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.total-amount {
  font-size: 1.4rem;
  color: #f5576c;
  font-weight: bold;
}

.seller-order-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.seller-order-actions .btn {
  flex: 1;
  min-width: 120px;
  padding: 10px;
  font-size: 0.9rem;
}

.btn-accept {
  background: #4caf50;
  color: white;
}

.btn-accept:hover {
  background: #45a049;
}

.btn-reject {
  background: #f44336;
  color: white;
}

.btn-reject:hover {
  background: #da190b;
}

.btn-ready {
  background: #2196f3;
  color: white;
}

.btn-ready:hover {
  background: #0b7dda;
}

.btn-info {
  background: #ff9800;
  color: white;
  cursor: default;
}

.btn-details {
  background: #9e9e9e;
  color: white;
}

.btn-details:hover {
  background: #757575;
}

.prep-time {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  background: #fff3e0;
  border-radius: 8px;
  color: #e65100;
  font-size: 0.9rem;
}

.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  color: #f5576c;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .seller-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
}
</style>