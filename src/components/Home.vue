<template>
  <div class="home-container">
    <header class="home-header">
      <h1 class="logo">comidApp</h1>
      <div class="user-info">
        <button class="btn-logout" @click="goToLogin">Cerrar sesión</button>
      </div>
    </header>

    <main class="home-main">
      <h2>Selecciona tu rol</h2>
      <p class="subtitle">Elegí cómo querés ingresar a comidApp</p>

      <div class="home-options">
        <div class="option-card" @click="selectRole('cliente')">
          <i class="fa-solid fa-basket-shopping"></i>
          <h3>Cliente</h3>
          <p>Compra productos y realiza pedidos fácilmente.</p>
        </div>

        <div class="option-card" @click="selectRole('vendedor')">
          <i class="fa-solid fa-store"></i>
          <h3>Vendedor</h3>
          <p>Gestioná tus productos y controlá tus ventas.</p>
        </div>

        <div class="option-card" @click="selectRole('repartidor')">
          <i class="fa-solid fa-motorcycle"></i>
          <h3>Delivery</h3>
          <p>Entregá pedidos y revisá tu historial de entregas.</p>
        </div>
      </div>
    </main>

    <footer class="home-footer">
      <p>© 2025 comidApp — Todos los derechos reservados</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}

const selectRole = (role) => {
  switch (role) {
    case 'cliente':
      router.push('/home-cliente')
      break
    case 'vendedor':
      router.push('/home-vendedor')
      break
    case 'repartidor':
      router.push('/home-repartidor')
      break
    default:
      break
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
}

.home-header {
  background-color: #667eea; 
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 1.8rem; 
  font-weight: 600;
  margin: 0;
  color: white;
  letter-spacing: -0.5px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-logout {
  padding: 10px 20px;
  border: none;
  border-radius: 15px;
  background-color: white;
  color: #667eea;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f8f9fa;
}

.home-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;
}

h2 {
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
}

.subtitle {
  color: #4a5568;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.home-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.option-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-color: #4299e1;
}

.option-card i {
  font-size: 2rem;
  color: #2b6cb0;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.option-card:hover i {
  transform: scale(1.05);
  color: #2c5282;
}

.option-card h3 {
  color: #2d3748;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.option-card p {
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Footer */
.home-footer {
  background-color: #667eea; /* Mismo color que el header */
  color: white;
  text-align: center;
  padding: 1.5rem;
  margin-top: 3rem;
  font-size: 0.9rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .home-header {
    padding: 1rem;
  }

  .home-main {
    padding: 1.5rem;
  }

  .home-options {
    grid-template-columns: 1fr;
  }

  .logo {
    font-size: 1.75rem;
  }
}
</style>