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
      <div v-if="!tieneItems" class="empty-cart">
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
          <div class="restaurant-card" v-if="restauranteActual">
            <div class="restaurant-header">
              <h3>{{ restauranteActual.nombre }}</h3>
              <button @click="handleClearCart" class="btn-clear-cart">
                🗑️ Vaciar carrito
              </button>
            </div>
          </div>

          <!-- Cart Items -->
          <div class="cart-items">
            <h3>Productos ({{ totalItems }})</h3>
            
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="cart-item"
            >
              <img
                :src="item.imagen || 'https://via.placeholder.com/100'"
                :alt="item.nombre"
                class="item-image"
              />
              
              <div class="item-info">
                <h4>{{ item.nombre }}</h4>
                <p class="item-description">{{ item.descripcion }}</p>
                <div class="item-notes" v-if="item.notas">
                  <span>📝 {{ item.notas }}</span>
                </div>
              </div>

              <div class="item-actions">
                <div class="item-price">${{ item.precio }}</div>
                
                <div class="quantity-controls">
                  <button
                    @click="decrementarCantidad(item.id)"
                    class="qty-btn"
                  >
                    −
                  </button>
                  <span class="quantity">{{ item.cantidad }}</span>
                  <button
                    @click="incrementarCantidad(item.id)"
                    class="qty-btn"
                  >
                    +
                  </button>
                </div>

                <div class="item-total">
                  ${{ item.precio * item.cantidad }}
                </div>

                <button
                  @click="eliminarItem(item.id)"
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
            <textarea
              v-model="notasPedido"
              placeholder="Ejemplo: Sin cebolla, extra queso, etc."
              class="notes-textarea"
              maxlength="200"
            ></textarea>
            <small>{{ notasPedido.length }}/200 caracteres</small>
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="order-summary">
          <div class="summary-card">
            <h3>Resumen del pedido</h3>

            <!-- Delivery Address -->
            <div class="delivery-section">
              <h4>📍 Dirección de entrega</h4>
              <div class="address-box" @click="showAddressModal = true">
                <p v-if="direccionEntrega">{{ direccionEntrega }}</p>
                <p v-else class="add-address">+ Agregar dirección</p>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="payment-section">
              <h4>💳 Método de pago</h4>
              <select v-model="metodoPago" class="payment-select">
                <option value="">Seleccionar método</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta de crédito/débito</option>
                <option value="mercadopago">🔵 Mercado Pago</option>
              </select>
            </div>

            <!-- Summary Details -->
            <div class="summary-details">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${{ subtotal }}</span>
              </div>
              <div class="summary-row">
                <span>Costo de envío</span>
                <span>${{ costoEnvio }}</span>
              </div>
              <div class="summary-row" v-if="descuento > 0">
                <span class="discount">Descuento</span>
                <span class="discount">-${{ descuento }}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>${{ total }}</span>
              </div>
            </div>

            <!-- Promo Code -->
            <div class="promo-section">
              <input
                v-model="codigoPromo"
                type="text"
                placeholder="Código de descuento"
                class="promo-input"
              />
              <button @click="aplicarPromo" class="btn-apply-promo">
                Aplicar
              </button>
            </div>

            <!-- Checkout Button -->
            <button
              @click="confirmarPedido"
              :disabled="!puedeConfirmar"
              class="btn-checkout"
            >
              Confirmar Pedido
            </button>

            <p class="terms-text">
              Al confirmar aceptas los términos y condiciones
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Address Modal -->
    <div v-if="showAddressModal" class="modal-overlay" @click="showAddressModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📍 Dirección de entrega</h3>
          <button @click="showAddressModal = false" class="btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="direccionEntrega"
            placeholder="Ingresa tu dirección completa"
            class="address-textarea"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showAddressModal = false" class="btn-cancel">Cancelar</button>
          <button @click="guardarDireccion" class="btn-save">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'

const router = useRouter()
const cartStore = useCartStore()

const notasPedido = ref('')
const direccionEntrega = ref(cartStore.direccionEntrega || '')
const metodoPago = ref(cartStore.metodoPago || '')
const codigoPromo = ref('')
const descuento = ref(0)
const showAddressModal = ref(false)

// Computed
const cartItems = computed(() => cartStore.cartItems)
const tieneItems = computed(() => cartStore.tieneItems)
const totalItems = computed(() => cartStore.totalItems)
const subtotal = computed(() => cartStore.subtotal)
const costoEnvio = computed(() => cartStore.costoEnvio)
const total = computed(() => cartStore.total - descuento.value)
const restauranteActual = computed(() => cartStore.restauranteActual)

const puedeConfirmar = computed(() => {
  return tieneItems.value && direccionEntrega.value && metodoPago.value
})

// Methods
const goBack = () => {
  router.back()
}

const goToRestaurants = () => {
  router.push('/buscar-restaurantes')
}

