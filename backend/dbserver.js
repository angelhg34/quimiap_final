const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 4001;
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();



// Configuración de express-session
app.use(session({
  secret: 'uFJG768ujfghASDGJKL!@1234asdf8976&%$#', 
  resave: false, 
  saveUninitialized: false, 
  cookie: { 
    secure: false, // HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 dia cookies de sesión
  }
}));


app.use(cors()); // Habilita CORS solicitudes frontend
app.use(express.json()); // Permite el parsing de JSON en las solicitudes

// Conectar a la base de datos
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conexión exitosa a la base de datos.');
});

//USUARIOS

// Consulta general de la tabla Usuario
app.get('/usuarios', (req, res) => {
  const query = 'SELECT * FROM Usuario';
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error al realizar la consulta:', error);
      res.status(500).json({ error: 'Error al realizar la consulta' });
    } else {
      res.json(results); // Devuelve los resultados de la consulta
    }
  });
});


// Consulta general de la tabla Usuario
app.get('/usuariosDomiciliarios', (req, res) => {
  const query = 'SELECT * FROM Usuario WHERE rol = "domiciliario"';
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error al realizar la consulta:', error);
      res.status(500).json({ error: 'Error al realizar la consulta' });
    } else {
      res.json(results); 
    }
  });
});

// Función para verificar si el usuario ya existe en la base de datos
const verificarUsuarioExistente = (correo_electronico, num_doc) => {
  return new Promise((resolve, reject) => {
      const query = 'SELECT id_usuario FROM Usuario WHERE correo_electronico = ? OR num_doc = ?';
      connection.query(query, [correo_electronico, num_doc], (err, results) => {
          if (err) {
              console.error('Error al verificar el usuario:', err);
              return reject(err);
          }
          resolve(results.length > 0); // Retorna true si el usuario existe, false si no
      });
  });
};

// Función para registrar un usuario
const registrarUsuario = (datosUsuario) => {
  return new Promise((resolve, reject) => {
      const query = 'INSERT INTO Usuario (nombres, apellidos, telefono, correo_electronico, tipo_doc, num_doc, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

      connection.query(query, datosUsuario, (err, results) => {
          if (err) {
              console.error('Error al registrar usuario:', err);
              return reject(err); 
          }
          resolve(results); 
      });
  });
};


// Endpoint para registrar usuarios
app.post('/registrarUser', async (req, res) => {
  const {
      nombres, 
      apellidos, 
      telefono, 
      correo_electronico, 
      tipo_doc, 
      num_doc, 
      contrasena, 
      rol 
  } = req.body;

  let contraseñaUsar;

  const rolesAdministrativos = ['gerente', 'domiciliario', 'jefe de produccion'];

  try {
      // Verificar si el usuario ya está registrado
      const usuarioExistente = await verificarUsuarioExistente(correo_electronico, num_doc);
      if (usuarioExistente) {
          return res.status(400).json({ success: false, message: 'El usuario ya está registrado.' });
      }

      // Generar o asignar la contraseña
      if (rolesAdministrativos.includes(rol.toLowerCase())) {
          contraseñaUsar = generarContraseña(12); // Generar contraseña aleatoria para roles administrativos
      } else if (rol.toLowerCase() === 'cliente') {
          // Usar la contraseña proporcionada por el cliente
          if (!contrasena) {
              return res.status(400).json({ success: false, message: 'La contraseña es requerida para clientes.' });
          }
          console.log("Contraseña proporcionada por el cliente:", contrasena);
          contraseñaUsar = contrasena;

      } else {
          return res.status(400).json({ success: false, message: 'Rol no reconocido.' });
      }

      // Hashear la contraseña antes de guardarla
      const hashedPassword = bcrypt.hashSync(contraseñaUsar, 10);
      console.log("Hashed password:", hashedPassword);

      // Preparar los datos para el procedimiento almacenado
      const datosUsuario = [nombres, apellidos, telefono, correo_electronico, tipo_doc, num_doc, hashedPassword, rol];

      // Registrar el usuario en la base de datos
      const results = await registrarUsuario(datosUsuario);
      const userId = results.insertId;

      // Si es un rol administrativo, enviar la contraseña por correo
      if (rolesAdministrativos.includes(rol.toLowerCase())) {
          try {
              await axios.post('http://localhost:5000/enviar_contrasena', {
                  correo_electronico,
                  id: userId,
                  contrasena: contraseñaUsar
              });
              console.log('Correo de verificación enviado con éxito.');
          } catch (error) {
              console.error('Error al enviar el correo de verificación:', error);
              // Eliminar al usuario si ocurre un error al enviar el correo
              await eliminarUsuario(userId);
              return res.status(500).json({ success: false, message: 'Error al enviar el correo de verificación.' });
          }
      }

      return res.json({ success: true, id_usuario: userId, results });
  } catch (err) {
      console.error('Error al registrar el usuario:', err);
      return res.status(500).json({ success: false, error: err });
  }
});

