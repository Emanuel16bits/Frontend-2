<template>
  <div class="products-container">
    <!-- Header -->
    <div class="header">
      <button @click="router.back()" class="back-btn">←</button>
      <h1>Mis Productos</h1>
      <button @click="showAddForm = true" class="add-btn">
        <span>+</span> Nuevo Producto
      </button>
    </div>

    <!-- Formulario de producto -->
    <div v-if="showAddForm" class="product-form">
      <h2>{{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Nombre</label>
            <input 
              type="text" 
              id="name" 
              v-model="currentProduct.nombre" 
              required
            />
          </div>
          <div class="form-group">
            <label for="price">Precio</label>
            <input 
              type="number" 
              id="price" 
              v-model.number="currentProduct.precio" 
              min="0" 
              step="0.01" 
              required
              @input="currentProduct.precio = Number($event.target.value) || 0"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="stock">Stock</label>
            <input 
              type="number" 
              id="stock" 
              v-model.number="currentProduct.stock" 
              min="0" 
              required
              @input="currentProduct.stock = Number($event.target.value) || 0"
            />
          </div>
          <div class="form-group">
            <label for="category">Categoría</label>
            <select id="category" v-model="currentProduct.categoria" required>
              <option value="">Selecciona una categoría</option>
              <option value="comida">Comida</option>
              <option value="bebida">Bebida</option>
              <option value="postre">Postre</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea 
            id="description" 
            v-model="currentProduct.descripcion"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label>Imagen del producto</label>
          
          <!-- Opción para subir archivo -->
          <div class="image-option">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input"
              style="display: none"
            />
            <button type="button" class="image-option-btn" @click="$refs.fileInput.click()">
              <span>📁</span> Subir imagen
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              style="display: none"
            />
          </div>

          <!-- O texto "o" entre opciones -->
          <div class="image-option-divider">o</div>

          <!-- Opción para ingresar URL -->
          <div class="image-option">
            <input
              type="url"
              v-model="imageUrl"
              placeholder="https://ejemplo.com/imagen.jpg"
              class="url-input"
              @input="handleImageUrl"
            />
          </div>

          <!-- Vista previa -->
          <div v-if="currentProduct.imagen" class="image-preview">
            <img :src="currentProduct.imagen" alt="Vista previa de la imagen" />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="cancelEdit">
            Cancelar
          </button>
          <button type="submit" class="btn-save" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Lista de productos -->
    <div class="products-list">
      <div v-if="loading" class="loading">Cargando productos...</div>
      <div v-else-if="products.length === 0" class="no-products">
        No hay productos registrados
      </div>
      <div v-else class="product-grid">
        <div v-for="product in products" :key="product.idProduct" class="product-card">
          <div class="product-image">
            <img 
              :src="product.imagen || 'https://via.placeholder.com/300x200?text=Sin+imagen'" 
              :alt="product.nombre"
            />
          </div>
          <div class="product-info">
            <h3>{{ product.nombre }}</h3>
            <div class="price">${{ Number(product.precio || 0).toFixed(2) }}</div>
            <div class="stock">Disponibles: {{ product.stock }}</div>
            <span class="category">{{ product.categoria }}</span>
            <p class="description">{{ product.descripcion }}</p>
          </div>
          <div class="product-actions">
            <button @click="editProduct(product)" class="btn-edit">
              <span>✏️</span> Editar
            </button>
            <button @click="deleteProductHandler(product.idProduct)" class="btn-delete">
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  getProductsByRestaurant, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/services/productsService'

const router = useRouter()
const authStore = useAuthStore()

// Estado
const products = ref([])
const loading = ref(false)
const showAddForm = ref(false)
const editingProduct = ref(null)
const imageUrl = ref('')

const currentProduct = ref({
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  imagen: '',
  categoria: '',
  disponible: true
})

// Cargar productos al montar el componente
onBeforeMount(() => {
  console.log('Auth store al montar productos:', authStore.user)
  loadProducts()
})

// Cargar productos
const loadProducts = async () => {
  try {
    loading.value = true
    const vendorId = authStore.user?.idUsuario || authStore.user?.id
    
    if (!vendorId) {
      console.error('No se pudo obtener el ID del vendedor. User object:', authStore.user)
      return
    }
    
    const productsData = await getProductsByRestaurant(vendorId)
    const processedProducts = productsData.map(product => ({
      ...product,
      precio: Number(product.precio) || 0,
      stock: Number(product.stock) || 0
    }))
    products.value = processedProducts
  } catch (error) {
    console.error('Error al cargar productos:', error.message || error)
    alert(error.message || 'Error al cargar los productos')
  } finally {
    loading.value = false
  }
}

// Manejar carga de imagen
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    currentProduct.value.imagen = e.target.result
    imageUrl.value = '' // Limpiar URL si se sube un archivo
  }
  reader.readAsDataURL(file)
}

// Manejar URL de imagen
const handleImageUrl = (event) => {
  if (imageUrl.value) {
    currentProduct.value.imagen = imageUrl.value
  }
}

