<template>
  <div class="products-container">
    <!-- Header -->
    <div class="header">
      <button @click="router.back()" class="back-btn">←</button>
      <h1>Mis Productos</h1>
      <button @click="showForm = !showForm" class="add-btn">
        {{ showForm ? 'Cancelar' : 'Agregar Producto' }}
      </button>
    </div>

    <div v-if="userRestaurants.length > 0" class="restaurant-selector">
      <label class="form-label">Selecciona un restaurante</label>
      <select 
        v-model="currentProduct.restaurantId" 
        class="form-select" 
        required
        :disabled="!!editingProduct"
      >
        <option value="">Selecciona un restaurante</option>
        <option 
          v-for="restaurant in userRestaurants" 
          :key="restaurant.id" 
          :value="restaurant.id"
        >
          {{ restaurant.nombre }}
        </option>
      </select>
    </div>

    <div v-else class="no-restaurants">
      <p>No tienes restaurantes registrados</p>
      <button @click="goTo('/registrar-restaurante')" class="btn-add-restaurant">
        Crear Restaurante
      </button>
    </div>

    <div v-if="showForm" class="product-form">
      <h2>{{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input 
            v-model="currentProduct.nombre" 
            type="text" 
            class="form-input" 
            required 
            placeholder="Nombre del producto"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea 
            v-model="currentProduct.descripcion" 
            class="form-input" 
            rows="3" 
            placeholder="Descripción del producto"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Precio</label>
            <input 
              v-model.number="currentProduct.precio" 
              type="number" 
              step="0.01" 
              min="0" 
              class="form-input" 
              required
              placeholder="0.00"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Stock</label>
            <input 
              v-model.number="currentProduct.stock" 
              type="number" 
              min="0" 
              class="form-input" 
              required
              placeholder="0"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select v-model="currentProduct.categoria" class="form-select" required>
              <option value="">Selecciona una categoría</option>
              <option value="comida">Comida</option>
              <option value="bebida">Bebida</option>
              <option value="postre">Postre</option>
              <option value="entrada">Entrada</option>
              <option value="ensalada">Ensalada</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Imagen</label>
          <div class="image-upload">
            <div v-if="currentProduct.imagen" class="image-preview">
              <img :src="currentProduct.imagen" alt="Vista previa" class="preview-image">
            </div>
            <input 
              type="file" 
              ref="fileInput"
              @change="handleImageUpload" 
              accept="image/*" 
              class="file-input"
            >
            <button type="button" class="btn-upload" @click="$refs.fileInput.click()">
              <i class="fa-solid fa-upload"></i> Subir Imagen
            </button>
            <input 
              v-model="imageUrl" 
              type="url" 
              class="form-input" 
              placeholder="O pega la URL de una imagen"
              @change="handleImageUrl"
            >
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cancelEdit" class="btn btn-cancel">
            Cancelar
          </button>
          <button type="submit" class="btn btn-save">
            {{ editingProduct ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="userRestaurants.length > 0" class="products-list">
      <div v-if="loading" class="loading">Cargando productos...</div>
      <template v-else>
        <div v-if="products.length === 0" class="no-products">
          No hay productos registrados para este restaurante
        </div>
        <div v-else class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-image">
              <img v-if="product.imagen" :src="product.imagen" :alt="product.nombre">
              <div v-else class="no-image">Sin imagen</div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.nombre }}</h3>
              
              <div class="product-details">
                <div class="price-stock">
                  <span class="price">${{ Number(product.precio).toFixed(2) }}</span>
                  <span class="stock">• {{ product.stock }} en stock</span>
                </div>
                <span class="category">{{ formatCategory(product.categoria) }}</span>
              </div>
              
              <p v-if="product.descripcion" class="product-description">{{ product.descripcion }}</p>
              
              <div class="product-actions">
                <button @click.stop="editProduct(product)" class="btn-edit">
                  <i class="fa-regular fa-pen-to-square"></i> Editar
                </button>
                <button @click.stop="confirmDelete(product)" class="btn-delete">
                  <i class="fa-regular fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  getProductsByRestaurant, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/services/productsService'
import { getRestaurantsByUser } from '@/services/restaurantsService'
import { watch } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

const products = ref([])
const loading = ref(false)
const showForm = ref(false)
const editingProduct = ref(null)
const userRestaurants = ref([])
const imageUrl = ref('')
const fileInput = ref(null)

const currentProduct = ref({
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  imagen: '',
  categoria: '',
  restaurantId: null,
  userId: null
})

watch(() => currentProduct.value.restaurantId, (newVal) => {
  if (newVal) {
    console.log('Restaurante cambiado a:', newVal)
    loadProducts()
  }
})
const loadUserRestaurants = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return
    
    const restaurants = await getRestaurantsByUser(userId)
    userRestaurants.value = Array.isArray(restaurants) ? restaurants : []
    
    if (userRestaurants.value.length > 0) {
      currentProduct.value.restaurantId = userRestaurants.value[0].id
      await loadProducts()
    }
  } catch (error) {
    console.error('Error al cargar restaurantes:', error)
    userRestaurants.value = []
  }
}

const loadProducts = async () => {
  try {
    loading.value = true
    if (!currentProduct.value.restaurantId) {
      products.value = []
      return
    }
    
    console.log('Cargando productos para restaurante', currentProduct.value.restaurantId)
    const response = await getProductsByRestaurant(currentProduct.value.restaurantId)
    console.log('Respuesta de la api', response)
    
    products.value = Array.isArray(response) ? response : []
    console.log('Productos cargados', products.value)
    
  } catch (error) {
    console.error('Error al cargar productos', error)
    products.value = []
  } finally {
    loading.value = false
  }
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    currentProduct.value.imagen = e.target.result
    imageUrl.value = ''
  }
  reader.readAsDataURL(file)
}

