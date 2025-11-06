<template>
  <div class="cart-page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <button @click="goBack" class="btn-back">← Volver</button>
        <h1>🛒 Mi Carrito</h1>
        <div></div>
      </div>
    </header>

    <div class="container">
      <!-- Empty Cart -->
      <div v-if="!cartStore.items.length" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos de tus restaurantes favoritos</p>
        <button @click="goToRestaurants" class="btn-primary">
          Buscar Restaurantes
        </button>
      </div>

      <!-- Cart with Items -->
      <div v-else class="cart-content">
        <div class="cart-main">
          <!-- Restaurant Info -->
          <div class="restaurant-card" v-if="cartStore.restaurantName">
            <div class="restaurant-header">
              <h3>{{ cartStore.restaurantName }}</h3>
              <button @click="handleClearCart" class="btn-clear-cart">
                🗑️ Vaciar carrito
              </button>
            </div>
          </div>

          <!-- Cart Items -->
          <div class="cart-items">
            <h3>Productos ({{ cartStore.totalItems }})</h3>
            
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="cart-item"
            >
              <img
                :src="getImageUrl(item.imagen)"
                :alt="item.name"
                class="item-image"
                @error="handleImageError"
              />
              
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p class="item-description">{{ item.descripcion || 'Sin descripción' }}</p>
              </div>

              <div class="item-actions">
                <div class="item-price">${{ item.price.toFixed(2) }}</div>
                
                <div class="quantity-controls">
                  <button
                    @click="updateQuantity(item.id, item.quantity - 1)"
                    class="qty-btn"
                    :disabled="item.quantity <= 1"
                  >
                    −
                  </button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button
                    @click="updateQuantity(item.id, item.quantity + 1)"
                    class="qty-btn"
                  >
                    +
                  </button>
                </div>

                <div class="item-total">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </div>

                <button
                  @click="removeItem(item.id)"
                  class="btn-remove"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <!-- Add Notes Section -->
          <div class="add-notes-section">
            <h3>📝 Notas para el restaurante</h3>
            <div class="notes-container">
              <textarea
                v-model="notasPedido"
                placeholder="Ejemplo: Sin cebolla, extra queso, etc."
                class="notes-textarea"
                maxlength="200"
              ></textarea>
              <div class="char-count">{{ notasPedido.length }}/200</div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <div class="summary-card">
            <h3>Resumen del pedido</h3>

            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Envío</span>
              <span>$0.00</span>
            </div>
            <div class="divider"></div>
            <div class="summary-row total">
              <span>Total</span>
              <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
            </div>

            <button
              @click="confirmarPedido"
              class="btn-checkout"
              :disabled="!cartStore.items.length"
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/services/cartStore'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios';

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const notasPedido = ref('')
const imageLoadError = ref({})

// Métodos
const goBack = () => {
  router.go(-1)
}

const goToRestaurants = () => {
  router.push('/buscar-restaurantes')
}

const updateQuantity = (itemId, newQuantity) => {
  if (newQuantity < 1) return
  cartStore.updateQuantity(itemId, newQuantity)
}

const removeItem = (itemId) => {
  cartStore.removeItem(itemId)
}

const handleClearCart = () => {
  if (confirm('¿Estás seguro de vaciar el carrito?')) {
    cartStore.clearCart()
  }
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/100'
}

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/100'
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:3000/${imagePath}`
}

const confirmarPedido = async () => {
  try {
    const userId = authStore.user.id; // Reemplaza con el ID del usuario real

    // 1. Crear la orden vacía
    const ordenResponse = await axios.post('http://localhost:3000/orders', {
      precioTotal: cartStore.totalPrice,
      idUsuario: userId
    }, {
      withCredentials: true
    });

    const ordenId = ordenResponse.data.id;

    // 2. Agregar los items a la orden
    for (const item of cartStore.items) {
      await axios.post('http://localhost:3000/order-items', {
        idOrden: ordenId,
        idProducto: item.id,
        cantidad: item.quantity
      }, {
        withCredentials: true
      });
    }

    // 3. Limpiar el carrito y redirigir
    cartStore.clearCart();
    router.push('/mis-pedidos');
    alert('¡Pedido realizado con éxito!');
  } catch (error) {
    console.error('Error al confirmar el pedido:', error);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    alert('Ocurrió un error al procesar tu pedido. Por favor, inténtalo de nuevo.');
  }
};
</script>

<style scoped>
.cart-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 70vh;
}

/* Header */
.header {
  background: white;
  padding: 15px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.header .container {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn-back {
  background: #f5f5f5;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.header h1 {
  margin: 0 auto;
  font-size: 1.5rem;
  color: #333;
}

/* Estilos del carrito */
.container {
  display: flex;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.cart-content {
  display: flex;
  gap: 30px;
  width: 100%;
}

.cart-main {
  flex: 2;
}

/* Tarjeta del restaurante */
.restaurant-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.restaurant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-clear-cart {
  background: #ff4444;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Items del carrito */
.cart-items {
  margin-bottom: 30px;
}

.cart-item {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.cart-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 20px;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.item-description {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f3f5;
  padding: 4px 12px;
  border-radius: 50px;
  border: 1px solid #dee2e6;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.qty-btn:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.qty-btn:active {
  transform: translateY(0);
}

.quantity {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  color: #333;
}

.item-price {
  font-weight: 600;
  min-width: 80px;
  text-align: right;
}

.item-total {
  font-weight: 600;
  min-width: 80px;
  text-align: right;
}

.btn-remove {
  background: #fff5f5;
  border: 1px solid #ffc9c9;
  color: #ff6b6b;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #ffebee;
  color: #f44336;
  transform: translateY(-1px);
}

/* Sección de notas */
.add-notes-section {
  margin-top: 30px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.add-notes-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.notes-container {
  position: relative;
}

.notes-textarea {
  width: 100%;
  min-height: 100px;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  transition: border-color 0.2s;
  background: white;
  color: #333;
}

.notes-textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.char-count {
  text-align: right;
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 5px;
}

/* Resumen del pedido */
.order-summary {
  flex: 1;
  position: sticky;
  top: 20px;
  height: fit-content;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.summary-card h3 {
  margin-top: 0;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  color: #333;
  font-size: 1.2rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
}

.summary-row.total {
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 15px 0;
}

.btn-checkout {
  width: 100%;
  padding: 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s;
}

.btn-checkout:hover {
  background: #43A047;
}

.btn-checkout:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Carrito vacío */
.empty-cart {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  width: 100%;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  color: #e0e0e0;
}

.empty-cart h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.empty-cart p {
  color: #666;
  margin-bottom: 20px;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #43A047;
}

/* Responsive */
@media (max-width: 992px) {
  .container {
    flex-direction: column;
  }
  
  .cart-content {
    flex-direction: column;
  }
  
  .order-summary {
    position: static;
    margin-top: 30px;
  }
}

@media (max-width: 768px) {
  .cart-item {
    flex-direction: column;
    text-align: center;
  }
  
  .item-image {
    margin: 0 auto 15px;
  }
  
  .item-actions {
    margin-top: 15px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .quantity-controls {
    margin: 10px 0;
  }
  
  .btn-back {
    position: absolute;
    left: 20px;
  }
  
  .header h1 {
    text-align: center;
    margin-left: 40px;
  }
  
  .add-notes-section {
    margin: 20px 0;
    padding: 15px;
  }
}
</style>