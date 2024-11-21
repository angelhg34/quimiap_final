import React, { useState, useEffect } from 'react';
import Header2 from '../../componentes/header2';
import axios from 'axios';
import Swal from 'sweetalert2'; // Importa SweetAlert2

const DomicilioAdmin = () => {
  const [domicilios, setDomicilios] = useState([]);
  const [filtroEntregados, setFiltroEntregados] = useState(false); // Estado para manejar el filtro
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Número de domicilios por página

  // Función para obtener domicilios de la API
  const fetchDomiciliosVentasUsuarios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/domiciliosVentasUsuarios`);
      setDomicilios(response.data);
    } catch (error) {
      console.error('Error fetching domicilios, ventas y usuarios:', error);
    }
  };

  useEffect(() => {
    fetchDomiciliosVentasUsuarios();
  }, []);

  // Función para actualizar el estado del domicilio
  const confirmarDomicilio = async (domicilioId) => {
    try {
      await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/domicilio/${domicilioId}`, {
        estado: 'Entregado'
      });

      // Actualizar el estado local después de la actualización
      setDomicilios(domicilios.map(domicilio =>
        domicilio.id === domicilioId ? { ...domicilio, estado: 'Entregado' } : domicilio
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
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Función para alternar el filtro de domicilios entregados
  const toggleFiltroEntregados = () => {
    setFiltroEntregados(!filtroEntregados);
    setCurrentPage(1); // Reiniciar la página actual al cambiar el filtro
  };

  // Filtrar los domicilios si el filtro está activado
  const domiciliosFiltrados = filtroEntregados
    ? domicilios.filter(domicilio => domicilio.estado === 'Entregado')
    : domicilios;

  // Función para manejar el cambio de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calcular los datos que se mostrarán en la tabla para la página actual
  const indexOfLastDomicilio = currentPage * itemsPerPage;
  const indexOfFirstDomicilio = indexOfLastDomicilio - itemsPerPage;
  const currentDomicilios = domiciliosFiltrados.slice(indexOfFirstDomicilio, indexOfLastDomicilio);

  // Número total de páginas
  const totalPages = Math.ceil(domiciliosFiltrados.length / itemsPerPage);

  return (
    <div>
      <Header2 />
      <section className="container mt-5">
        <h2>Consulta de domicilios</h2>
        <br />
        {/* Botón para filtrar domicilios entregados */}
        <button 
          type="button" 
          className="btn btn-success mb-4" 
          onClick={toggleFiltroEntregados}
        >
          {filtroEntregados ? 'Mostrar todos los domicilios' : 'Ver domicilios entregados'}
        </button>
        {/* Tabla de domicilios */}
        <table className="table table-striped mt-4">
          <thead>
            <tr>
              <th>ID domicilio</th>
              <th>Dirección</th>
              <th>Ciudad</th> {/* Nueva columna para la ciudad */}
              <th>Fecha de entrega</th>
              <th>Estado</th> {/* Columna de estado */}
              <th>ID Venta</th> {/* Nueva columna para mostrar el ID de la venta */}
              <th>Cliente</th> {/* Nueva columna para mostrar el nombre del cliente */}
              <th>Precio Total</th> {/* Nueva columna para mostrar el precio total de la venta */}
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {currentDomicilios.length === 0 ? (
              <tr>
                <td colSpan="9">No hay domicilios disponibles.</td>
              </tr>
            ) : (
              currentDomicilios.map((domicilio) => (
                <tr key={domicilio.id_domicilio}>
                  <td>{domicilio.id_domicilio}</td>
                  <td>{domicilio.direccion}</td>
                  <td>{domicilio.ciudad}</td> {/* Mostrar la ciudad */}
                  <td>{domicilio.fecha_entrega}</td>
                  <td>{domicilio.estado_entrega}</td> {/* Mostrar el estado */}
                  <td>{domicilio.id_venta}</td> {/* Mostrar el ID de la venta */}
                  <td>{`${domicilio.nombres} ${domicilio.apellidos}`}</td> {/* Mostrar el nombre del cliente */}
                  <td>{domicilio.precio_total}</td> {/* Mostrar el precio total */}
                  <td>
                    {domicilio.estado !== 'Entregado' && (
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => confirmarDomicilio(domicilio.id)}
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

        {/* Paginación */}
        <nav aria-label="Page navigation">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Anterior</button>
            </li>
            {[...Array(totalPages).keys()].map(number => (
              <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(number + 1)}>
                  {number + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Siguiente</button>
            </li>
          </ul>
        </nav>
      </section>
    </div>
  );
};

export default DomicilioAdmin;
