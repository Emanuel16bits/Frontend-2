<template>
  <div class="delivery-orders">
    <h2>Pedidos para entregar</h2>
    
    <div v-if="loading" class="loading">Cargando pedidos...</div>
    
    <div v-else-if="orders.length === 0" class="no-orders">
      No hay pedidos disponibles
    </div>
    
    <div v-else class="orders-grid">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <h3>Pedido #{{ order.id }}</h3>
          <span :class="'status-' + order.estado">
            {{ formatStatus(order.estado) }}
          </span>
        </div>
        
        <div class="order-details">
          <p><strong>Cliente:</strong> {{ order.usuario?.nombre || 'Cliente' }}</p>
          <p><strong>Dirección:</strong> {{ order.direccionEntrega || 'Sin dirección' }}</p>
          <p><strong>Total:</strong> ${{ Number(order.precioTotal || 0).toFixed(2) }}</p>
        </div>

        <div class="order-items" v-if="order.items && order.items.length > 0">
          <h4>Productos:</h4>
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <span class="item-quantity">{{ item.cantidad }}x</span>
            <span class="item-name">{{ item.producto?.nombre || 'Producto' }}</span>
          </div>
        </div>

        <div class="order-actions">
          <button 
            v-if="order.estado === 'pendiente'" 
            @click="updateOrderStatus(order.id, 'en_camino')"
            class="btn-accept"
          >
            Aceptar Pedido
          </button>

          <button 
            v-else-if="order.estado === 'en_camino'" 
            @click="updateOrderStatus(order.id, 'entregada')"
            class="btn-deliver"
          >
            Marcar como Entregado
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3000'

// Definir el store de autenticación
export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value)
  const userId = computed(() => user.value?.id || null)

  return {
    user,
    token,
    isAuthenticated,
    userId
  }
})

export default {
  setup() {
    const orders = ref([])
    const loading = ref(true)
    const router = useRouter()
    const authStore = useAuthStore()
    const driverId = ref(null)

    // Formatear el estado para mostrar
    const formatStatus = (status) => {
      const statusMap = {
        'pendiente': 'Pendiente',
        'en_preparacion': 'En preparación',
        'en_camino': 'En camino',
        'entregada': 'Entregada',
        'cancelada': 'Cancelada'
      }
      return statusMap[status] || status
    }

    // Obtener pedidos
    const fetchOrders = async () => {
      try {
        loading.value = true
        console.log('Obteniendo pedidos...')
        
        // Verificar si hay un usuario autenticado
        if (!authStore.isAuthenticated) {
          console.error('Usuario no autenticado')
          router.push('/login')
          return
        }
        
        driverId.value = authStore.userId
        console.log('ID del repartidor:', driverId.value)

        // Obtener pedidos pendientes (sin repartidor asignado) y en camino
        const [pendingResponse, inProgressResponse] = await Promise.all([
          axios.get(`${API_URL}/orders?estado=pendiente&_expand=usuario&_expand=items`),
          axios.get(`${API_URL}/orders?estado=en_camino&repartidorId=${driverId.value}&_expand=usuario&_expand=items`)
        ])
        
        // Combinar y eliminar duplicados
        const allOrders = [...pendingResponse.data, ...inProgressResponse.data]
        orders.value = allOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        )
        
        console.log('Pedidos cargados:', orders.value)
      } catch (error) {
        console.error('Error al cargar pedidos:', error)
        alert('No se pudieron cargar los pedidos. Intenta de nuevo más tarde.')
      } finally {
        loading.value = false
      }
    }

    // Actualizar estado del pedido
    const updateOrderStatus = async (orderId, newStatus) => {
      try {
        const updateData = { 
          estado: newStatus,
          // Si se está aceptando el pedido, asignar al conductor actual
          ...(newStatus === 'en_camino' && { repartidorId: driverId.value })
        }
        
        console.log('Actualizando pedido:', { orderId, ...updateData })
        await axios.patch(`${API_URL}/orders/${orderId}`, updateData)
        
        // Actualizar la lista de pedidos
        await fetchOrders()
        
      } catch (error) {
        console.error('Error al actualizar el pedido:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        alert('No se pudo actualizar el pedido. Intenta de nuevo.')
      }
    }

    // Cargar pedidos al montar el componente
    onMounted(fetchOrders)

    return {
      orders,
      loading,
      formatStatus,
      updateOrderStatus
    }
  }
}
</script>

<style scoped>
.delivery-orders {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.order-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.order-details {
  margin: 15px 0;
}

.order-details p {
  margin: 5px 0;
}

.order-items {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.order-item {
  display: flex;
  margin: 5px 0;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.item-quantity {
  font-weight: bold;
  margin-right: 10px;
  min-width: 30px;
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-accept {
  background-color: #28a745;
  color: white;
}

.btn-accept:hover {
  background-color: #218838;
}

.btn-deliver {
  background-color: #007bff;
  color: white;
}

.btn-deliver:hover {
  background-color: #0069d9;
}

.status-pendiente {
  color: #ffc107;
  font-weight: bold;
}

.status-en_preparacion {
  color: #fd7e14;
  font-weight: bold;
}

.status-en_camino {
  color: #17a2b8;
  font-weight: bold;
}

.status-entregada {
  color: #28a745;
  font-weight: bold;
}

.status-cancelada {
  color: #dc3545;
  font-weight: bold;
}

.loading, .no-orders {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #666;
}
</style>