// Editar producto
const editProduct = (product) => {
  editingProduct.value = product
  currentProduct.value = { 
    ...product,
    precio: Number(product.precio) || 0,
    stock: Number(product.stock) || 0
  }
  // Si la imagen es una URL, la mostramos en el campo de URL
  if (product.imagen && (product.imagen.startsWith('http') || product.imagen.startsWith('data:'))) {
    imageUrl.value = product.imagen
  } else {
    imageUrl.value = ''
  }
  showAddForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Cancelar edición
const cancelEdit = () => {
  editingProduct.value = null
  resetForm()
  showAddForm.value = false
}

// Reiniciar formulario
const resetForm = () => {
  currentProduct.value = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen: '',
    categoria: '',
    disponible: true
  }
  imageUrl.value = ''
}

// Guardar o actualizar producto
const handleSubmit = async () => {
  try {
    loading.value = true
    
    const productData = {
      ...currentProduct.value,
      precio: Number(currentProduct.value.precio) || 0,
      stock: Number(currentProduct.value.stock) || 0
    }

    if (editingProduct.value?.idProduct) {
      const updatedProduct = await updateProduct(
        editingProduct.value.idProduct,
        productData
      )
      
      const index = products.value.findIndex(p => p.idProduct === editingProduct.value.idProduct)
      if (index !== -1) {
        products.value[index] = {
          ...updatedProduct,
          precio: Number(updatedProduct.precio) || 0,
          stock: Number(updatedProduct.stock) || 0
        }
      }
    } else {
      const newProduct = await createProduct({
        ...productData,
        usuarioId: Number(authStore.user?.idUsuario || authStore.user?.id)
      })
      products.value.unshift({
        ...newProduct,
        precio: Number(newProduct.precio) || 0,
        stock: Number(newProduct.stock) || 0
      })
    }
    
    resetForm()
    showAddForm.value = false
  } catch (error) {
    console.error('Error al guardar el producto:', error.message || error)
    alert(error.message || 'Error al guardar el producto')
  } finally {
    loading.value = false
  }
}

// Eliminar producto
const deleteProductHandler = async (productId) => {
  if (!productId || isNaN(Number(productId))) {
    console.error('ID de producto inválido:', productId)
    return
  }
  
  if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
    return
  }
  
  try {
    await deleteProduct(Number(productId))
    products.value = products.value.filter(p => p.idProduct !== productId)
  } catch (error) {
    console.error('Error al eliminar el producto:', error.message || error)
    alert(error.message || 'Error al eliminar el producto')
  }
}
</script>

<style scoped>
.products-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  margin-right: 1rem;
  color: #4a5568;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f7fafc;
}

.header h1 {
  flex: 1;
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
}

.add-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.product-form {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

input[type="text"],
input[type="number"],
input[type="url"],
select,
textarea,
.file-input,
.url-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
}

input:focus,
select:focus,
textarea:focus,
.file-input:focus,
.url-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

textarea {
  min-height: 100px;
  resize: vertical;
}

/* Estilos para las opciones de imagen */
.image-option {
  margin-bottom: 0.75rem;
}

.image-option-btn {
  width: 100%;
  padding: 0.6rem;
  background: #f7fafc;
  border: 1px dashed #cbd5e0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.image-option-btn:hover {
  background: #edf2f7;
  border-color: #a0aec0;
}

.image-option-divider {
  text-align: center;
  margin: 0.5rem 0;
  color: #a0aec0;
  font-size: 0.9rem;
  position: relative;
}

.image-option-divider::before,
.image-option-divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #e2e8f0;
}

.image-option-divider::before {
  left: 0;
}

.image-option-divider::after {
  right: 0;
}

.image-preview {
  margin-top: 1rem;
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-save {
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #e2e8f0;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn-cancel:hover {
  background: #cbd5e0;
}

.btn-save {
  background: #667eea;
  color: white;
  border: none;
}

.btn-save:hover {
  background: #5a67d8;
}

.products-list {
  margin-top: 1.5rem;
}

.loading,
.no-products {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  padding: 0.5rem;
}

.product-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 160px;
  overflow: hidden;
  background: #f7fafc;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-info h3 {
  margin: 0 0 0.5rem;
  color: #2d3748;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price {
  font-weight: 700;
  color: #2f855a;
  margin: 0.25rem 0;
  font-size: 1.1rem;
}

.stock {
  font-size: 0.9rem;
  color: #4a5568;
  margin: 0.25rem 0 0.5rem;
}

.category {
  display: inline-block;
  background: #ebf8ff;
  color: #2b6cb0;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  align-self: flex-start;
}

.description {
  color: #718096;
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.product-actions {
  display: flex;
  border-top: 1px solid #edf2f7;
  padding: 0.75rem;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-edit,
.btn-delete {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-edit {
  background: #ebf8ff;
  color: #3182ce;
}

.btn-edit:hover {
  background: #bee3f8;
}

.btn-delete {
  background: #fff5f5;
  color: #e53e3e;
}

.btn-delete:hover {
  background: #fed7d7;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .header h1 {
    font-size: 1.25rem;
  }

  .add-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .product-image {
    height: 140px;
  }

  .product-info {
    padding: 1rem;
  }

  .product-info h3 {
    font-size: 1rem;
  }

  .description {
    font-size: 0.85rem;
  }

  .btn-edit,
  .btn-delete {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-card {
    flex-direction: row;
  }

  .product-image {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .product-info {
    padding: 0.75rem;
  }

  .product-actions {
    flex-direction: column;
    padding: 0.75rem;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
  }
}
</style>