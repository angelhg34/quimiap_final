import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header3 from '../../componentes/header3';

const VentasjfProduccion = () => {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]); // Estado para ventas filtradas
  const [fechaFiltro, setFechaFiltro] = useState(''); // Estado para la fecha del filtro
  const [clienteIdFiltro, setClienteIdFiltro] = useState(''); // Estado para el ID del cliente
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Número de ventas por página

  // Función para obtener VENTAS y USUARIOS de la API
  const fetchVentasUsuarios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ventasUsuariosAdmin`);
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

  // Función para manejar el cambio en el input de ID de cliente
  const handleClienteIdChange = (e) => {
    setClienteIdFiltro(e.target.value);
  };

  // Función para filtrar las ventas cuando se hace clic en el botón de búsqueda
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

    // Filtrar por cliente ID si se ingresó uno
    if (clienteIdFiltro) {
      ventasFiltradas = ventasFiltradas.filter((venta) =>
        venta.cliente_id === clienteIdFiltro
      );
    }

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
      <Header3 />
      <div className="container">
        <section className="container mt-5">
          <h2>Consulta de Ventas</h2>
          <br />

          {/* Filtros para fecha y cliente ID */}
          <div className="mb-3 d-flex align-items-center">
            <label htmlFor="fechaFiltro" className="form-label me-3">Filtrar por Fecha (YYYY-MM-DD):</label>
            <input
              type="text"
              id="fechaFiltro"
              className="form-control me-2"
              style={{ width: '200px' }}  // Ajusta el tamaño del input
              placeholder="YYYY-MM-DD"
              value={fechaFiltro}
              onChange={handleFechaChange}
            />
          </div>

          <div className="mb-3 d-flex align-items-center">
            <label htmlFor="clienteIdFiltro" className="form-label me-3">Filtrar por ID de Cliente:</label>
            <input
              type="text"
              id="clienteIdFiltro"
              className="form-control me-2"
              style={{ width: '200px' }}  // Ajusta el tamaño del input
              placeholder="ID de Cliente"
              value={clienteIdFiltro}
              onChange={handleClienteIdChange}
            />
          </div>

          {/* Botón para filtrar las ventas */}
          <button type="button" className="btn btn-success mb-3" onClick={filtrarVentas}>Buscar</button>

          {/* Tabla de ventas */}
          <table className="table table-striped mt-4">
            <thead>
              <tr>
                <th>ID Venta</th>
                <th>Fecha Venta</th>
                <th>Método de Pago</th>
                <th>Precio Total</th>
                <th>Estado</th>
                <th>ID Cliente</th>
              </tr>
            </thead>
            <tbody>
              {currentVentas.map((venta) => (
                <tr key={venta.id_venta}>
                  <td>{venta.id_venta}</td>
                  <td>{venta.fecha_venta}</td>
                  <td>{venta.metodo_pago}</td>
                  <td>{venta.precio_total}</td>
                  <td>{venta.estado}</td>
                  <td>{venta.num_doc}</td>
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
}

export default VentasjfProduccion;