const handleImageUrl = () => {
  if (imageUrl.value) {
    currentProduct.value.imagen = imageUrl.value
  }
}

const editProduct = (product) => {
  const productCopy = JSON.parse(JSON.stringify(product))
  
  console.log('Editando producto', productCopy)
  
  const productId = productCopy.id || productCopy.idProduct
  if (!productId) {
    console.error('El producto no tiene un id valido', productCopy)
    alert('No se puede editar el producto, id no valido')
    return
  }
  
  productCopy.id = productId
  
  editingProduct.value = { ...productCopy }
  
  currentProduct.value = { 
    ...productCopy,
    restaurantId: productCopy.restaurantId || currentProduct.value.restaurantId
  }
  
  imageUrl.value = productCopy.imagen || ''
  showForm.value = true
  
  console.log('Producto listo para editar', JSON.parse(JSON.stringify(editingProduct.value)))
}

const cancelEdit = () => {
  editingProduct.value = null
  resetForm()
  showForm.value = false
}

const resetForm = () => {
  currentProduct.value = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen: '',
    categoria: '',
    restaurantId: userRestaurants.value[0]?.id || null,
    userId: authStore.user?.id
  }
  imageUrl.value = ''
}

const handleSubmit = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) {
      console.error('Usuario no autenticado')
      return
    }

    if (!currentProduct.value.restaurantId) {
      alert('Por favor selecciona un restaurante')
      return
    }

    const productData = {
      nombre: currentProduct.value.nombre,
      descripcion: currentProduct.value.descripcion,
      precio: Number(currentProduct.value.precio),
      stock: Number(currentProduct.value.stock),
      categoria: currentProduct.value.categoria,
      imagen: currentProduct.value.imagen || null,
      restaurantId: currentProduct.value.restaurantId
    }

    console.log('Guardando producto', productData)

    if (editingProduct.value) {
      if (!editingProduct.value.id) {
        throw new Error('No se pudo identificar el producto a actualizar')
      }
      
      const updateData = {
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        precio: productData.precio,
        stock: productData.stock,
        categoria: productData.categoria,
        imagen: productData.imagen,
        restaurantId: productData.restaurantId
      }
      
      console.log('Actualizando producto con id', editingProduct.value.id, 'con datos', updateData)
      await updateProduct(editingProduct.value.id, updateData)
    } else {
      await createProduct({ ...productData, userId })
    }

    alert(editingProduct.value ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
    await loadProducts()
    
    resetForm()
    showForm.value = false
    editingProduct.value = null
    
  } catch (error) {
    console.error('Error al guardar el producto', error)
    alert('Ocurrió un error al guardar el producto ' + (error.response?.data?.message || error.message))
  }
}

const confirmDelete = async (product) => {
  const productId = product?.id || product?.idProduct || product?._id;
  
  if (!productId) {
    console.error('No se pudo obtener el id del producto', product);
    alert('No se pudo identificar el producto');
    return;
  }

  if (confirm('¿Queeres eliminar este producto?')) {
    try {
      console.log('Intentando eliminar producto con id', productId, 'Producto completo:', product);
      await deleteProduct(productId);
      await loadProducts();
      alert('Producto eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el producto', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      alert(`No se pudo eliminar el producto ${errorMessage}`);
    }
  }
}

const goTo = (path) => {
  router.push(path)
}
const formatCategory = (category) => {
  if (!category) return ''
  return category.charAt(0).toUpperCase() + category.slice(1)
}

onMounted(() => {
  loadUserRestaurants()
})
</script>
<style scoped>
.products-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
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
  border-radius: 8px;
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

.image-upload {
  margin-top: 0.5rem;
}

.image-preview {
  margin-top: 1rem;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.file-input {
  display: none;
}

.btn-upload {
  width: 100%;
  padding: 0.6rem;
  background: #f7fafc;
  border: 1px dashed #cbd5e0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  transition: all 0.2s;
}

.btn-upload:hover {
  background: #edf2f7;
  border-color: #a0aec0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel,
.btn-save {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 160px;
  overflow: hidden;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-name {
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.price-stock {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.price {
  font-weight: 700;
  color: #2563eb;
  font-size: 1.1rem;
  white-space: nowrap;
}

.stock {
  font-size: 0.9rem;
  color: #64748b;
}

.category {
  font-size: 0.8rem;
  color: white;
  background: #4f46e5;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.product-description {
  color: #64748b;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.4em;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  line-height: 1.2;
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

@media (max-width: 768px) {
  .products-container {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
  }
  
  .product-image {
    height: 140px;
  }
  
  .product-info {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .products-container {
    padding: 0.75rem;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.5rem;
  }
  
  .product-card {
    max-width: 100%;
  }
  
  .product-image {
    height: 120px;
  }
  
  .product-info {
    padding: 0.6rem;
  }
  
  .product-info h3 {
    font-size: 0.9rem;
  }
  
  .product-description {
    font-size: 0.8rem;
  }
  
  .price {
    font-size: 0.9rem;
  }
  
  .btn-edit, .btn-delete {
    font-size: 0.75rem;
    padding: 0.35rem 0.4rem;
  }
  
  .btn-edit i, .btn-delete i {
    display: none;
  }
}

.loading,
.no-products {
  text-align: center;
  padding: 2rem;
  color: #718096;
  grid-column: 1 / -1;
}

.restaurant-selector {
  margin-bottom: 1.5rem;
}

.restaurant-selector .form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

.restaurant-selector .form-select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: white;
}

.restaurant-selector .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}
</style>