// endpoint para actualizar usuarios
app.put('/actualizarUser/:id_usuario', (req, res) => {
  const {
      id_usuario,            // ID del usuario a actualizar
      nombres, 
      apellidos, 
      telefono, 
      correo_electronico, 
      tipo_doc, 
      num_doc, 
      contrasena, 
      estado, 
      rol 
  } = req.body;

  const query = `CALL ActualizarUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, 
    [id_usuario, nombres, apellidos, telefono, correo_electronico, tipo_doc, num_doc, contrasena, estado, rol], 
    (err, results) => {
      if (err) {
          console.error('Error ejecutando la consulta:', err);
          return res.status(500).json({ success: false, error: err });
      }
      res.json({ success: true, results });
  });
});

// Endpoint para cambiar estado al usuario
app.put('/cambiarEstadoUsuario/:id_usuario', (req, res) => {
const { estado } = req.body; 
const id_usuario = req.params.id_usuario; 

const query = `CALL CambiarEstadoUsuario(?, ?)`;

connection.query(query, [id_usuario, estado], (err, results) => {
    if (err) {
        console.error('Error ejecutando la consulta:', err);
        return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, results });
});
});

// endpoint para iniciar sesion
app.post('/login', (req, res) => {
  const { correo_electronico, contrasena } = req.body;
  
  console.log('Correo electrónico recibido:', correo_electronico);
  console.log('Contraseña recibida:', contrasena);

  // Verifica que los campos no estén vacíos
  if (!correo_electronico || !contrasena) {
      return res.status(400).json({ success: false, message: 'Por favor, complete todos los campos requeridos.' });
  }

  // Consulta para encontrar el usuario
  const query = 'SELECT * FROM Usuario WHERE correo_electronico = ?';
  connection.query(query, [correo_electronico], (err, results) => {
      if (err) {
          console.error('Error al ejecutar la consulta:', err);
          return res.status(500).json({ success: false, message: 'Error en el servidor.' });
      }

      // Verifica si el usuario existe
      if (results.length === 0) {
          console.log('No se encontró el usuario con el correo proporcionado.');
          return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
      }

      const user = results[0];
      console.log('Usuario encontrado:', user);

      // Verificar el estado de la cuenta
      if (user.estado !== 'activo') {
          console.log('Estado de la cuenta:', user.estado);
          return res.status(403).json({ success: false, message: 'Cuenta inactiva o pendiente.' });
      }

      // Verifica la contraseña
      bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
          if (err) {
              console.error('Error al comparar contraseñas:', err);
              return res.status(500).json({ success: false, message: 'Error en el servidor.' });
          }

          if (!isMatch) {
              console.log('La contraseña no coincide.');
              return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
          }

          // Almacena la información del usuario en la sesión
          req.session.user = {
              id_usuario: user.id_usuario,
              nombres: user.nombres,
              apellidos: user.apellidos,
              rol: user.rol,
              estado: user.estado
          };

          // Devuelve la respuesta con los datos del usuario
          res.json({
              success: true,
              message: 'Inicio de sesión exitoso.',
              user: {
                  id_usuario: user.id_usuario,
                  nombres: user.nombres,
                  apellidos: user.apellidos,
                  rol: user.rol,
                  estado:user.estado
              }
          });
      });
  });
});

// Función para generar una contraseña aleatoria
function generarContraseña(length) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let contraseña = '';
  for (let i = 0; i < length; i++) {
      contraseña += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return contraseña;
}

// funcion para verificar el numero de documento existente
const verificarUsuarioExistentePorDocumento = (num_doc) => {
  return new Promise((resolve, reject) => {
      const query = 'SELECT id_usuario FROM Usuario WHERE num_doc = ?';
      connection.query(query, [num_doc], (err, results) => {
          if (err) {
              console.error('Error al verificar el usuario:', err);
              return reject(err);
          }
          resolve(results.length > 0); // Retorna true si el usuario existe, false si no
      });
  });
};

// TRAER USUARIOS POR ID
app.get('/usuarios/porid/:id_usuario', (req, res) => {
  const id_usuario = req.params.id_usuario; // Obtener el ID del usuario desde la URL

  const query = `SELECT * FROM Usuario WHERE id_usuario = ?`;

  connection.query(query, [id_usuario], (error, results) => {
    if (error) {
      console.error('Error ejecutando la consulta:', error);
      return res.status(500).json({ success: false, error: error });
    }

    // Verificar si se encontró el usuario
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json(results); // Devolver el primer resultado
  });
});

// Endpoint para verificar si el número de documento ya está registrado
app.get('/usuarios/documento/:num_doc', async (req, res) => {
  const { num_doc } = req.params;
  try {
      const usuario = await verificarUsuarioExistentePorDocumento(num_doc); // Implementa esta función en tu modelo
      if (usuario) {
          return res.json([usuario]); // Retorna un arreglo con el usuario si existe
      }
      return res.json([]); // Retorna un arreglo vacío si no existe
  } catch (error) {
      console.error('Error checking document number:', error);
      return res.status(500).json({ message: 'Error al verificar el número de documento.' });
  }
});

// Ruta para buscar usuario por correo electrónico
app.get('/usuarios/correo/:correo_electronico', (req, res) => {
  const correoElectronico = req.params.correo_electronico;

  const query = 'SELECT * FROM Usuario WHERE correo_electronico = ?';
  
  connection.query(query, [correoElectronico], (error, results) => {
      if (error) {
          console.error('Error al realizar la consulta:', error);
          return res.status(500).json({ error: 'Error al realizar la consulta' });
      }
      res.json(results); // Devuelve los resultados de la consulta
  });
});


// Consulta de stock de la tabla Producto
app.get('/productoStock/:id_producto', (req, res) => {
  const { id_producto } = req.params; // Obtener el id del producto desde los parámetros de la URL
  const query = 'SELECT cantidad_producto FROM Producto WHERE id_producto = ?'; // Cambiar a id en lugar de cantidad_producto
  
  connection.query(query, [id_producto], (error, results) => {
    if (error) {
      console.error('Error al realizar la consulta:', error);
      res.status(500).json({ error: 'Error al realizar la consulta' });
    } else {
      // Si hay resultados, devolver la cantidad, si no devolver stock 0
      const stock = results.length > 0 ? results[0].cantidad_producto : 0;
      res.json({ cantidad: stock });
    }
  });
});

//TRAER USUARIOS POR ID
app.get('/usuario/:id_usuario', (req, res) => {
  const id_usuario = req.params.id_usuario; // Obtener el ID del usuario desde la URL

  const query = `SELECT * FROM Usuario WHERE id_usuario = ?`;

  connection.query(query, [id_usuario], (err, results) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err);
      return res.status(500).json({ success: false, error: err });
    }

    // Verificar si se encontró el usuario
    if (results.length === 0) { // Cambiado a `results.length` para verificar si se encontró al menos un usuario
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, usuario: results[0] }); // Devolver el primer resultado sin `results[0][0]`
  });
});

// PRODUCTOS
// Consulta general de la tabla Categoria
app.get('/categoria', (req, res) => {
  const query = 'SELECT * FROM Categoria';
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error al realizar la consulta:', error);
      res.status(500).json({ error: 'Error al realizar la consulta' });
    } else {
      res.json(results); // Devuelve los resultados de la consulta
    }
  });
});

// Consulta general de la tabla Producto
app.get('/Producto', (req, res) => {

  const query = `
      SELECT 
          p.id_producto,
          p.nombre,
          p.descripcion,
          p.composicion,
          p.contenido_neto,
          p.usos,
          p.advertencias,
          p.cantidad_producto,
          p.precio_unitario,
          p.estado,
          c.nombre_categoria AS categoria,
          p.imagen
      FROM 
          Producto p
      JOIN 
          Categoria c ON p.categoria_id = c.id_categoria;
  `;

  connection.query(query, (error, results) => {
      if (error) {
          console.error('Error al realizar la consulta:', error);
          res.status(500).json({ error: 'Error al realizar la consulta' });
      } else {
          res.json(results); // Devuelve los resultados de la consulta
      }
  });
});

// Registrar un nuevo producto
app.post('/registrarProducto', (req, res) => {
  const {
      nombre, 
      descripcion, 
      imagen, 
      categoria_id, // Cambié a categoria_id para que coincida con la estructura de la tabla
      composicion, 
      contenido_neto, 
      usos, 
      advertencias, 
      cantidad_producto, 
      precio_unitario, 
      estado 
  } = req.body;

  const query = `CALL RegistrarProducto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, 
    [nombre, descripcion, imagen, categoria_id, composicion, contenido_neto, usos, advertencias, cantidad_producto, precio_unitario, estado], 
    (err, results) => {
      if (err) {
          console.error('Error ejecutando la consulta:', err);
          return res.status(500).json({ success: false, error: err });
      }
      res.json({ success: true, results });
  });
});

