<template>
  <div class="home-delivery">
    <div class="header-container">
      <h2>Pedidos para entregar</h2>
      <div class="button-group">
        <button @click="showVehicleForm = true" class="btn-register-vehicle">
          <i class="fa-solid fa-car"></i> Registrar Vehículo
        </button>
        <button @click="fetchDriverVehicles" class="btn-view-vehicles">
          <i class="fa-solid fa-list"></i> Mis Vehículos
        </button>
      </div>
    </div>
    
    <div v-if="showVehicleForm" class="modal-overlay" @click.self="showVehicleForm = false">
      <div class="modal-content">
        <button class="close-modal" @click="showVehicleForm = false">&times;</button>
        <VehicleForm 
          @saved="handleVehicleSaved"
          @cancel="showVehicleForm = false"
        />
      </div>
    </div>
    
    <div v-if="loading" class="loading">Cargando pedidos...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="no-orders">
      No hay pedidos disponibles en este momento.
    </div>
    <div v-else class="orders-grid">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-id">#{{ order.id }}</span>
          <span class="order-status" :class="order.estado">
            {{ formatStatus(order.estado) }}
          </span>
        </div>

        <div class="order-details">
          <div class="order-customer">
            <span class="material-icons">person</span>
            <div>
              <h4>Cliente: {{ order.usuario?.nombre || 'Cliente' }}</h4>
              <p>ID: #{{ order.idUsuario || 'N/A' }}</p>
            </div>
          </div>

          <div class="restaurant-info" v-if="order.restaurante && order.restaurante.nombre">
            <span class="material-icons">store</span>
            <div>
              <h4>{{ order.restaurante.nombre }}</h4>
              <p>{{ order.restaurante.direccion || 'Dirección no disponible' }}</p>
            </div>
          </div>
          <div class="restaurant-info" v-else>
            <span class="material-icons">store</span>
            <div>
              <h4>Restaurante no disponible</h4>
              <p>No se pudo cargar la información del restaurante</p>
            </div>
          </div>

          <div class="order-total">
            <strong>Total del pedido:</strong>
            <span>${{ typeof order.precioTotal === 'number' ? order.precioTotal.toFixed(2) : '0.00' }}</span>
          </div>

          <div class="order-actions">
            <button 
              v-if="order.estado === 'pendiente'" 
              @click="updateOrderStatus(order.id, 'en_camino')"
              :disabled="updatingOrderId === order.id"
              class="btn-accept"
            >
              <span v-if="updatingOrderId !== order.id">Aceptar pedido</span>
              <span v-else>Aceptando...</span>
            </button>
            
            <button 
              v-if="order.estado === 'en_camino'" 
              @click="updateOrderStatus(order.id, 'entregada')"
              :disabled="updatingOrderId === order.id"
              class="btn-delivered"
            >
              <span v-if="updatingOrderId !== order.id">Marcar como entregado</span>
              <span v-else>Actualizando...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showVehiclesModal" class="modal-overlay" @click.self="showVehiclesModal = false">
      <div class="modal-content">
        <button class="close-modal" @click="showVehiclesModal = false">&times;</button>
        <h3>Mis Vehículos Registrados</h3>
        <div v-if="vehiclesLoading" class="loading">Cargando vehículos...</div>
        <div v-else-if="vehiclesError" class="error">{{ vehiclesError }}</div>
        <div v-else-if="!driverVehicles" class="no-vehicles">
          No tienes vehículos registrados.
        </div>
        <div v-else class="vehicle-details">
          <div class="vehicle-info">
            <p><strong>Tipo:</strong> {{ driverVehicles.tipoVehiculo || 'No especificado' }}</p>
            <p><strong>Marca:</strong> {{ driverVehicles.marca || 'No especificada' }}</p>
            <p><strong>Modelo:</strong> {{ driverVehicles.modelo || 'No especificado' }}</p>
            <p><strong>Color:</strong> {{ driverVehicles.color || 'No especificado' }}</p>
            <p><strong>Año:</strong> {{ driverVehicles.anio || 'No especificado' }}</p>
            <p><strong>Placa:</strong> {{ driverVehicles.placa || 'No especificada' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import VehicleForm from '@/components/VehicleForm.vue';

const showVehicleForm = ref(false);
const showVehiclesModal = ref(false);
const driverVehicles = ref(null);
const vehiclesLoading = ref(false);
const vehiclesError = ref(null);

const fetchDriverVehicles = async () => {
  try {
    vehiclesLoading.value = true;
    vehiclesError.value = null;
    showVehiclesModal.value = true;
    
    const userId = authStore.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const response = await axios.get(`${API_URL}/drivers/user/${userId}/vehicles`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    driverVehicles.value = response.data;
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    vehiclesError.value = 'No se pudieron cargar los vehículos. Intente de nuevo.';
  } finally {
    vehiclesLoading.value = false;
  }
};

const handleVehicleSaved = (vehicleData) => {
  showVehicleForm.value = false;
  alert('Vehículo registrado exitosamente');
};

const API_URL = 'http://localhost:3000';
const authStore = useAuthStore();
const orders = ref([]);
const loading = ref(true);
const error = ref(null);
const updatingOrderId = ref(null);

const formatStatus = (status) => {
  const statusMap = {
    'pendiente': 'Pendiente',
    'en_camino': 'En camino',
    'entregada': 'Entregada',
    'cancelada': 'Cancelada'
  };
  return statusMap[status] || status;
};

const fetchOrders = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const restaurantsResponse = await axios.get(`${API_URL}/restaurants`);
    const restaurants = restaurantsResponse.data;
    
    const ordersResponse = await axios.get(`${API_URL}/orders?_embed=orderItems&_expand=usuario`);
    
    const defaultRestaurant = restaurants.length > 0 ? restaurants[0] : null;
    
    const ordersWithDetails = ordersResponse.data.map(order => {
      const restaurante = defaultRestaurant || {};
      
      const precioTotal = typeof order.precioTotal === 'string' 
        ? parseFloat(order.precioTotal) 
        : order.precioTotal || 0;

      return {
        ...order,
        precioTotal,
        restaurante,
        usuario: order.usuario || { nombre: 'Cliente' }
      };
    });

    orders.value = ordersWithDetails.filter(order => 
      order.estado === 'pendiente' || 
      (order.estado === 'en_camino' && order.repartidorId === authStore.userId)
    );
    
  } catch (err) {
    console.error('Error al cargar pedidos:', err);
    error.value = 'Error al cargar los pedidos. Por favor, intente de nuevo.';
  } finally {
    loading.value = false;
  }
};

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    updatingOrderId.value = orderId;
    
    const updateData = { estado: newStatus };
    
    if (newStatus === 'en_camino') {
      updateData.repartidorId = authStore.userId;
    }
    
    await axios.patch(`${API_URL}/orders/${orderId}`, updateData);
    
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      orders.value[orderIndex].estado = newStatus;
      if (newStatus === 'en_camino') {
        orders.value[orderIndex].repartidorId = authStore.userId;
      }
    }
    
  } catch (err) {
    console.error('Error al actualizar el pedido:', err);
    error.value = 'Error al actualizar el pedido. Por favor, intente de nuevo.';
  } finally {
    updatingOrderId.value = null;
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchOrders();
  }
});
</script>

