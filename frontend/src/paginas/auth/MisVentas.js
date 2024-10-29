import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../../componentes/header1';
import Footer from '../../componentes/footer';
import '../../styles/MisVentas.css';
import Swal from 'sweetalert2';

const MisVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1); 
  const userId = sessionStorage.getItem('userId');

  const ventasPorPagina = 5;

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await axios.get(`http://localhost:4001/ventasDelCliente?userId=${userId}`);
        const ventasAgrupadas = response.data.reduce((acc, curr) => {
          const { id_venta, fecha_venta, metodo_pago, precio_total, estado, id_detalle_venta, producto_id, precio_unitario, cantidad_total, subtotal, nombre_producto, imagen_producto } = curr;

          const ventaExistente = acc.find(venta => venta.id_venta === id_venta);

          if (ventaExistente) {
            ventaExistente.SaleDetails.push({
              id_detalle_venta,
              producto_id,
              precio_unitario,
              cantidad_total,
              subtotal,
              nombre_producto,
              imagen_producto,
            });
          } else {
            acc.push({
              id_venta,
              fecha_venta,
              metodo_pago,
              precio_total,
              estado,
              SaleDetails: [{
                id_detalle_venta,
                producto_id,
                precio_unitario,
                cantidad_total,
                subtotal,
                nombre_producto,
                imagen_producto,
              }]
            });
          }

          return acc;
        }, []);

        setVentas(ventasAgrupadas);
      } catch (error) {
        console.error('Error al obtener las ventas:', error);
      }
    };

    if (userId) {
      fetchVentas();
    }
  }, [userId]);


  const toggleDetallesVenta = (ventaId) => {
    if (ventaSeleccionada === ventaId) {
      setVentaSeleccionada(null);
    } else {
      setVentaSeleccionada(ventaId);
    }
  };

  const calcularSubtotal = (detalle) => {
    return detalle.precio_unitario * detalle.cantidad_total;
  };

  const indiceUltimaVenta = paginaActual * ventasPorPagina;
  const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
  const ventasPaginadas = ventas.slice(indicePrimeraVenta, indiceUltimaVenta);
  const numeroTotalPaginas = Math.ceil(ventas.length / ventasPorPagina);

  const cambiarPagina = (numeroPagina) => {
    if (numeroPagina > 0 && numeroPagina <= numeroTotalPaginas) {
      setPaginaActual(numeroPagina);
    }
  };

  return (
    <div>
      <Header />
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>

      <main className="container mt-4 flex-grow-1">
        {ventas.length > 0 ? (
          <>
            <h2 className="text-center mb-4">Mis Compras</h2>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Método de Pago</th>
                  <th>Precio Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasPaginadas.map((venta) => (
                  <React.Fragment key={venta.id_venta}>
                    <tr>
                      <td>{venta.fecha_venta}</td>
                      <td>{venta.metodo_pago}</td>
                      <td>${parseFloat(venta.precio_total).toFixed(2)}</td>
                      <td>{venta.estado}</td>
                      <td>
                        <button 
                          className="btn btn-success" 
                          onClick={() => toggleDetallesVenta(venta.id_venta)}
                        >
                          {ventaSeleccionada === venta.id_venta ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>
                      </td>
                    </tr>
                    {ventaSeleccionada === venta.id_venta && (
                      <tr>
                        <td colSpan="5">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Imagen</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {venta.SaleDetails.map((detalle) => (
                                <tr key={detalle.id_detalle_venta}>
                                  <td>{detalle.nombre_producto}</td>
                                  <td>
                                    <img 
                                      src={detalle.imagen_producto} 
                                      alt="Producto" 
                                      className="img-fluid product-img"
                                    />
                                  </td>
                                  <td>{detalle.cantidad_total}</td>
                                  <td>${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                  <td>${calcularSubtotal(detalle).toFixed(2)}</td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={2} style={{ textAlign: 'left', fontWeight: 'bold' }}>Precio Total:</td>
                                <td colSpan={2}>
                                  <strong>${parseFloat(venta.precio_total).toFixed(2)}</strong>
                                </td>
                                <td colSpan={5} style={{ textAlign: 'left' }}>
                                  
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>
                    Anterior
                  </button>
                </li>
                {Array.from({ length: numeroTotalPaginas }, (_, index) => (
                  <li key={index} className={`page-item ${paginaActual === index + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(index + 1)}>
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${paginaActual === numeroTotalPaginas ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </>
        ) : (
          <div className="text-center my-5">
            <div className="custom-alert">
              <h4 className="alert-heading">No tiene ventas registradas</h4>
              <p>Actualmente no tienes ventas en tu historial. Te invitamos a explorar nuestros productos y realizar tu primera compra.</p>
              <a href="/" className="btn btn-success">Ir a comprar</a>
            </div>
          </div>
        )}
      </main>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>

      <Footer />
    </div>
  );
};

export default MisVentas;