// Actualizar un producto
app.put('/actualizarProducto', (req, res) => {
  const {
      id_producto, 
      nombre, 
      descripcion, 
      imagen, 
      categoria_id, 
      composicion, 
      contenido_neto, 
      usos, 
      advertencias, 
      cantidad_producto, 
      precio_unitario, 
      estado 
  } = req.body;

  const query = `CALL ActualizarProducto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, 
    [id_producto, nombre, descripcion, imagen, categoria_id, composicion, contenido_neto, usos, advertencias, cantidad_producto, precio_unitario, estado], 
    (err, results) => {
      if (err) {
          console.error('Error ejecutando la consulta:', err);
          return res.status(500).json({ success: false, error: err });
      }
      res.json({ success: true, results });
  });
});

// Cambiar estado de un producto
app.put('/descontinuarProducto/:id_producto', (req, res) => {
  const { estado } = req.body; 
  const id_producto = req.params.id_producto; // Usar req.params

  const query = `CALL CambiarEstadoProducto(?, ?)`;

  connection.query(query, [id_producto, estado], (err, results) => {
      if (err) {
          console.error('Error ejecutando la consulta:', err);
          return res.status(500).json({ success: false, error: err });
      }

      // Verificar si se actualizaron filas
      if (results.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Producto no encontrado o no actualizado' });
      }

      res.json({ success: true, results });
  });
});


// REGISTRAR VENTAS
app.post('/registrarVenta', (req, res) => {
  const { metodo_pago, precio_total, cliente_id, carrito } = req.body;

  // Obtener el correo electrónico del cliente
  const queryCorreo = `SELECT correo_electronico FROM Usuario WHERE id_usuario = ?`;
  connection.query(queryCorreo, [cliente_id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error al obtener el correo electrónico del cliente:', err);
      return res.status(500).json({ success: false, error: 'Error obteniendo el correo electrónico' });
    }

    const correo_electronico = results[0].correo_electronico;

    const queryVenta = `CALL registrar_venta(?, ?, ?, ?)`;
    connection.query(queryVenta, [metodo_pago, precio_total, correo_electronico, cliente_id], (err, results) => {
      if (err) {
        console.error('Error registrando la venta:', err);
        return res.status(500).json({ success: false, error: err });
      }

      const id_venta = results[0][0].id_venta;

      const queryDetalles = `CALL registrar_detalles_venta(?, ?, ?, ?, ?)`;
      const detallesPromises = carrito.map(producto => {
        const detalle = {
          producto_id: producto.id_producto,
          precio_unitario: producto.precio_unitario,
          cantidad_total: producto.cantidad,
          subtotal: producto.precio_unitario * producto.cantidad,
        };
        return new Promise((resolve, reject) => {
          connection.query(queryDetalles, [id_venta, detalle.producto_id, detalle.precio_unitario, detalle.cantidad_total, detalle.subtotal], (err, results) => {
            if (err) {
              console.error('Error registrando los detalles de la venta:', err);
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      });

      Promise.all(detallesPromises)
        .then(() => res.json({ success: true, id_venta }))
        .catch(err => res.status(500).json({ success: false, error: err }));
    });
  });
});

// Endpoint para verificar el stock de un producto
app.get('/verificarStock/:id_producto', (req, res) => {
  const { id_producto } = req.params;

  // Consulta para obtener la cantidad de stock actual del producto
  const query = 'SELECT cantidad_producto, estado FROM Producto WHERE id_producto = ?';

  connection.query(query, [id_producto], (err, results) => {
    if (err) {
      console.error('Error al consultar el stock:', err);
      return res.status(500).json({ error: 'Error al consultar el stock' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { cantidad_producto, estado } = results[0];

    // Verificar si el stock está por debajo de un umbral mínimo
    const umbralMinimo = 2; // Define el umbral mínimo que deseas
    const stockData = {
      cantidad_producto,
      estado,
      alerta_baja_stock: cantidad_producto < umbralMinimo,
    };

    // Enviar una alerta en caso de baja de stock
    if (stockData.alerta_baja_stock) {
      console.warn(`Alerta: el producto con ID ${id_producto} tiene bajo stock.`);
      
      // Lógica para enviar una alerta al jefe de producción usando el endpoint
      axios.post('http://localhost:5000/enviar-alerta-baja-stock', {
        id_producto: id_producto,
        cantidad_actual: cantidad_producto,
        mensaje: `El producto con ID ${id_producto} tiene bajo stock. Cantidad actual: ${cantidad_producto}.`
      })
      .then(() => {
        console.log('Correo de alerta de bajo stock enviado al jefe de producción.');
      })
      .catch(correoErr => {
        console.error('Error al enviar el correo de alerta:', correoErr);
      });
    }

    res.json(stockData);
  });
});


// REGISTRAR DOMICILIO
app.post('/registrarDomicilio', (req, res) => {
  const { direccion, ciudad, codigo_postal, fecha_entrega, estado_entrega, domiciliario_id, venta_id } = req.body;

  const query = `CALL registrar_domicilio(?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, [direccion, ciudad, codigo_postal, fecha_entrega, estado_entrega, domiciliario_id, venta_id], (err, results) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err);
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, results });
  });
});