const incrementarCantidad = (productoId) => {
  cartStore.actualizarCantidad(productoId, cartItems.value.find(i => i.id === productoId).cantidad + 1)
}

const decrementarCantidad = (productoId) => {
  const item = cartItems.value.find(i => i.id === productoId)
  if (item.cantidad > 1) {
    cartStore.actualizarCantidad(productoId, item.cantidad - 1)
  } else {
    eliminarItem(productoId)
  }
}

const eliminarItem = (productoId) => {
  if (confirm('¿Eliminar este producto del carrito?')) {
    cartStore.eliminarItem(productoId)
  }
}

const handleClearCart = () => {
  if (confirm('¿Vaciar todo el carrito?')) {
    cartStore.vaciarCarrito()
  }
}

const guardarDireccion = () => {
  cartStore.actualizarDireccion(direccionEntrega.value)
  showAddressModal.value = false
}

const aplicarPromo = () => {
  // Simulación de validación de código promocional
  const codigosValidos = {
    'RAPPI10': 100,
    'PRIMERA': 200,
    'DESCUENTO': 150
  }

  if (codigosValidos[codigoPromo.value.toUpperCase()]) {
    descuento.value = codigosValidos[codigoPromo.value.toUpperCase()]
    alert(`¡Código aplicado! Descuento de $${descuento.value}`)
  } else {
    alert('Código inválido')
  }
}

const confirmarPedido = async () => {
  if (!puedeConfirmar.value) {
    alert('Por favor completa todos los datos')
    return
  }

  try {
    const pedido = {
      items: cartItems.value,
      subtotal: subtotal.value,
      costoEnvio: costoEnvio.value,
      descuento: descuento.value,
      total: total.value,
      direccionEntrega: direccionEntrega.value,
      metodoPago: metodoPago.value,
      notas: notasPedido.value,
      restauranteId: restauranteActual.value?.id
    }

    // Guardar método de pago para próximas compras
    cartStore.actualizarMetodoPago(metodoPago.value)

    // Aquí iría la llamada al backend para crear el pedido
    console.log('Pedido a crear:', pedido)

    // Simular creación de pedido
    alert('¡Pedido confirmado! Te redirigiremos al seguimiento.')
    
    // Limpiar carrito y redirigir
    cartStore.vaciarCarrito()
    router.push('/pedidos')
  } catch (error) {
    console.error('Error al confirmar pedido:', error)
    alert('Error al confirmar el pedido. Intenta nuevamente.')
  }
}
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 28px;
}

.btn-back {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Empty Cart */
.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 100px;
  margin-bottom: 30px;
}

.empty-cart h2 {
  margin: 0 0 15px 0;
  font-size: 28px;
  color: #333;
}

.empty-cart p {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 16px;
}

.btn-primary {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #5568d3;
}

/* Cart Content */
.cart-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
}

.restaurant-card {
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.restaurant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.restaurant-header h3 {
  margin: 0;
  font-size: 20px;
}

.btn-clear-cart {
  background-color: #ff4757;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

/* Cart Items */
.cart-items {
  background-color: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.cart-items h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.cart-item {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
}

.item-description {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.item-notes {
  background-color: #fff9e6;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #856404;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.item-price {
  font-size: 16px;
  color: #667eea;
  font-weight: bold;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f5f5f5;
  border-radius: 25px;
  padding: 5px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: white;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.qty-btn:hover {
  background-color: #667eea;
  color: white;
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: bold;
}

.item-total {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.btn-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.btn-remove:hover {
  opacity: 1;
}

/* Add Notes Section */
.add-notes-section {
  background-color: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.add-notes-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
}

.notes-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.notes-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.add-notes-section small {
  color: #999;
  font-size: 12px;
}

/* Order Summary */
.order-summary {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.summary-card {
  background-color: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.summary-card h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.delivery-section,
.payment-section {
  margin-bottom: 20px;
}

.delivery-section h4,
.payment-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.address-box {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.address-box:hover {
  border-color: #667eea;
}

.address-box p {
  margin: 0;
  color: #333;
}

.add-address {
  color: #667eea;
  font-weight: 600;
}

.payment-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.payment-select:focus {
  outline: none;
  border-color: #667eea;
}

.summary-details {
  padding: 20px 0;
  border-top: 2px solid #f0f0f0;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 15px;
}

.summary-row.total {
  font-size: 20px;
  font-weight: bold;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #f0f0f0;
}

.summary-row.total span:last-child {
  color: #667eea;
}

.discount {
  color: #10ac84;
  font-weight: 600;
}

.promo-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.promo-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
}

.promo-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-apply-promo {
  background-color: #10ac84;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-checkout {
  width: 100%;
  padding: 16px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-checkout:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-checkout:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.terms-text {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 15px 0 0 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.address-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.address-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
}

.btn-save {
  flex: 1;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .order-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .cart-item {
    flex-direction: column;
  }

  .item-actions {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
}
</style>
