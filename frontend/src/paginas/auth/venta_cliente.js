import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/style_venta_cliente.css';
import Header from "../../componentes/header1";
import Footer from "../../componentes/footer";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const VentasCliente = () => {
  const [fechaVenta] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [domicilio, setDomicilio] = useState({
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    fecha_entrega: ''
  });
  const [mostrarDomicilio, setMostrarDomicilio] = useState(false);

  const navigate = useNavigate();
  const clienteId = sessionStorage.getItem('userId');
  const carritoItems = JSON.parse(localStorage.getItem('carrito')) || [];

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await axios.get(`http://localhost:4001/usuario/${clienteId}`);
        setCliente(response.data);
      } catch (error) {
        console.error('Error al obtener datos del cliente:', error);
      }
    };

    const fetchCarrito = () => {
      setCarrito(carritoItems);
    };

    fetchCliente();
    fetchCarrito();
  }, [clienteId, carritoItems]);

  const actualizarCantidadProducto = async (id_producto, cantidadComprada) => {
    try {
      const response = await axios.get(`http://localhost:4001/Producto/${id_producto}`);
      const productoActual = response.data;
      
      const nuevaCantidad = productoActual.cantidad_producto - cantidadComprada; // Cambiado a cantidad_producto
      const estadoProducto = nuevaCantidad <= 0 ? 'agotado' : productoActual.estado;


      await axios.put(`http://localhost:4001/Producto/${id_producto}`, {
        ...productoActual,
        cantidad_producto: nuevaCantidad,
        estado: estadoProducto
      });
    } catch (error) {
      console.error('Error al actualizar la cantidad del producto:', error);
    }
};


  const asignarDomiciliario = async () => {
    try {
      const response = await axios.get('http://localhost:4001/usuariosDomiciliarios');
      const usuarios = response.data;
  
      // Filtramos los domiciliarios
      const domiciliariosDisponibles = usuarios.filter(user => user.rol === 'domiciliario');
  
      console.log('Domiciliarios disponibles:', domiciliariosDisponibles);
  
      if (domiciliariosDisponibles.length === 0) {
        throw new Error('No hay domiciliarios disponibles');
      }
  
      // Selección aleatoria de un domiciliario disponible
      const randomIndex = Math.floor(Math.random() * domiciliariosDisponibles.length);
      return domiciliariosDisponibles[randomIndex].id_usuario; // Cambia a id_usuario
    } catch (error) {
      console.error('Error al asignar domiciliario:', error);
      return null; // Retorna null en caso de error
    }
  }


  const handleSubmit = async (e) => {
    console.log('handleSubmit fue llamado'); // Agrega esto
    e.preventDefault();
  
    const ventaData = {
      metodo_pago: metodoPago,
      precio_total: precioTotal,
      cliente_id: clienteId,
      carrito: carrito, 
    };
    
    console.log('Datos de venta a enviar:', ventaData); // Verifica los datos de la venta
  
    try {
      const domiciliarioId = mostrarDomicilio ? await asignarDomiciliario() : null;
      console.log('ID de domiciliario asignado:', domiciliarioId); // Verifica el ID asignado
      
      if (mostrarDomicilio && !domiciliarioId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo asignar un domiciliario.',
        });
        return;
      }
  
      // Envía la información de la venta junto con los detalles
      const ventaResponse = await axios.post('http://localhost:4001/registrarVenta', ventaData);
      const ventaId = ventaResponse.data.id_venta; // Asegúrate de que esto coincida con tu respuesta
      console.log('Venta registrada con ID:', ventaId); // Verifica el ID de la venta registrada

      // Enviar el correo con los detalles de la venta al cliente
      const detalleVentaResponse = await axios.post('http://localhost:5000/enviar-detalle-venta', {
        venta_id: ventaId,
      });
      console.log('Correo de verificación enviado:', detalleVentaResponse.data);

      // Verificar el stock y enviar alerta si es necesario
      for (const producto of carrito) {
        try {
          const stockResponse = await axios.get(`http://localhost:4001/verificarStock/${producto.id_producto}`);
          const stockData = stockResponse.data;

          if (stockData.cantidad_actual < stockData.cantidad_minima) {
            console.warn(`Stock bajo para el producto ${producto.id_producto}.`);

            // Envía alerta de baja de stock
            await axios.post('http://localhost:5000/enviar-alerta-baja-stock', {
              id_producto: producto.id_producto,
              cantidad_actual: stockData.cantidad_actual,
            });
            console.log('Alerta de baja de stock enviada.');
          }
        } catch (error) {
          console.error(`Error al verificar el stock para el producto ${producto.id_producto}:`, error);
        }
      }

      if (mostrarDomicilio) {
        const domicilioData = {
          venta_id: ventaId,
          direccion: domicilio.direccion,
          ciudad: domicilio.ciudad,
          codigo_postal: domicilio.codigo_postal,
          fecha_entrega: domicilio.fecha_entrega,
          estado_entrega: 'pendiente', // Asegúrate de incluir esto
          domiciliario_id: domiciliarioId,
        };
  
        console.log('Datos de domicilio a enviar:', domicilioData); // Agrega esta línea
  
        await axios.post('http://localhost:4001/registrarDomicilio', domicilioData);
      }
  
      Swal.fire({
        icon: 'success',
        title: 'Venta registrada con éxito',
        text: 'La venta ha sido registrada correctamente.',
        timer: 1000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/MisVentas.js');
        setMetodoPago('');
        setPrecioTotal('');
        setCarrito([]);
        setDomicilio({
          direccion: '',
          ciudad: '',
          codigo_postal: '',
          fecha_entrega: '',
        });
        setMostrarDomicilio(false);
        localStorage.removeItem('carrito');
        localStorage.removeItem('clienteId');
      });
    } catch (error) {
      console.error('Error al registrar la venta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al registrar la venta. Inténtelo de nuevo.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
};

  
  const calcularTotal = () => {
    return carrito.reduce((total, producto) => total + (producto.precio_unitario * producto.cantidad), 0);
  };

  useEffect(() => {
    setPrecioTotal(calcularTotal());
  }, [carrito]);


  const handleFechaEntregaChange = (e) => {
    const fechaSeleccionada = new Date(e.target.value);
    const fechaActual = new Date();

    if (fechaSeleccionada >= fechaActual) {
      setDomicilio({ ...domicilio, fecha_entrega: e.target.value });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha Inválida',
        text: 'La fecha de entrega no puede ser anterior a la fecha actual.',
      });
      setDomicilio({ ...domicilio, fecha_entrega: '' });
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
      <div className="container mt-5">
        <h2 className="mb-4">Registro de Venta</h2>

        <div className="row">
          {/* Columna de Productos */}
          <div className="col-md-6">
            <h4>Carrito de Compras</h4>
            {carrito.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((producto) => (
                    <tr key={producto.id_producto}>
                      <td>{producto.nombre}</td>
                      <td>${producto.precio_unitario}</td>
                      <td>{producto.cantidad}</td>
                      <td>${producto.precio_unitario * producto.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total:</strong></td>
                    <td>${precioTotal}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p>El carrito está vacío.</p>
            )}
          </div>

          {/* Columna del Formulario de Venta */}
          <div className="col-md-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="fechaVenta" className="form-label">Fecha de Venta</label>
                <input
                  type="date"
                  className="form-control"
                  id="fechaVenta"
                  value={fechaVenta}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label htmlFor="metodoPago" className="form-label">Método de Pago</label>
                <select
                  className="form-control"
                  id="metodoPago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  required
                >
                  <option value="" disabled selected>Selecciona un método de pago</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="precioTotal" className="form-label">Precio Total</label>
                <input
                  type="number"
                  className="form-control"
                  id="precioTotal"
                  value={precioTotal}
                  readOnly
                />
              </div>
              <div className="mb-3">
                <label htmlFor="domicilio" className="form-label">
                  <input
                    type="checkbox"
                    id="domicilio"
                    checked={mostrarDomicilio}
                    onChange={(e) => setMostrarDomicilio(e.target.checked)}
                  />
                  Dirección de Domicilio
                </label>
              </div>

              {mostrarDomicilio && (
                <div>
                  <div className="mb-3">
                    <label htmlFor="direccion" className="form-label">Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      id="direccion"
                      value={domicilio.direccion}
                      maxLength={30}
                      onChange={(e) => setDomicilio({ ...domicilio, direccion: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="ciudad" className="form-label">Ciudad</label>
                    <input
                      type="text"
                      className="form-control"
                      id="ciudad"
                      maxLength={30}
                      value={domicilio.ciudad}
                      onChange={(e) => setDomicilio({ ...domicilio, ciudad: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                        <label htmlFor="codigoPostal" className="form-label">Código Postal</label>
                        <input
                            type="number"
                            className="form-control"
                            id="codigoPostal"
                            value={domicilio.codigo_postal}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 6) {
                                    setDomicilio({ ...domicilio, codigo_postal: value });
                                }
                            }}
                            min="100000" // Asegúrate de que el código postal sea un número válido (ajusta según tu país)
                            max="999999" // Limitar a 6 dígitos
                            required
                        />
                    </div>

                  <div className="mb-3">
                    <label htmlFor="fechaEntrega" className="form-label">Fecha de Entrega</label>
                    <input
                      type="date"
                      className="form-control"
                      id="fechaEntrega"
                      value={domicilio.fecha_entrega}
                      onChange={handleFechaEntregaChange}
                      required
                    />
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-success float-end">Confirmar Venta</button>            
              </form>
              <br/>
              <br/>
              <br/>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VentasCliente;