app.get('/ventasDelCliente', (req, res) => {
  const userId = req.query.userId; 

  const query = `
    SELECT 
      v.id_venta,
      v.fecha_venta,
      v.metodo_pago,
      v.precio_total,
      v.estado,
      dv.id_detalle_venta,
      dv.producto_id,
      dv.precio_unitario,
      dv.cantidad_total,
      dv.subtotal,
      p.nombre AS nombre_producto,
      p.imagen AS imagen_producto
    FROM 
      Venta v
    JOIN 
      Detalles_Venta dv ON v.id_venta = dv.venta_id
    JOIN 
      Producto p ON dv.producto_id = p.id_producto
    WHERE 
      v.cliente_id = ?;`;

  connection.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error en la consulta', error });
    }
    res.json(results);
  });
});

// Endpoint para obtener ventas con información de usuarios
app.get('/ventasUsuariosAdmin', async (req, res) => {
  const userId = req.query.userId; 

  const query = `
    SELECT v.id_venta, v.fecha_venta, v.metodo_pago, v.precio_total, v.estado, u.num_doc, u.nombres, u.apellidos
    FROM Venta v
    JOIN Usuario u ON v.cliente_id = u.id_usuario
  `;

  connection.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error en la consulta', error });
    }
    res.json(results);
  });
});