<style scoped>
.home-delivery {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-register-vehicle {
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-register-vehicle:hover {
  background-color: #4338ca;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-view-vehicles {
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-view-vehicles:hover {
  background-color: #3a5bd9;
}

.vehicle-details {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.vehicle-info p {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.no-vehicles {
  text-align: center;
  padding: 1.5rem;
  color: #6c757d;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  line-height: 1;
}

.close-modal:hover {
  color: #4b5563;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.order-id {
  font-weight: bold;
  color: #555;
}

.order-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.order-status.pendiente {
  background-color: #fff3cd;
  color: #856404;
}

.order-status.en_camino {
  background-color: #cce5ff;
  color: #004085;
}

.order-status.entregada {
  background-color: #d4edda;
  color: #155724;
}

.order-details {
  padding: 16px;
}

.order-customer,
.restaurant-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.order-customer .material-icons,
.restaurant-info .material-icons {
  margin-right: 12px;
  font-size: 24px;
  color: #4a6cf7;
}

.order-customer h4,
.restaurant-info h4 {
  margin: 0 0 4px;
  color: #212529;
}

.order-customer p,
.restaurant-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.order-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #e9ecef;
  margin-top: 16px;
  font-size: 1.1em;
}

.order-total strong {
  color: #212529;
}

.order-total span {
  font-weight: bold;
  color: #28a745;
}

.order-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-accept {
  background-color: #4a6cf7;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  background-color: #3a5bd9;
}

.btn-delivered {
  background-color: #28a745;
  color: white;
}

.btn-delivered:hover:not(:disabled) {
  background-color: #218838;
}

.loading,
.error,
.no-orders {
  text-align: center;
  padding: 40px;
  font-size: 1.1em;
  color: #6c757d;
}

.error {
  color: #dc3545;
}

@media (max-width: 768px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  button {
    width: 100%;
  }
}
</style>