<template>
  <div class="rating-view">
    <header class="page-header">
      <h1>Calificar Pedido</h1>
      <button class="btn btn-back" @click="goBack">
        ← Volver a mis pedidos
      </button>
    </header>

    <div class="rating-content">
      <div v-if="loading" class="loading">
        <p>Cargando detalles del pedido...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button class="btn btn-retry" @click="fetchOrderDetails">Reintentar</button>
      </div>

      <div v-else class="rating-container">
        <div class="order-summary">
          <h2>Pedido #{{ order.id }}</h2>
          <p><strong>Cliente:</strong> {{ order.clienteNombre }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(order.fecha) }}</p>
          <p><strong>Total:</strong> ${{ order.total }}</p>
          <p><strong>Estado:</strong> {{ order.estado }}</p>
          
          <div v-if="order.items && order.items.length" class="order-items">
            <p><strong>Productos:</strong></p>
            <ul>
              <li v-for="(item, index) in order.items" :key="index">
                {{ item.cantidad }}x {{ item.nombre || `Producto ${item.idProducto}` }}
              </li>
            </ul>
          </div>
        </div>

        <div class="rating-form">
          <h3>¿Cómo calificarías tu experiencia?</h3>
          
          <div class="star-rating">
            <span 
              v-for="star in 5" 
              :key="star"
              class="star"
              :class="{ 'active': star <= rating }"
              @click="rating = star"
            >
              ★
            </span>
            <span class="rating-label">
              {{ rating }} {{ rating === 1 ? 'estrella' : 'estrellas' }}
            </span>
          </div>

          <div class="form-group">
            <label>Comentario (opcional)</label>
            <textarea 
              v-model="comment" 
              placeholder="¿Cómo fue tu experiencia con este pedido?"
              rows="4"
            ></textarea>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" @click="goBack">
              Cancelar
            </button>
            <button 
              class="btn btn-primary" 
              @click="submitRating"
              :disabled="isSubmitting || !rating"
            >
              <span v-if="isSubmitting">Enviando...</span>
              <span v-else>Enviar calificación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOrderById, rateOrder } from '../../services/orderService';

const route = useRoute();
const router = useRouter();

const orderId = route.params.orderId;
const order = ref({});
const loading = ref(true);
const error = ref(null);
const rating = ref(0);
const comment = ref('');
const isSubmitting = ref(false);

const fetchOrderDetails = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const orderData = await getOrderById(orderId);
    console.log('Datos del pedido:', orderData); 
    
    order.value = {
      id: orderData.id,
      clienteNombre: orderData.usuario?.nombre || 'Cliente',
      fecha: orderData.fecha,
      total: orderData.precioTotal,
      estado: orderData.estado,
      items: orderData.orderItems || []
    };
    
    loading.value = false;
  } catch (err) {
    console.error('Error al cargar el pedido', err);
    error.value = 'No se pudo cargar la información del pedido';
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const submitRating = async () => {
  try {
    isSubmitting.value = true;
    
    await rateOrder(orderId, rating.value, comment.value);
    
    router.push({
      path: '/pedidos',
      query: { rated: 'true' }
    });
  } catch (err) {
    console.error('Error al enviar la calificación', err);
    let errorMessage = 'Ocurrió un error al enviar tu calificación';
    
    if (err.response) {
      if (err.response.status === 400) {
        errorMessage = 'La calificación debe estar entre 1 y 5 estrellas.';
      } else if (err.response.status === 404) {
        errorMessage = 'No se encontró el pedido especificado.';
      } else if (err.response.status === 403) {
        errorMessage = 'No tienes permiso para calificar este pedido.';
      } else if (err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
    }
    
    alert(errorMessage);
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};
onMounted(() => {
  fetchOrderDetails();
});
</script>

<style scoped>
.rating-view {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  padding: 1rem;
  text-align: center;
}

.page-header h1 {
  color: #333;
  margin-bottom: 1rem;
}

.btn-back {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #f0f0f0;
  color: #333;
}

.rating-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.rating-container {
  padding: 2rem;
}

.order-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid #4a90e2;
}

.order-summary h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.order-summary p {
  margin: 0.5rem 0;
  color: #555;
}

.order-items {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.order-items ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.order-items li {
  padding: 0.25rem 0;
  color: #555;
}

.rating-form {
  padding: 1rem;
}

.rating-form h3 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.star-rating {
  text-align: center;
  margin: 2rem 0;
}

.star {
  font-size: 2.5rem;
  color: #e0e0e0;
  cursor: pointer;
  transition: color 0.2s;
  margin: 0 4px;
  display: inline-block;
}

.star.active {
  color: #ffc107;
}

.rating-label {
  display: block;
  margin-top: 0.5rem;
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-group textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.2s;
  resize: vertical;
  min-height: 100px;
}

.form-group textarea:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-primary:not(:disabled):hover {
  background-color: #357abd;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.loading,
.error-message {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 8px;
  margin: 1rem 0;
}

.error-message {
  color: #dc3545;
}

.btn-retry {
  margin-top: 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #5a6268;
}

@media (max-width: 768px) {
  .rating-view {
    padding: 1rem;
  }

  .rating-content {
    border-radius: 0;
  }

  .page-header {
    padding: 0.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>