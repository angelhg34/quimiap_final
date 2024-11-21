import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header4 from '../../componentes/header4';

const VentasDomiciliario = () => {
  const [ventasDomicilios, setVentasDomicilios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [detallesVenta, setDetallesVenta] = useState({});
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [clienteIdFiltro, setClienteIdFiltro] = useState('');

  useEffect(() => {
    const id = sessionStorage.getItem('userId');
    fetchDomiciliosConVentas(id);
    fetchProductos();
  }, []);

  // Función para obtener domicilios y ventas del domiciliario de la API
  const fetchDomiciliosConVentas = async (domiciliarioId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/domicilios-con-ventas?domiciliario_id=${domiciliarioId}`);
      setVentasDomicilios(response.data);
    } catch (error) {
      console.error('Error fetching domicilios con ventas:', error);
    }
  };

  // Función para obtener productos de la API
  const fetchProductos = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/Producto`);
      setProductos(response.data);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  };

  // Función para obtener detalles de venta de la API
  const fetchDetallesVenta = async (ventaId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/SaleDetails?venta_id=${ventaId}`);
      setDetallesVenta(prev => ({
        ...prev,
        [ventaId]: response.data
      }));
      setVentaSeleccionada(ventaId);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    }
  };

  // Función para filtrar las ventas
  const filtrarVentas = () => {
    let ventasFiltradas = ventasDomicilios;

    // Filtrar por fecha
    if (fechaFiltro) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        venta.fecha_venta.startsWith(fechaFiltro)
      );
    }

    // Filtrar por ID de cliente
    if (clienteIdFiltro) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        venta.cliente_id === clienteIdFiltro
      );
    }

    setVentasDomicilios(ventasFiltradas);
  };

  const handleVerDetalles = (ventaId) => {
    // Solo obtiene los detalles si no se están mostrando ya
    if (ventaId !== ventaSeleccionada) {
      fetchDetallesVenta(ventaId);
    } else {
      // Si ya se está mostrando, restablece la selección
      setVentaSeleccionada(null);
    }
  };

  // Función para obtener el nombre del producto y su imagen a partir del id
  const getProducto = (productoId) => {
    const producto = productos.find(p => p.id_producto === productoId);
    console.log('Producto encontrado:', producto); // Debugging
    return producto || { nombre: 'Desconocido', imagen_url: '' };
  };
  return (
    <div>
      <Header4 />
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
              placeholder="YYYY-MM-DD"
              value={fechaFiltro}
              onChange={e => setFechaFiltro(e.target.value)}
            />
          </div>

          <div className="mb-3 d-flex align-items-center">
            <label htmlFor="clienteIdFiltro" className="form-label me-3">Filtrar por ID de Cliente:</label>
            <input
              type="text"
              id="clienteIdFiltro"
              className="form-control me-2"
              placeholder="ID de Cliente"
              value={clienteIdFiltro}
              onChange={e => setClienteIdFiltro(e.target.value)}
            />
          </div>

          <button type="button" className="btn btn-success mb-3" onClick={filtrarVentas}>Buscar</button>

          {/* Tabla de domicilios y ventas */}
          <table className="table table-striped mt-4">
            <thead>
              <tr>
                <th>ID Venta</th>
                <th>Fecha Venta</th>
                <th>Precio Total</th>
                <th>ID Cliente</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventasDomicilios.map((ventaDomicilio) => (
                <tr key={ventaDomicilio.id_venta}>
                  <td>{ventaDomicilio.id_venta}</td>
                  <td>{ventaDomicilio.fecha_venta}</td>
                  <td>{ventaDomicilio.precio_total}</td>
                  <td>{ventaDomicilio.cliente_id}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleVerDetalles(ventaDomicilio.id_venta)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tabla de detalles de venta */}
          {ventaSeleccionada && detallesVenta[ventaSeleccionada] && (
            <section className="container mt-5">
              <h2>Detalles de Venta</h2>
              <table className="table table-striped mt-4">
                <thead>
                  <tr>
                    <th>ID Producto</th>
                    <th>Nombre Producto</th>
                    <th>Imagen Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesVenta[ventaSeleccionada].map((detalle) => {
                    const producto = getProducto(detalle.producto_id);
                    return (
                      <tr key={detalle.producto_id}>
                        <td>{detalle.producto_id}</td>
                        <td>{producto.nombre}</td>
                        <td>
                          <img src={producto.imagen} alt={producto.nombre} style={{ width: '80px', height: '80px' }} />
                        </td>
                        <td>{detalle.cantidad_total}</td>
                        <td>{detalle.precio_unitario}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}

export default VentasDomiciliario;