// Endpoint para obtener domicilios con información de ventas y usuarios
app.get('/domiciliosVentasUsuarios', async (req, res) => {

  const userId = req.query.userId; 

  const query = `
    SELECT d.id_domicilio, d.direccion, d.ciudad, d.fecha_entrega, d.estado_entrega, 
           v.id_venta, v.precio_total, 
           u.nombres, u.apellidos, u.num_doc
    FROM Domicilio d
    JOIN Venta v ON d.venta_id = v.id_venta
    JOIN Usuario u ON v.cliente_id = u.id_usuario
  `;
  connection.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error en la consulta', error });
    }
    res.json(results);
  });
});


  // Endpoint para obtener domicilios con información de ventas y usuarios
app.get('/domiciliosDomiciliario/:id_usuario', async (req, res) => {

  const userId = req.query.userId; 

  const query = `
    SELECT d.id_domicilio, d.direccion, d.ciudad, d.fecha_entrega, d.estado_entrega, 
           v.id_venta, v.precio_total, 
           u.nombres, u.apellidos, u.num_doc
    FROM Domicilio d
    JOIN Venta v ON d.venta_id = v.id_venta
    JOIN Usuario u ON v.cliente_id = u.id_usuario
    WHERE d.domiciliario_id = ?
  `;

  connection.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error en la consulta', error });
    }
    res.json(results);
  });
});





