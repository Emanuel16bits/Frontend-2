<template>
  <div class="delivery-home-container">
    <!-- Header -->
    <header class="delivery-header">
      <div class="header-content">
        <h1>comidApp - Panel Repartidor</h1>
        <div class="user-section">
          <button class="btn-profile" @click="showProfileMenu = !showProfileMenu">
            <i class="fa-solid fa-user-circle"></i>
            {{ driver?.nombre || 'Repartidor' }}
          </button>

          <!-- Menú desplegable de perfil -->
          <div v-if="showProfileMenu" class="profile-dropdown">
            <button @click="goTo('/perfil-repartidor')">
              <i class="fa-solid fa-user"></i> Mi Perfil
            </button>
            <button @click="goTo('/historial-entregas')">
              <i class="fa-solid fa-history"></i> Historial de entregas
            </button>
            <button @click="logout" class="logout-btn">
              <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="delivery-main">
      <!-- Estado y ganancias -->
      <section class="driver-info" v-if="driver">
        <p>
          <strong>Estado:</strong>
          <span :class="driver.disponible ? 'activo' : 'inactivo'">
            {{ driver.disponible ? 'Activo' : 'Inactivo' }}
          </span>
          <button @click="toggleDisponibilidad">
            {{ driver.disponible ? 'Desactivar' : 'Activar' }}
          </button>
        </p>
        <p><strong>Ganancias totales:</strong> ${{ driver.gananciasTotales || 0 }}</p>
        <p><strong>Calificación:</strong> ⭐ {{ driver.calificacion || 0 }}</p>
      </section>

      <!-- Pedidos asignados -->
      <section class="orders-section" v-if="orders.length > 0">
        <h2>Pedidos disponibles / asignados</h2>
        <ul>
          <li v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-info">
              <p><strong>Pedido #{{ order.id }}</strong></p>
              <p><strong>Cliente:</strong> {{ order.clienteNombre }}</p>
              <p><strong>Dirección de entrega:</strong> {{ order.direccionEntrega }}</p>
              <p><strong>Contenido:</strong> {{ order.contenido }}</p>
              <p><strong>Estado:</strong> {{ order.estado }}</p>
            </div>
            <div class="order-actions">
              <button v-if="order.estado === 'nuevo'" @click="aceptarPedido(order.id)">Aceptar</button>
              <button v-if="order.estado === 'nuevo'" @click="rechazarPedido(order.id)">Rechazar</button>
              <button v-if="order.estado === 'aceptado'" @click="marcarRecolectado(order.id)">Recolectado</button>
              <button v-if="order.estado === 'en camino'" @click="marcarEntregado(order.id)">Entregado</button>
              <button @click="contactarCliente(order.clienteTelefono)">Contactar cliente</button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Pedidos vacíos -->
      <div v-else class="empty-state">
        <i class="fa-solid fa-box"></i>
        <p>No hay pedidos disponibles</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const driver = ref(null)
const orders = ref([])
const loading = ref(true)
const showProfileMenu = ref(false)

// Driver ID guardado al iniciar sesión
const driverId = localStorage.getItem('driverId')

// Fetch datos del driver y pedidos asignados
const fetchData = async () => {
  if (!driverId) return
  loading.value = true
  try {
    const resDriver = await axios.get(`http://localhost:3000/drivers/${driverId}`)
    driver.value = resDriver.data

    const resOrders = await axios.get(`http://localhost:3000/orders?driverId=${driverId}&estado=nuevo,aceptado,en camino`)
    orders.value = resOrders.data
  } catch (err) {
    console.error('Error cargando datos:', err)
  } finally {
    loading.value = false
  }
}

// Funciones de pedidos
const aceptarPedido = async (orderId) => {
  try {
    await axios.patch(`http://localhost:3000/orders/${orderId}`, { estado: 'aceptado', driverId })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

const rechazarPedido = async (orderId) => {
  try {
    await axios.patch(`http://localhost:3000/orders/${orderId}`, { estado: 'rechazado', driverId: null })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

const marcarRecolectado = async (orderId) => {
  try {
    await axios.patch(`http://localhost:3000/orders/${orderId}`, { estado: 'en camino' })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

const marcarEntregado = async (orderId) => {
  try {
    await axios.patch(`http://localhost:3000/orders/${orderId}`, { estado: 'entregado' })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

// Contacto con cliente/vendor
const contactarCliente = (telefono) => {
  window.open(`tel:${telefono}`, '_self')
}

// Toggle disponibilidad
const toggleDisponibilidad = async () => {
  if (!driver.value) return
  try {
    const nuevaDisponibilidad = !driver.value.disponible
    await axios.patch(`http://localhost:3000/drivers/${driver.value.id}`, { disponible: nuevaDisponibilidad })
    driver.value.disponible = nuevaDisponibilidad
  } catch (err) {
    console.error(err)
  }
}

// Navegación y logout
const goTo = (path) => { showProfileMenu.value = false; router.push(path) }
const logout = () => { localStorage.removeItem('driverId'); router.push('/login') }

onMounted(fetchData)

// Cerrar menú de perfil al hacer click fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-section')) showProfileMenu.value = false
})
</script>

<style scoped>
.delivery-home-container { min-height: 100vh; background: #f5f5f5; font-family: Arial, sans-serif; }

/* Header */
.delivery-header { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); padding: 20px; color:white; position: sticky; top:0; z-index:100; }
.header-content { max-width:1400px; margin:auto; display:flex; justify-content:space-between; align-items:center; }
.user-section { position: relative; }
.btn-profile { background: rgba(255,255,255,0.2); border:none; padding:10px 20px; border-radius:25px; cursor:pointer; color:white; display:flex; align-items:center; gap:8px; font-weight:600; }
.btn-profile:hover { background: rgba(255,255,255,0.3); }
.profile-dropdown { position:absolute; top:100%; right:0; margin-top:10px; background:white; border-radius:15px; min-width:200px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.2); }
.profile-dropdown button { width:100%; padding:15px 20px; border:none; background:white; cursor:pointer; display:flex; align-items:center; gap:10px; transition: background 0.2s; text-align:left; }
.profile-dropdown button:hover { background:#f5f5f5; }
.logout-btn i { color:#ff4757 !important; }

/* Main */
.delivery-main { max-width:900px; margin:20px auto; padding:20px; }
.activo { color:green; font-weight:bold; }
.inactivo { color:red; font-weight:bold; }

button { margin-left:5px; padding:5px 10px; border-radius:6px; border:none; background:#007bff; color:white; cursor:pointer; }
button:hover { background:#0056b3; }

.driver-info { background:white; padding:20px; border-radius:15px; margin-bottom:30px; box-shadow:0 5px 20px rgba(0,0,0,0.1); }
.orders-section ul { padding-left:0; list-style:none; }
.order-card { background:white; padding:15px; margin-bottom:15px; border-radius:12px; box-shadow:0 5px 15px rgba(0,0,0,0.1); }
.order-info p { margin:5px 0; }
.order-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
.empty-state { text-align:center; padding:30px; background:white; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.1); }
.empty-state i { font-size:3rem; color:#667eea; margin-bottom:15px; }
</style>




