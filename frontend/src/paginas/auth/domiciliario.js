import React, { useState, useEffect } from 'react';
import Header4 from '../../componentes/header4';
import axios from 'axios';
import Swal from 'sweetalert2'; // Importa SweetAlert2

const Domiciliario = () => {
  const [domicilios, setDomicilios] = useState([]);
  const [filtroEntregados, setFiltroEntregados] = useState(false); // Estado para manejar el filtro
  const [domiciliarioId, setDomiciliarioId] = useState(null); // ID del domiciliario en sesión

  // Obtener el ID del domiciliario en sesión
  useEffect(() => {
    const domiciliarioId = sessionStorage.getItem('userId'); // Obtener el ID del domiciliario del sessionStorage
    setDomiciliarioId(domiciliarioId);
  }, []);

  // Función para obtener domicilios de la API filtrando por el domiciliario en sesión
  const fetchDomicilios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/domiciliosDomiciliario/${domiciliarioId}`, {
        params: {
          userId: domiciliarioId // Pasar el domiciliarioId como parámetro de consulta
        }
      });
      
      setDomicilios(response.data); // Ya no es necesario filtrar en el frontend
    } catch (error) {
      console.error('Error fetching domicilios:', error);
    }
  };

  // Llamada para obtener domicilios cuando se haya definido el domiciliarioId
  useEffect(() => {
    if (domiciliarioId) {
      fetchDomicilios();
    }
  }, [domiciliarioId]);

  // Función para actualizar el estado del domicilio
  const confirmarDomicilio = async (id_domicilio) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/domicilio/${id_domicilio}`, {
        estado_entrega: 'entregado' // Actualiza el estado del domicilio
      });

      // Actualizar el estado local después de la actualización
      setDomicilios(domicilios.map(domicilio =>
        domicilio.id === id_domicilio ? { ...domicilio, estado_entrega: 'entregado' } : domicilio
      ));

      // Mostrar alerta con SweetAlert2
      Swal.fire({
        title: 'Confirmación',
        text: 'Domicilio confirmado como entregado',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating domicilio:', error);

      // Mostrar alerta de error con SweetAlert2
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el estado del domicilio',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Función para alternar el filtro de domicilios entregados
  const toggleFiltroEntregados = () => {
    setFiltroEntregados(!filtroEntregados);
  };

  // Filtrar los domicilios si el filtro está activado
  const domiciliosFiltrados = filtroEntregados
    ? domicilios.filter(domicilio => domicilio.estado_entrega === 'entregado')
    : domicilios.filter(domicilio => domicilio.estado_entrega !== 'entregado');

  return (
    <div>
      <Header4 />
      <section className="container mt-5">
        <h2>Consulta de domicilios</h2>
        <br />
        {/* Botón para filtrar domicilios entregados */}
        <button 
          type="button" 
          className="btn btn-success mb-4" 
          onClick={toggleFiltroEntregados}
        >
          {filtroEntregados ? 'Mostrar domicilios pendientes' : 'Ver domicilios entregados'}
          </button>
        {/* Tabla de domicilios */}
        <table className="table table-striped mt-4">
          <thead>
            <tr>
              <th>ID domicilio</th>
              <th>Dirección</th>
              <th>Ciudad</th>
              <th>Fecha de entrega</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {domiciliosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6">No hay domicilios disponibles.</td>
              </tr>
            ) : (
              domiciliosFiltrados.map((domicilio) => (
                <tr key={domicilio.id_domicilio}>
                  <td>{domicilio.id_domicilio}</td>
                  <td>{domicilio.direccion}</td>
                  <td>{domicilio.ciudad}</td>
                  <td>{domicilio.fecha_entrega}</td>
                  <td>{domicilio.estado_entrega}</td>
                  <td>
                    {domicilio.estado_entrega !== 'entregado' && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => confirmarDomicilio(domicilio.id_domicilio)}
                      >
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Domiciliario;
