import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref(JSON.parse(localStorage.getItem('cartItems')) || []);
  const restauranteActual = ref(JSON.parse(localStorage.getItem('restauranteActual')) || null);
  const direccionEntrega = ref(localStorage.getItem('direccionEntrega') || '');
  const metodoPago = ref(localStorage.getItem('metodoPago') || '');

  const saveToLocalStorage = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
    localStorage.setItem('restauranteActual', JSON.stringify(restauranteActual.value));
    localStorage.setItem('direccionEntrega', direccionEntrega.value);
    localStorage.setItem('metodoPago', metodoPago.value);
  };

  const totalItems = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.cantidad, 0);
  });

  const subtotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
  });

  const costoEnvio = computed(() => {
    if (subtotal.value === 0) return 0;
    return subtotal.value > 10000 ? 0 : 2000;
  });

  const total = computed(() => {
    return subtotal.value + costoEnvio.value;
  });

  const tieneItems = computed(() => cartItems.value.length > 0);

  const agregarItem = (producto, cantidad = 1) => {
    if (cartItems.value.length === 0) {
      restauranteActual.value = {
        id: producto.restauranteId,
        nombre: producto.restauranteNombre
      };
    } else if (producto.restauranteId !== restauranteActual.value?.id) {
      if (confirm('¿Desea vaciar el carrito?')) {
        vaciarCarrito();
        restauranteActual.value = {
          id: producto.restauranteId,
          nombre: producto.restauranteNombre
        };
      } else {
        return;
      }
    }

    const itemExistente = cartItems.value.find(item => item.id === producto.id);
    
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
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

  inicializarCarrito();

  return {
    cartItems,
    restauranteActual,
    direccionEntrega,
    metodoPago,
    
    totalItems,
    subtotal,
    costoEnvio,
    total,
    tieneItems,
    
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
  persist: true
});