// Endpoint para actualizar el estado de un domicilio
app.put('/domicilio/:id_domicilio', (req, res) => {
  const { id_domicilio } = req.params;
  const { estado_entrega } = req.body;

  const query = `UPDATE Domicilio SET estado_entrega = ? WHERE id_domicilio = ?`;

  connection.query(query, [estado_entrega, id_domicilio], (error, results) => {
    if (error) {
      console.error('Error actualizando el estado del domicilio:', error);
      return res.status(500).json({ message: 'Error actualizando el estado del domicilio', error });
    }

    // Verifica si se actualizó algún registro
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Domicilio no encontrado' });
    }

    res.status(200).json({ message: 'Domicilio actualizado correctamente' });
  });
});

// Endpoint para obtener domicilios y ventas del domiciliario en sesión
app.get('/domicilios-con-ventas', (req, res) => {
  const domiciliarioId = req.query.domiciliario_id;
  const query = `
    SELECT d.*, v.*
    FROM Domicilio d
    JOIN Venta v ON d.venta_id = v.id_venta
    WHERE d.domiciliario_id = ?;
  `;

  connection.query(query, [domiciliarioId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error en la consulta', error });
    }
    res.json(results);
  });
});

app.get('/SaleDetails', async (req, res) => {
  const { venta_id } = req.query;
  const query = `
  SELECT * FROM Detalles_Venta WHERE venta_id = ?
  `;
  connection.query(query, [venta_id], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error en la consulta', error });
    }
    res.json(results);
  });
});




app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
