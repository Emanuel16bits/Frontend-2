<template>
  <div class="driver-container">
    <header class="driver-header">
      <div class="header-info">
        <h1>🛵 Panel del Repartidor</h1>
        <p>{{ driverName }}</p>
      </div>
      <div class="header-actions">
        <button 
          :class="['btn-status', { online: isOnline }]"
          @click="toggleStatus"
        >
          {{ isOnline ? '🟢 Disponible' : '🔴 No disponible' }}
        </button>
        <button class="btn btn-logout" @click="goTo('/home')">
          Salir
        </button>
      </div>
    </header>

    <main class="driver-main">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>{{ todayDeliveries }}</h3>
            <p>Entregas hoy</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>${{ todayEarnings }}</h3>
            <p>Ganado hoy</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <h3>{{ driverRating }}</h3>
            <p>Calificación</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <h3>{{ avgDeliveryTime }} min</h3>
            <p>Tiempo promedio</p>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          :class="['tab-btn', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value"
        >
          {{ tab.icon }} {{ tab.label }}
          <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="!isOnline" class="offline-alert">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Estás en modo "No disponible". No recibirás nuevos pedidos.</p>
        <button class="btn btn-primary" @click="toggleStatus">
          Activar disponibilidad
        </button>
      </div>

      <div v-if="loading" class="loading">
        <p>Cargando pedidos...</p>
      </div>

      <div v-else-if="filteredDeliveries.length === 0" class="no-deliveries">
        <p>📭 No hay entregas {{ activeTab !== 'disponibles' ? `en estado "${activeTab}"` : 'disponibles' }}</p>
      </div>

      <div v-else class="deliveries-grid">
        <div 
          v-for="delivery in filteredDeliveries" 
          :key="delivery.id"
          class="delivery-card"
          :class="delivery.estado"
        >
          <div class="delivery-header">
            <div class="delivery-number">
              <h3>Pedido #{{ delivery.id }}</h3>
              <span class="delivery-time">{{ formatTime(delivery.fecha) }}</span>
            </div>
            <span :class="['delivery-status', delivery.estado]">
              {{ getStatusLabel(delivery.estado) }}
            </span>
          </div>

          <div class="location-section pickup">
            <div class="location-icon">🏪</div>
            <div class="location-info">
              <strong>Recoger en:</strong>
              <p>{{ delivery.restauranteNombre }}</p>
              <p class="address">{{ delivery.restauranteDireccion }}</p>
            </div>
          </div>

          <div class="location-section delivery-loc">
            <div class="location-icon">📍</div>
            <div class="location-info">
              <strong>Entregar a:</strong>
              <p>{{ delivery.clienteNombre }}</p>
              <p class="address">{{ delivery.direccionEntrega }}</p>
              <p class="phone">📞 {{ delivery.clienteTelefono }}</p>
            </div>
          </div>

          <div class="delivery-details">
            <div class="detail-item">
              <i class="fa-solid fa-route"></i>
              <span>{{ delivery.distancia }} km</span>
            </div>
            <div class="detail-item">
              <i class="fa-solid fa-money-bill-wave"></i>
              <span>${{ delivery.costoEnvio }}</span>
            </div>
            <div class="detail-item">
              <i class="fa-solid fa-wallet"></i>
              <span>{{ delivery.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta' }}</span>
            </div>
          </div>

          <div v-if="delivery.metodoPago === 'efectivo'" class="cash-collect">
            <strong>💰 A cobrar:</strong>
            <span class="amount">${{ delivery.total }}</span>
          </div>
          <div v-if="delivery.notas" class="delivery-notes">
            <i class="fa-solid fa-note-sticky"></i>
            <span>{{ delivery.notas }}</span>
          </div>

          <div class="delivery-actions">
            <button 
              v-if="delivery.estado === 'disponible'"
              class="btn btn-accept-delivery"
              @click="acceptDelivery(delivery.id)"
            >
              Aceptar entrega
            </button>

            <template v-if="delivery.estado === 'asignado'">
              <button 
                class="btn btn-primary"
                @click="startPickup(delivery.id)"
              >
                Ir a recoger
              </button>
              <button 
                class="btn btn-secondary"
                @click="cancelDelivery(delivery.id)"
              >
                Cancelar
              </button>
            </template>

            <template v-if="delivery.estado === 'recogiendo'">
              <button 
                class="btn btn-success"
                @click="confirmPickup(delivery.id)"
              >
                Pedido recogido
              </button>
              <button 
                class="btn btn-map"
                @click="openMap(delivery.restauranteDireccion)"
              >
                Ver mapa
              </button>
            </template>

            <template v-if="delivery.estado === 'en_camino'">
              <button 
                class="btn btn-success"
                @click="confirmDelivery(delivery.id)"
              >
                Entregado
              </button>
              <button 
                class="btn btn-map"
                @click="openMap(delivery.direccionEntrega)"
              >
                Ver mapa
              </button>
              <button 
                class="btn btn-call"
                @click="callClient(delivery.clienteTelefono)"
              >
                Llamar
              </button>
            </template>

            <button 
              class="btn btn-details"
              @click="viewDeliveryDetails(delivery.id)"
            >
              Ver detalles
            </button>
          </div>

          <div v-if="['recogiendo', 'en_camino'].includes(delivery.estado)" class="delivery-timer">
            <i class="fa-regular fa-clock"></i>
            Tiempo transcurrido: {{ getElapsedTime(delivery.inicioEntrega) }}
          </div>
        </div>
      </div>
    </main>

    <button class="fab" @click="goTo('/repartidor/historial')">
      <i class="fa-solid fa-clock-rotate-left"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useDriverStore } from '@/stores/driverStore'

const router = useRouter()
const driverStore = useDriverStore()

const driverName = ref('Juan Pérez')
const isOnline = ref(true)
const deliveries = ref([])
const loading = ref(false)
const activeTab = ref('disponibles')

let timerInterval = null

const tabs = computed(() => [
  { 
    value: 'disponibles', 
    label: 'Disponibles', 
    icon: '🆕',
    count: deliveries.value.filter(d => d.estado === 'disponible').length
  },
  { 
    value: 'asignadas', 
    label: 'Mis entregas', 
    icon: '🛵',
    count: deliveries.value.filter(d => ['asignado', 'recogiendo', 'en_camino'].includes(d.estado)).length
  },
  { 
    value: 'completadas', 
    label: 'Completadas', 
    icon: '✅',
    count: 0
  }
])

const todayDeliveries = computed(() => {
  const today = new Date().toDateString()
  return deliveries.value.filter(d => 
    new Date(d.fecha).toDateString() === today && d.estado === 'entregado'
  ).length
})

const todayEarnings = computed(() => {
  const today = new Date().toDateString()
  return deliveries.value
    .filter(d => new Date(d.fecha).toDateString() === today && d.estado === 'entregado')
    .reduce((sum, d) => sum + d.costoEnvio, 0)
})

const driverRating = ref(4.8)
const avgDeliveryTime = ref(25)

const filteredDeliveries = computed(() => {
  switch (activeTab.value) {
    case 'disponibles':
      return deliveries.value.filter(d => d.estado === 'disponible')
    case 'asignadas':
      return deliveries.value.filter(d => ['asignado', 'recogiendo', 'en_camino'].includes(d.estado))
    case 'completadas':
      return deliveries.value.filter(d => d.estado === 'entregado')
    default:
      return deliveries.value
  }
})

const API_URL = 'http://localhost:3000'

const fetchDeliveries = async () => {
  loading.value = true
  
  try {
    const response = await axios.get(`${API_URL}/orders`)
    
    const pedidosEnCamino = response.data.filter(
      pedido => pedido.estado === 'en_camino' || pedido.estado === 'asignado'
    )
    
    deliveries.value = pedidosEnCamino.map(pedido => ({
      id: pedido.id,
      fecha: new Date(pedido.fecha || new Date()),
      estado: pedido.estado,
      restauranteNombre: pedido.restaurante?.nombre || 'Restaurante no especificado',
      restauranteDireccion: pedido.restaurante?.direccion || 'Dirección no disponible',
      clienteNombre: pedido.usuario ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}` : 'Cliente',
      clienteTelefono: pedido.usuario?.telefono || 'Sin teléfono',
      direccionEntrega: pedido.direccion || 'Dirección no especificada',
      distancia: 0,
      costoEnvio: 500,
      total: pedido.total || 0,
      metodoPago: pedido.metodoPago || 'efectivo',
      notas: pedido.notas || '',
      inicioEntrega: pedido.estado === 'en_camino' ? new Date() : null
    }))
    
  } catch (err) {
    console.error('Error al cargar los envíos:', err)
    
    if (err.response) {
      console.error('Detalles del error:', err.response.data)
    } else if (err.request) {
      console.error('No se pudo conectar al servidor')
    }
  } finally {
    loading.value = false
  }
}

const toggleStatus = () => {
  isOnline.value = !isOnline.value
  if (isOnline.value) {
    fetchDeliveries()
  }
}

const getStatusLabel = (status) => {
  const labels = {
    disponible: 'Disponible',
    asignado: 'Asignado',
    recogiendo: 'Recogiendo',
    en_camino: 'En camino',
    entregado: 'Entregado'
  }
  return labels[status] || status
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

const getElapsedTime = (startTime) => {
  if (!startTime) return '0 min'
  
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = now - start
  const diffMins = Math.floor(diffMs / 60000)
  
  return `${diffMins} min`
}

const acceptDelivery = async (deliveryId) => {
  try {
    const delivery = deliveries.value.find(d => d.id === deliveryId)
    if (delivery) {
      delivery.estado = 'asignado'
      delivery.inicioEntrega = new Date()
      activeTab.value = 'asignadas'
    }
  } catch (err) {
    alert('Error al aceptar la entrega')
  }
}

const startPickup = async (deliveryId) => {
  try {
    const delivery = deliveries.value.find(d => d.id === deliveryId)
    if (delivery) {
      delivery.estado = 'recogiendo'
      openMap(delivery.restauranteDireccion)
    }
  } catch (err) {
    alert('Error al iniciar recogida')
  }
}

const confirmPickup = async (deliveryId) => {
  try {
    const delivery = deliveries.value.find(d => d.id === deliveryId)
    if (delivery) {
      delivery.estado = 'en_camino'
    }
  } catch (err) {
    alert('Error al confirmar recogida')
  }
}

const confirmDelivery = async (deliveryId) => {
  if (confirm('¿El pedido fue entregado?')) {
    try {
      const delivery = deliveries.value.find(d => d.id === deliveryId)
      if (delivery) {
        delivery.estado = 'entregado'
        alert('Entrega completada')
        await fetchDeliveries()
      }
    } catch (err) {
      alert('Error al confirmar entrega')
    }
  }
}

const cancelDelivery = async (deliveryId) => {
  const reason = prompt('Motivo de cancelación')
  if (reason) {
    try {
      const delivery = deliveries.value.find(d => d.id === deliveryId)
      if (delivery) {
        delivery.estado = 'disponible'
      }
    } catch (err) {
      alert('Error al cancelar entrega')
    }
  }
}

const openMap = (address) => {
  const encodedAddress = encodeURIComponent(address)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
}

const callClient = (phone) => {
  window.location.href = `tel:${phone}`
}

const viewDeliveryDetails = (deliveryId) => {
  router.push(`/repartidor/entrega/${deliveryId}`)
}

const goTo = (path) => {
  router.push(path)
}

onMounted(() => {
  fetchDeliveries()
  
  timerInterval = setInterval(() => {
    fetchDeliveries()
  }, 30000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.driver-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-status {
  padding: 10px 20px;
  border: 2px solid white;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.btn-status.online {
  background: #4caf50;
  border-color: #4caf50;
}

.btn-status:hover {
  transform: scale(1.05);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
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

.driver-main {
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
  color: #667eea;
}

.tab-badge {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.85rem;
}

.tab-btn.active .tab-badge {
  background: #667eea;
  color: white;
}

.offline-alert {
  background: #fff3cd;
  border: 2px solid #ffc107;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  margin-bottom: 20px;
}

.offline-alert i {
  font-size: 2rem;
  color: #856404;
  margin-bottom: 10px;
}

.offline-alert p {
  margin: 10px 0;
  color: #856404;
}

.loading, .no-deliveries {
  background: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.deliveries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.delivery-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  border-left: 4px solid #667eea;
}

.delivery-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.delivery-card.disponible {
  border-left-color: #4caf50;
}

.delivery-card.en_camino {
  border-left-color: #ff9800;
  animation: pulse-delivery 2s infinite;
}

@keyframes pulse-delivery {
  0%, 100% { box-shadow: 0 5px 20px rgba(255, 152, 0, 0.2); }
  50% { box-shadow: 0 5px 30px rgba(255, 152, 0, 0.4); }
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.delivery-number h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.delivery-time {
  color: #999;
  font-size: 0.85rem;
}

.delivery-status {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: bold;
  background: #e3f2fd;
  color: #1565c0;
}

.location-section {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 10px;
  margin: 15px 0;
}

.location-section.pickup {
  background: #e8f5e9;
}

.location-section.delivery-loc {
  background: #fff3e0;
}

.location-icon {
  font-size: 2rem;
}

.location-info {
  flex: 1;
}

.location-info strong {
  display: block;
  color: #333;
  margin-bottom: 5px;
}

.location-info p {
  margin: 5px 0;
  color: #666;
}

.address {
  font-size: 0.95rem;
}

.phone {
  color: #667eea;
  font-weight: 600;
}

.delivery-details {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  margin: 15px 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.detail-item i {
  color: #667eea;
  font-size: 1.2rem;
}

.cash-collect {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: #fff8e1;
  border: 2px solid #ffc107;
  border-radius: 10px;
  margin: 15px 0;
}

.cash-collect .amount {
  font-size: 1.3rem;
  color: #f57c00;
  font-weight: bold;
}

.delivery-notes {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #e3f2fd;
  border-radius: 10px;
  margin: 15px 0;
  color: #1565c0;
}

.delivery-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.delivery-actions .btn {
  flex: 1;
  min-width: 120px;
  padding: 10px;
  font-size: 0.9rem;
}

.btn-accept-delivery {
  background: #4caf50;
  color: white;
  width: 100%;
}

.btn-accept-delivery:hover {
  background: #45a049;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover {
  background: #0b7dda;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
}

.btn-secondary:hover {
  background: #757575;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover {
  background: #45a049;
}

.btn-map {
  background: #ff9800;
  color: white;
}

.btn-map:hover {
  background: #f57c00;
}

.btn-call {
  background: #667eea;
  color: white;
}

.btn-call:hover {
  background: #5568d3;
}

.btn-details {
  background: #6c757d;
  color: white;
}

.btn-details:hover {
  background: #5a6268;
}

.delivery-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  background: #ffebee;
  border-radius: 8px;
  color: #c62828;
  font-weight: 600;
}

.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  color: #667eea;
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
  .deliveries-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .driver-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .delivery-details {
    flex-direction: column;
    gap: 10px;
  }
  
  .detail-item {
    flex-direction: row;
    justify-content: flex-start;
  }
}
</style>