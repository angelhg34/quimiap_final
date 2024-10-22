import React, { useState, useEffect } from 'react';
import Header2 from '../../componentes/header2';
import axios from 'axios';
import Swal from 'sweetalert2';

const VentasAdmin = () => {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const clienteId = sessionStorage.getItem('userId');
  const [identificacionFiltro, setIdentificacionFiltro] = useState('');


  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Función para obtener VENTAS y USUARIOS de la API
  const fetchVentasUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:4001/ventasUsuariosAdmin');
      setVentas(response.data);
      setFilteredVentas(response.data); // Inicialmente, mostrar todas las ventas
    } catch (error) {
      console.error('Error fetching ventas y usuarios:', error);
    }
  };

  useEffect(() => {
    fetchVentasUsuarios(); // Llamar al nuevo endpoint
  }, []);

  // Función para manejar el cambio en el input de fecha
  const handleFechaChange = (e) => {
    setFechaFiltro(e.target.value);
  };

  // Función para manejar el cambio en el input de número de identificación
  const handleIdentificacionChange = (e) => {
    setIdentificacionFiltro(e.target.value);
  };

  // Función para filtrar las ventas
  const filtrarVentas = () => {
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;

    let ventasFiltradas = ventas;

    // Filtrar por fecha si se ingresó una
    if (fechaFiltro && regexFecha.test(fechaFiltro)) {
      ventasFiltradas = ventasFiltradas.filter((venta) =>
        venta.fecha_venta.startsWith(fechaFiltro)
      );
    } else if (fechaFiltro && !regexFecha.test(fechaFiltro)) {
      Swal.fire({
        icon: 'error',
        title: 'Formato de fecha incorrecto',
        text: 'Use el formato YYYY-MM-DD',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }
    
    // Filtrar por número de identificación
    ventasFiltradas = ventasFiltradas.filter((venta) =>
      String(venta.num_doc) === String(identificacionFiltro)
    );

    setFilteredVentas(ventasFiltradas);
    setCurrentPage(1); // Reiniciar la página actual a 1 al aplicar el filtro
  };

  // Función para manejar el cambio de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calcular los datos que se mostrarán en la tabla para la página actual
  const indexOfLastVenta = currentPage * itemsPerPage;
  const indexOfFirstVenta = indexOfLastVenta - itemsPerPage;
  const currentVentas = filteredVentas.slice(indexOfFirstVenta, indexOfLastVenta);

  // Número total de páginas
  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);

  return (
    <div>
      <Header2 />
      <div className="container">
        <section className="container mt-5">
          <h2>Consulta de Ventas</h2>
          <br />

          {/* Filtros para fecha y número de identificación */}
          <div className="mb-3 d-flex align-items-center">
            <label htmlFor="fechaFiltro" className="form-label me-3">Filtrar por Fecha (YYYY-MM-DD):</label>
            <input
              type="text"
              id="fechaFiltro"
              className="form-control me-2"
              style={{ width: '200px' }}
              placeholder="YYYY-MM-DD"
              value={fechaFiltro}
              onChange={handleFechaChange}
            />
          </div>

          <div className="mb-3 d-flex align-items-center">
            <label htmlFor="identificacionFiltro" className="form-label me-3">Filtrar por N° de Identificación:</label>
            <input
              type="text"
              id="identificacionFiltro"
              className="form-control me-2"
              style={{ width: '200px' }}
              placeholder="N° de Identificación"
              value={identificacionFiltro}
              onChange={handleIdentificacionChange}
            />
          </div>

          {/* Botón para filtrar las ventas */}
          <button type="button" className="btn btn-success mb-3" onClick={filtrarVentas}>Buscar</button>

          {/* Tabla de ventas */}
          <table className="table table-striped mt-4">
            <thead>
              <tr>
                <th>N° Identificación</th>
                <th>ID Venta</th>
                <th>Fecha Venta</th>
                <th>Método de Pago</th>
                <th>Precio Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {currentVentas.map((venta) => (
                <tr key={venta.id_venta}>
                  <td>{venta.num_doc}</td>
                  <td>{venta.id_venta}</td>
                  <td>{venta.fecha_venta}</td>
                  <td>{venta.metodo_pago}</td>
                  <td>{venta.precio_total}</td>
                  <td>{venta.estado}</td>
                </tr>
              ))}
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
    </div>
  );
};

export default VentasAdmin;
