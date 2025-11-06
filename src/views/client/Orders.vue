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
        </div>
      </div>
    </header>

    <main class="client-main">
      <!-- Botón de volver -->
     <button @click="goTo('/home-cliente')" class="back-button">
  <i class="fas fa-arrow-left"></i> Volver
</button>

      <div class="orders-container">
        <h2>Mis Pedidos</h2>
        
        <div v-if="loading" class="loading-state">
          <p>Cargando pedidos...</p>
        </div>
        
        <div v-else-if="orders.length === 0" class="empty-state">
          <i class="fas fa-receipt"></i>
          <p>No has realizado ningún pedido aún</p>
          <button class="btn btn-primary" @click="goTo('/')">Ver restaurantes</button>
        </div>
        
        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-header">
              <h3>Orden #{{ order.id }}</h3>
              <span class="status" :class="order.estado?.toLowerCase()">
                {{ formatStatus(order.estado) }}
              </span>
            </div>
            
            <div class="order-details">
              <p><i class="far fa-calendar-alt"></i> {{ formatDate(order.fecha) }}</p>
              <p><i class="fas fa-receipt"></i> Total: 
                ${{
                  formatPrice(
                    order.precioTotal || 
                    order.items?.reduce((sum, item) => {
                      const precio = item.precioUnitario || item.precio || item.producto?.precio || 0;
                      const cantidad = item.cantidad || 1;
                      return sum + (precio * cantidad);
                    }, 0)
                  )
                }}
              </p>
            </div>

            <div v-if="order.items && order.items.length > 0" class="order-items">
              <h4><i class="fas fa-utensils"></i> Productos:</h4>
              <div v-for="(item, index) in order.items" :key="index" class="order-item">
                <span class="quantity">{{ item.cantidad || 1 }}x</span>
                <span class="name">{{ item.producto?.nombre || 'Producto no disponible' }}</span>
                <span class="price">
                  ${{
                    formatPrice(
                      item.precioUnitario || 
                      item.precio || 
                      (item.producto?.precio || 0)
                    ) 
                  }}
                </span>
              </div>
            </div>
            <div v-else class="no-items">
              <i class="fas fa-info-circle"></i> No hay productos en este pedido
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';
import axios from 'axios';

const router = useRouter();
const cartStore = useCartStore();
const orders = ref([]);
const loading = ref(true);

const cartItemsCount = computed(() => cartStore.totalItems || 0);
const goTo = (path) => {
  router.push(path);
};

// Obtener los pedidos del usuario
const fetchOrders = async () => {
  try {
    loading.value = true;
    const ordersResponse = await axios.get('http://localhost:3000/orders', {
      withCredentials: true
    });
    
    // Para cada orden, obtener sus items
    const ordersWithItems = await Promise.all(
      ordersResponse.data.map(async (order) => {
        try {
          const itemsResponse = await axios.get('http://localhost:3000/order-items', {
            params: { idOrden: order.id },
            withCredentials: true
          });
          
          return {
            ...order,
            items: itemsResponse.data || []
          };
        } catch (error) {
          console.error(`Error cargando items para la orden ${order.id}:`, {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          return {
            ...order,
            items: []
          };
        }
      })
    );
    
    orders.value = ordersWithItems;
  } catch (error) {
    console.error('Error al cargar los pedidos:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    alert('No se pudieron cargar los pedidos. Por favor, inténtalo de nuevo más tarde.');
  } finally {
    loading.value = false;
  }
};

// Formatear precios
const formatPrice = (price) => {
  const num = Number(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible';
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

// Formatear estado
const formatStatus = (status) => {
  if (!status) return 'Desconocido';
  const statusMap = {
    'pendiente': 'Pendiente',
    'en_preparacion': 'En preparación',
    'en_camino': 'En camino',
    'entregada': 'Entregada',
    'cancelada': 'Cancelada'
  };
  return statusMap[status.toLowerCase()] || status;
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
/* Estilos base del contenedor */
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
}

.logo-section h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
}

/* Botón de volver */
.back-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.back-button:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

/* Contenedor de órdenes */
.orders-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.orders-container h2 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 25px;
}

/* Lista de órdenes */
.orders-list {
  display: grid;
  gap: 20px;
}

/* Tarjeta de orden */
.order-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.order-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.status {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status.pendiente {
  background-color: #fff3cd;
  color: #856404;
}

.status.en_preparacion {
  background-color: #cce5ff;
  color: #004085;
}

.status.en_camino {
  background-color: #e2f0ff;
  color: #0c63e4;
}

.status.entregada {
  background-color: #d4edda;
  color: #155724;
}

.status.cancelada {
  background-color: #f8d7da;
  color: #721c24;
}

.order-details {
  margin-bottom: 15px;
  color: #555;
}

.order-details p {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-items {
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.order-items h4 {
  margin: 0 0 10px 0;
  color: #444;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
  align-items: center;
}

.order-item:last-child {
  border-bottom: none;
}

.quantity {
  font-weight: bold;
  color: #2c3e50;
  min-width: 30px;
  text-align: center;
}

.name {
  flex-grow: 1;
  margin: 0 15px;
  color: #333;
}

.price {
  font-weight: 600;
  color: #2c3e50;
  min-width: 80px;
  text-align: right;
}

.no-items {
  padding: 15px;
  text-align: center;
  color: #666;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Estados de carga y vacío */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 20px;
  opacity: 0.7;
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
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }

  .orders-container {
    padding: 15px;
  }

  .order-card {
    padding: 15px;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .status {
    align-self: flex-start;
  }

  .order-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    padding: 10px 0;
  }

  .price {
    text-align: left;
    margin-left: 45px;
  }
}
</style>