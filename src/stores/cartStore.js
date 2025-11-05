import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  // Estado del carrito
  const cartItems = ref(JSON.parse(localStorage.getItem('cartItems')) || []);
  const restauranteActual = ref(JSON.parse(localStorage.getItem('restauranteActual')) || null);
  const direccionEntrega = ref(localStorage.getItem('direccionEntrega') || '');
  const metodoPago = ref(localStorage.getItem('metodoPago') || '');

  // Guardar en localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
    localStorage.setItem('restauranteActual', JSON.stringify(restauranteActual.value));
    localStorage.setItem('direccionEntrega', direccionEntrega.value);
    localStorage.setItem('metodoPago', metodoPago.value);
  };

  // Getters
  const totalItems = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.cantidad, 0);
  });

  const subtotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
  });

  const costoEnvio = computed(() => {
    // Lógica para calcular el costo de envío
    if (subtotal.value === 0) return 0;
    return subtotal.value > 10000 ? 0 : 2000; // Envío gratis para compras mayores a $10,000
  });

  const total = computed(() => {
    return subtotal.value + costoEnvio.value;
  });

  const tieneItems = computed(() => cartItems.value.length > 0);

  // Acciones
  const agregarItem = (producto, cantidad = 1) => {
    // Si es el primer producto, asignar el restaurante
    if (cartItems.value.length === 0) {
      restauranteActual.value = {
        id: producto.restauranteId,
        nombre: producto.restauranteNombre
      };
    } else if (producto.restauranteId !== restauranteActual.value?.id) {
      // Si el producto es de otro restaurante, preguntar si quiere vaciar el carrito
      if (confirm('¿Desea vaciar el carrito y agregar productos del nuevo restaurante?')) {
        vaciarCarrito();
        restauranteActual.value = {
          id: producto.restauranteId,
          nombre: producto.restauranteNombre
        };
      } else {
        return; // No hacer nada si el usuario cancela
      }
    }

    const itemExistente = cartItems.value.find(item => item.id === producto.id);
    
    if (itemExistente) {
      // Si el producto ya está en el carrito, aumentar la cantidad
      itemExistente.cantidad += cantidad;
    } else {
      // Si no está, agregarlo al carrito
      cartItems.value.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        cantidad: cantidad,
        imagen: producto.imagen,
        restauranteId: producto.restauranteId,
        restauranteNombre: producto.restauranteNombre,
        notas: ''
      });
    }
    
    saveToLocalStorage();
  };

  const eliminarItem = (productoId) => {
    const index = cartItems.value.findIndex(item => item.id === productoId);
    if (index !== -1) {
      cartItems.value.splice(index, 1);
      
      // Si no hay más items, limpiar el restaurante actual
      if (cartItems.value.length === 0) {
        restauranteActual.value = null;
      }
      
      saveToLocalStorage();
    }
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      eliminarItem(productoId);
      return;
    }
    
    const item = cartItems.value.find(item => item.id === productoId);
    if (item) {
      item.cantidad = nuevaCantidad;
      saveToLocalStorage();
    }
  };

  const actualizarNotas = (productoId, notas) => {
    const item = cartItems.value.find(item => item.id === productoId);
    if (item) {
      item.notas = notas;
      saveToLocalStorage();
    }
  };

  const actualizarDireccion = (nuevaDireccion) => {
    direccionEntrega.value = nuevaDireccion;
    saveToLocalStorage();
  };

  const actualizarMetodoPago = (nuevoMetodo) => {
    metodoPago.value = nuevoMetodo;
    saveToLocalStorage();
  };

  const vaciarCarrito = () => {
    cartItems.value = [];
    restauranteActual.value = null;
    direccionEntrega.value = '';
    metodoPago.value = '';
    saveToLocalStorage();
  };

  // Inicializar desde localStorage
  const inicializarCarrito = () => {
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      cartItems.value = JSON.parse(storedCart);
    }
    
    const storedRestaurante = localStorage.getItem('restauranteActual');
    if (storedRestaurante) {
      restauranteActual.value = JSON.parse(storedRestaurante);
    }
    
    const storedDireccion = localStorage.getItem('direccionEntrega');
    if (storedDireccion) {
      direccionEntrega.value = storedDireccion;
    }
    
    const storedMetodoPago = localStorage.getItem('metodoPago');
    if (storedMetodoPago) {
      metodoPago.value = storedMetodoPago;
    }
  };

  // Inicializar al cargar el store
  inicializarCarrito();

  return {
    // Estado
    cartItems,
    restauranteActual,
    direccionEntrega,
    metodoPago,
    
    // Getters
    totalItems,
    subtotal,
    costoEnvio,
    total,
    tieneItems,
    
    // Acciones
    agregarItem,
    eliminarItem,
    actualizarCantidad,
    actualizarNotas,
    actualizarDireccion,
    actualizarMetodoPago,
    vaciarCarrito,
    inicializarCarrito
  };
}, {
  // Configuración del store
  persist: true // Habilita la persistencia del store
});