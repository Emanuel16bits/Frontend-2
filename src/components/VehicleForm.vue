<template>
  <div class="vehicle-form">
    <h3>Registrar Vehículo</h3>
    
    <form @submit.prevent="handleSubmit" class="form-container">
      <div class="form-group">
        <label for="tipoVehiculo">Tipo de Vehículo *</label>
        <select 
          id="tipoVehiculo" 
          v-model="formData.tipoVehiculo"
          required
          class="form-control"
        >
          <option value="" disabled>Seleccione un tipo</option>
          <option value="Moto">Moto</option>
          <option value="Auto">Auto</option>
          <option value="Camioneta">Camioneta</option>
          <option value="Bicicleta">Bicicleta</option>
        </select>
      </div>

      <div class="form-group">
        <label for="marca">Marca *</label>
        <input 
          type="text" 
          id="marca" 
          v-model="formData.marca" 
          required
          class="form-control"
          placeholder="Ej: Honda, Toyota, etc."
        >
      </div>

      <div class="form-group">
        <label for="modelo">Modelo *</label>
        <input 
          type="text" 
          id="modelo" 
          v-model="formData.modelo" 
          required
          class="form-control"
          placeholder="Ej: Civic, Corolla, etc."
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="anio">Año *</label>
          <input 
            type="number" 
            id="anio" 
            v-model.number="formData.anio" 
            required
            min="1900"
            :max="new Date().getFullYear() + 1"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="color">Color *</label>
          <input 
            type="text" 
            id="color" 
            v-model="formData.color" 
            required
            class="form-control"
            placeholder="Color del vehículo"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="placa">Placa *</label>
        <input 
          type="text" 
          id="placa" 
          v-model="formData.placa" 
          required
          class="form-control"
          placeholder="Número de placa"
          style="text-transform: uppercase"
        >
      </div>

      <div v-if="error" class="error-message">
        <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
      </div>

      <div class="form-actions">
        <button 
          type="button" 
          @click="$emit('cancel')"
          class="btn btn-secondary"
          :disabled="loading" 
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading"
        >
          <span v-if="loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Guardando...
          </span>
          <span v-else>
            <i class="fa-solid fa-save"></i> Guardar Vehículo
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const API_URL = 'http://localhost:3000/drivers';
const emit = defineEmits(['saved', 'cancel']);

const formData = ref({
  tipoVehiculo: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  color: '',
  placa: ''
});

const loading = ref(false);
const error = ref(null);

const handleSubmit = async () => {
  try {
    const userId = authStore.user?.id;
    if (!userId) {
      console.error('Usuario no autenticado');
      return;
    }

    console.log('id del usuario', userId);
    console.log('usuario autenticado', authStore.user);

    const dataToSend = {
      tipoVehiculo: formData.value.tipoVehiculo,
      marca: formData.value.marca,
      modelo: formData.value.modelo,
      anio: formData.value.anio ? parseInt(formData.value.anio) : undefined,
      color: formData.value.color,
      placa: formData.value.placa.toUpperCase(), 
    };

    console.log('Enviando datos a la api', {
      url: `${API_URL}/user/${userId}/vehiculo`,
      method: 'PATCH',
      data: dataToSend,
    });

    const response = await axios.patch(
      `${API_URL}/user/${userId}/vehiculo`,
      dataToSend,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        }
      }
    );

    console.log('Respuesta del servidor', response.data);
    emit('saved');
  } catch (error) {
    console.error('Error al guardar el vehiculo', error);
    if (error.response) {
      console.error('Detalles del error', error.response.data);
    }
    throw error;
  }
};
</script>

<style scoped>
.vehicle-form {
  padding: 1rem;
  color: #2d3748;
}

h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.95rem;
}

.form-control {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: #fff;
  color: #2d3748;
}

.form-control:focus {
  border-color: #4f46e5;
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
  padding-right: 2.5rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message i {
  font-size: 1.1em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #edf2f7;
}

.btn {
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-primary:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn {
    width: 100%;
  }
}
</style>