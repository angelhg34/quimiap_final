// Requiriendo los módulos necesarios
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); 
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const crypto = require('crypto');
// Asegúrate de incluir esto
// Creando una nueva aplicación Express.
const app = express();

// Configuración de middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Establecer EJS como el Motor de plantillas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Conectar a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root',
    database: 'quimiap'
  });
  
  connection.connect((err) => {
    if (err) {
      console.error('Error conectando a la base de datos:', err.stack);
      return;
    }
    console.log('Conexión exitosa a la base de datos.');
  });
// Configuración de CORS para permitir solicitudes desde el puerto 4000
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4001'], // Puedes restringir esto a 'http://localhost:4000' si prefieres, o para todos:'*'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Definiendo la ruta Home
app.get("/", (req, res) => {
    res.render("bienvenida");
});

// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "files_emails")); // Ruta donde se guardarán los archivos adjuntos
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

// Configuración del servicio de correo electrónico
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "quimiap.1999.quimicos@gmail.com",
        pass: "earklpwhyjllbkff", // Asegúrate de usar una contraseña de aplicación si usas Gmail
    },
});

// Ruta para procesar el registro de usuario
app.post("/usuarios", (req, res) => {
    const userData = req.body; // Datos del usuario desde el formulario
    // Aquí puedes agregar la lógica para guardar `userData` en la base de datos

    res.status(201).send("Usuario registrado con éxito");
});

// Ruta para enviar correo de verificación para clientes
app.post("/enviar-verificacion", (req, res) => {
    const { correo_electronico, id} = req.body;
    console.log(`Enviando verificación a ID de usuario: ${id}`);

    // Generar el enlace de verificación
    const verificationLink = `http://localhost:5000/verificar-correo/${id}`;
    
    const verificationMailOptions = {
        from: "quimiap.1999.quimicos@gmail.com",
        to: correo_electronico,
        subject: "Verificación de correo",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                <!-- Logo de la empresa -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="../public/img/Logo.png" alt="Logo Quimiap" style="max-width: 150px;">
                </div>
                
                <!-- Mensaje principal -->
                <h2 style="color: #28a745; text-align: center;">¡Gracias por registrarte en Quimiap!</h2>
                <p style="color: #555; font-size: 16px; text-align: center;">Por favor verifica tu correo haciendo clic en el botón de abajo:</p>
                
                <!-- Botón de verificación -->
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; font-size: 18px; color: #fff; background-color: #28a745; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">Verificar correo</a>
                </div>
                
                <!-- Enlace alternativo -->
                <p style="color: #777; font-size: 14px; text-align: center;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; text-align: center; background-color: #f1f1f1; padding: 10px; border-radius: 5px; color: #007bff;">${verificationLink}</p>
                
                <!-- Pie de página -->
                <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">© 2024 Quimiap. Todos los derechos reservados.</p>
            </div>
        `,
    };

    transporter.sendMail(verificationMailOptions, (error, info) => {
        if (error) {
            console.log("Error al enviar el correo de verificación:", error);
            return res.status(500).send("Error al enviar el correo de verificación");
        } else {
            console.log("Correo de verificación enviado:", info.response);
            return res.status(200).send("Correo de verificación enviado");
        }
    });
});

// Ruta que hace una solicitud a la bd en el puerto 4001
app.get("/usuarios", async (req, res) => {
    try {
        // Haciendo una solicitud GET al puerto 4000
        const response = await axios.get('http://localhost:4001/usuarios');
        res.status(200).json(response.data); // Enviar los datos obtenidos al cliente
    } catch (error) {
        console.error('Error al hacer la solicitud a la bd del puerto 4001:', error);
        res.status(500).send('Error al obtener los datos de la BD');
    }
});
//verificacion-correo
// Nueva ruta para verificar el correo del usuario
app.get("/verificar-correo/:id", (req, res) => {
    const userId = parseInt(req.params.id, 10); // Convertir a entero
    // Verifica si userId se obtuvo correctamente
    if (isNaN(userId)) {
        console.error('ID de usuario no válido:', req.params.id);
        return res.status(400).send("ID de usuario no válido.");
    }

    // Consulta SQL para actualizar el estado del usuario
    const query = 'UPDATE Usuario SET estado = ? WHERE id_usuario = ?';
    const newState = 'activo';

    connection.query(query, [newState, userId], (error, results) => {
        if (error) {
            console.error('Error al actualizar el estado del usuario:', error);
            return res.status(500).send("Error al actualizar el estado del usuario.");
        }

        // Verifica si se actualizó algún registro
        if (results.affectedRows === 0) {
            return res.status(404).send("Usuario no encontrado.");
        }

        // Respuesta HTML de éxito
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Correo Verificado</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f0f9ff;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .container {
                        background-color: #fff;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    h1 {
                        color: #28a745;
                        font-size: 36px;
                        margin-bottom: 10px;
                    }
                    p {
                        font-size: 18px;
                        color: #555;
                        margin-bottom: 30px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        font-size: 18px;
                        color: #fff;
                        background-color: #007bff;
                        border-radius: 6px;
                        text-decoration: none;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        transition: background-color 0.3s ease;
                    }
                    .button:hover {
                        background-color: #0056b3;
                    }
                    img {
                        max-width: 150px;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="http://localhost:3000/img/LOGO_JEFE_DE_PRODUCCIÓN-Photoroom.png" alt="Logo Quimiap">
                    <h1>¡Correo Verificado!</h1>
                    <p>Gracias por verificar tu correo electrónico. Ahora tu cuenta está activa.</p>
                    <a href="http://localhost:3000/inicio_registro.js" class="button">Ir al Inicio</a>
                </div>  
            </body>
            </html>
        `);
    });
});
// Endpoint para enviar la contraseña y verificación por correo
app.post("/enviar_contrasena", (req, res) => {
    const { correo_electronico, id, contrasena } = req.body; // Obtener los parámetros del cuerpo de la solicitud

    console.log('Parámetros recibidos:', req.body); // Verifica los parámetros recibidos

    // Verifica que el correo y la contraseña estén presentes
    if (!correo_electronico || !contrasena) {
        console.error('Correo electrónico o contraseña faltantes.');
        return res.status(400).json({ success: false, message: "Correo electrónico o contraseña faltantes." });
    }

    // Crear el enlace de verificación
    const verificationLink = `http://localhost:5000/verificar-y-activar/${id}?correo_electronico=${encodeURIComponent(correo_electronico)}&contrasena=${encodeURIComponent(contrasena)}`;

    const verificationMailOptions = {
        from: "quimiap.1999.quimicos@gmail.com",
        to: correo_electronico,
        subject: "Verificación de correo y contraseña",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #28a745; text-align: center;">¡Gracias por registrarte en Quimiap!</h2>
                <p style="color: #555; font-size: 16px; text-align: center;">Por favor verifica tu correo haciendo clic en el botón de abajo:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; font-size: 18px; color: #fff; background-color: #28a745; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">Verificar correo</a>
                </div>
                <p style="color: #555; font-size: 16px; text-align: center;">Tu contraseña es: <strong>${contrasena}</strong></p>
                <p style="color: #777; font-size: 14px; text-align: center;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; text-align: center; background-color: #f1f1f1; padding: 10px; border-radius: 5px; color: #007bff;">${verificationLink}</p>
                <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">© 2024 Quimiap. Todos los derechos reservados.</p>
            </div>
        `,
    };

    // Enviar el correo de verificación
    transporter.sendMail(verificationMailOptions, (error, info) => {
        if (error) {
            console.log("Error al enviar el correo de verificación:", error);
            return res.status(500).json({ success: false, message: "Error al enviar el correo de verificación", error });
        } else {
            console.log("Correo de verificación enviado:", info.response);
            return res.json({ success: true, message: "Correo de verificación enviado." });
        }
    });
});
app.get("/verificar-y-activar/:id", (req, res) => {
    const userId = parseInt(req.params.id, 10); // Obtener el ID de la URL
    const { correo_electronico, contrasena } = req.query; // Obtener los parámetros de la consulta

    // Verifica si userId se obtuvo correctamente
    if (isNaN(userId)) {
        console.error('ID de usuario no válido:', req.params.id);
        return res.status(400).send("ID de usuario no válido.");
    }

    // Verifica que el correo y la contraseña estén presentes
    if (!correo_electronico || !contrasena) {
        console.error('Correo electrónico o contraseña faltantes.');
        return res.status(400).send("Correo electrónico o contraseña faltantes.");
    }

    // Actualiza el estado del usuario a 'activo'
    const query = 'UPDATE Usuario SET estado = ? WHERE id_usuario = ?';
    const newState = 'activo';

    connection.query(query, [newState, userId], (error, results) => {
        if (error) {
            console.error('Error al actualizar el estado del usuario:', error);
            return res.status(500).send("Error al actualizar el estado del usuario.");
        }

        // Verifica si se actualizó algún registro
        if (results.affectedRows === 0) {
            return res.status(404).send("Usuario no encontrado.");
        }

        // Redirigir al usuario a la página de inicio
        res.redirect('http://localhost:3000/inicio_registro.js');
    });
});


// Genera un token único y seguro
function generarToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Ruta para enviar el correo de restablecimiento de contraseña
app.post("/enviar-restablecer-contrasena", (req, res) => {
    const { correo_electronico } = req.body;

    // Verificar si el correo existe en la base de datos
    const query = 'SELECT * FROM Usuario WHERE correo_electronico = ?';
    
    connection.query(query, [correo_electronico], (err, results) => {
        if (err) {
            console.error('Error al buscar el usuario:', err);
            return res.status(500).send("Error al buscar el usuario.");
        }

        if (results.length === 0) {
            return res.status(404).send("Usuario no encontrado.");
        }

        const usuario = results[0]; // Usuario encontrado

        // Generar un token único y una fecha de expiración (1 hora)
        const token = crypto.randomBytes(32).toString('hex');
        const expirationTime = new Date(Date.now() + 3600000); // 1 hora

        // Almacenar el token y la fecha de expiración en la base de datos
        const updateQuery = 'UPDATE Usuario SET resetToken = ?, resetTokenExpires = ? WHERE id_usuario = ?';
        connection.query(updateQuery, [token, expirationTime, usuario.id_usuario], (updateErr) => {
            if (updateErr) {
                console.error('Error al guardar el token:', updateErr);
                return res.status(500).send("Error al guardar el token.");
            }

            // Enlace de restablecimiento con el token
            const resetPasswordLink = `http://localhost:5000/restablecer-contrasena/${token}`;

            const resetPasswordMailOptions = {
                from: "quimiap.1999.quimicos@gmail.com",
                to: correo_electronico,
                subject: "Restablecer contraseña",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #28a745; text-align: center;">Solicitud para restablecer tu contraseña</h2>
                        <p style="color: #555; font-size: 16px; text-align: center;">Haz clic en el botón de abajo para restablecer tu contraseña:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${resetPasswordLink}" style="display: inline-block; padding: 12px 24px; font-size: 18px; color: #fff; background-color: #28a745; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">Restablecer contraseña</a>
                        </div>
                        <p style="color: #777; font-size: 14px; text-align: center;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                        <p style="word-break: break-all; text-align: center; background-color: #f1f1f1; padding: 10px; border-radius: 5px; color: #007bff;">${resetPasswordLink}</p>
                    </div>
                `,
            };

            // Enviar el correo de restablecimiento
            transporter.sendMail(resetPasswordMailOptions, (error, info) => {
                if (error) {
                    return res.status(500).send("Error al enviar el correo de restablecimiento.");
                } else {
                    return res.status(200).send("Correo de restablecimiento enviado.");
                }
            });
        });
    });
});
app.get("/restablecer-contrasena/:token", (req, res) => {
    const { token } = req.params;

    // Buscar si el token es válido en la base de datos
    const query = 'SELECT * FROM Usuario WHERE resetToken = ? AND resetTokenExpires > NOW()';

    connection.query(query, [token], (err, results) => {
        if (err) {
            console.error('Error al buscar el token en la base de datos:', err);
            return res.status(500).send("Error al buscar el token.");
        }

        if (results.length === 0) {
            return res.status(400).send("El enlace de restablecimiento es inválido o ha expirado.");
        }

        // Si el token es válido, mostrar el formulario de restablecimiento
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Restablecer Contraseña</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f0f9ff;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .reset-password-container {
                        width: 100%;
                        max-width: 400px;
                        background-color: #fff;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        position: relative;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #333;
                    }
                    input[type="password"] {
                        width: 100%;
                        padding: 10px;
                        margin: 10px 0;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        position: relative;
                    }
                    .password-container {
                        position: relative;
                        width: 100%;
                    }
                    .toggle-password {
                        position: absolute;
                        right: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        cursor: pointer;
                    }
                    .submit-btn {
                        padding: 10px 20px;
                        border: none;
                        background-color: #28a745;
                        color: white;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    .submit-btn:hover {
                        background-color: #218838;
                    }
                    .password-rules {
                        text-align: left;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="reset-password-container">
                    <h1>Restablecer Contraseña</h1>
                    <form action="/actualizar-contrasena" method="POST">
                        <input type="hidden" name="token" value="${token}" />
                        
                        <div class="password-container">
                            <input
                                type="password"
                                id="nueva_contrasena"
                                name="nueva_contrasena"
                                placeholder="Nueva contraseña"
                                required />
                            <img src="https://img.icons8.com/ios-filled/50/000000/visible.png" 
                                class="toggle-password" id="toggleNuevaContrasena" />
                        </div>

                        <div class="password-container">
                            <input
                                type="password"
                                id="confirmar_contrasena"
                                name="confirmar_contrasena"
                                placeholder="Confirmar nueva contraseña"
                                required />
                            <img src="https://img.icons8.com/ios-filled/50/000000/visible.png" 
                                class="toggle-password" id="toggleConfirmarContrasena" />
                        </div>
                        
                        <button type="submit" class="submit-btn">Actualizar Contraseña</button>
                    </form>

                    <div class="password-rules">
                        <p><strong>Reglas de la contraseña:</strong></p>
                        <ul>
                            <li>Entre 8 y 16 caracteres</li>
                            <li>Al menos una letra mayúscula</li>
                            <li>Al menos un signo especial (por ejemplo, !@#$%^&*)</li>
                        </ul>
                    </div>
                </div>

                <script>
                    // Función para alternar la visibilidad de las contraseñas
                    function togglePassword(inputId, toggleIconId) {
                        const input = document.getElementById(inputId);
                        const toggleIcon = document.getElementById(toggleIconId);

                        if (input.type === "password") {
                            input.type = "text";
                            toggleIcon.src = "https://img.icons8.com/ios-filled/50/000000/invisible.png";
                        } else {
                            input.type = "password";
                            toggleIcon.src = "https://img.icons8.com/ios-filled/50/000000/visible.png";
                        }
                    }

                    // Eventos para ver/ocultar contraseña
                    document.getElementById("toggleNuevaContrasena").addEventListener("click", function() {
                        togglePassword("nueva_contrasena", "toggleNuevaContrasena");
                    });
                    document.getElementById("toggleConfirmarContrasena").addEventListener("click", function() {
                        togglePassword("confirmar_contrasena", "toggleConfirmarContrasena");
                    });
                </script>
            </body>
            </html>
        `);
    });
});

app.post("/actualizar-contrasena", async (req, res) => {
    const { token, nueva_contrasena, confirmar_contrasena } = req.body;

    // Verificar si las contraseñas coinciden
    if (nueva_contrasena !== confirmar_contrasena) {
        return res.status(400).json({ success: false, message: "Las contraseñas no coinciden." });
    }

    try {
        // Buscar el usuario por el token
        const query = 'SELECT * FROM Usuario WHERE resetToken = ? AND resetTokenExpires > NOW()';
        
        connection.query(query, [token], async (err, results) => {
            if (err) {
                console.error('Error al buscar el usuario:', err);
                return res.status(500).json({ success: false, message: 'Error al buscar el usuario.' });
            }

            if (results.length === 0) {
                return res.status(400).json({ success: false, message: 'El token es inválido o ha expirado.' });
            }

            const usuario = results[0]; // Usuario encontrado

            // Hashear la nueva contraseña
            const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);

            // Actualizar la contraseña en la base de datos
            const updateQuery = 'UPDATE Usuario SET contrasena = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id_usuario = ?';
            
            connection.query(updateQuery, [hashedPassword, usuario.id_usuario], (updateErr) => {
                if (updateErr) {
                    console.error('Error al actualizar la contraseña:', updateErr);
                    return res.status(500).json({ success: false, message: 'Error al actualizar la contraseña.' });
                }

                // Redirigir a la página de inicio de sesión/registro
                res.redirect("http://localhost:3000/inicio_registro.js");
            });
        });
    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        res.status(500).json({ success: false, message: "Error al actualizar la contraseña." });
    }
});
// ENDPOINT PARA LOS DETALLES DE LA VENTA
app.post("/enviar-detalle-venta", async (req, res) => {
    try {
        const { venta_id } = req.body;  // Solo se recibe el venta_id

        // Consulta para obtener el correo electrónico del cliente y los detalles de la venta, junto con el total de la venta
        const ventaQuery = `
            SELECT u.correo_electronico, p.nombre, 
                   COALESCE(p.imagen, 'https://example.com/default-image.png') AS imagen, 
                   dv.cantidad_total AS cantidad, 
                   p.precio_unitario, 
                   dv.subtotal,
                   v.precio_total
            FROM Venta v
            JOIN Usuario u ON v.cliente_id = u.id_usuario
            JOIN Detalles_Venta dv ON dv.venta_id = v.id_venta
            JOIN Producto p ON dv.producto_id = p.id_producto
            WHERE v.id_venta = ?
        `;

        connection.query(ventaQuery, [venta_id], (error, resultados) => {
            if (error) {
                console.error("Error en la consulta a la base de datos:", error);
                return res.status(500).json({ message: "Error en la consulta a la base de datos." });
            }

            // Verificar si se obtuvieron resultados
            if (resultados.length === 0) {
                return res.status(404).json({ message: "Venta no encontrada." });
            }

            // Extraer el correo del cliente (asumiendo que todos los resultados tienen el mismo correo)
            const correo_electronico = resultados[0].correo_electronico;
            const precio_total = resultados[0].precio_total;

            // Configura el contenido del correo con los resultados de la consulta
            const mailOptions = {
                from: "quimiap.1999.quimicos@gmail.com",
                to: correo_electronico,
                subject: "Detalles de tu Venta",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                         <div style="text-align: center; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                                <img src="https://i.ibb.co/dbTBHkz/LOGO-JEFE-DE-PRODUCCI-N.jpg" alt="Logo Quimiap" style="max-width: 10%; height: auto; border-radius: 50%; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); margin-right: 10px;"/>
                                <p style="color: #555; font-size: 20px; margin: 0; display: flex; align-items: center;">Tu tienda de productos químicos de confianza</p>
                            </div>
                        </div>
                        <h2 style="color: #28a745; text-align: center;">Detalles de tu Venta</h2>
                        <h3 style="color: #28a745;">Productos Comprados:</h3>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <thead>
                                <tr>
                                    <th style="padding: 10px; border-bottom: 1px solid #ddd;">Nombre del Producto</th>
                                    <th style="padding: 10px; border-bottom: 1px solid #ddd;">Imagen</th>
                                    <th style="padding: 10px; border-bottom: 1px solid #ddd;">Cantidad</th>
                                    <th style="padding: 10px; border-bottom: 1px solid #ddd;">Precio Unitario</th>
                                    <th style="padding: 10px; border-bottom: 1px solid #ddd;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resultados.map(prod => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${prod.nombre}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                            <img src="${prod.imagen}" alt="Producto" style="width: 50px; height: auto;" />
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${prod.cantidad}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${parseFloat(prod.precio_unitario).toFixed(2)}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${parseFloat(prod.subtotal).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <h4 style="color: #28a745; text-align: right; margin-top: 20px;">Total de la Venta: $${parseFloat(precio_total).toFixed(2)}</h4>
                        <p style="color: #555; font-size: 16px; text-align: center; margin-top: 20px;">¡Gracias por confiar en nosotros!</p>
                        <p style="text-align: center; font-size: 12px; color: #888;">© 2024 Quimiap. Todos los derechos reservados.</p>
                    </div>
                `,
            };

            // Enviar el correo
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error al enviar el correo:", error);
                    return res.status(500).json({ message: "Error al enviar el correo." });
                }

                res.status(200).json({ message: "Detalles de la venta enviados exitosamente." });
            });
        });
    } catch (error) {
        console.error("Error en el proceso de envío:", error);
        res.status(500).json({ message: "Error en el proceso de envío." });
    }
});
// ENDPOINT PARA ENVIAR ALERTA STOCK A JEFE DE PRODUCCION
app.post("/enviar-alerta-baja-stock", (req, res) => {
    const { id_producto, cantidad_actual } = req.body;

    console.log("ID del producto:", id_producto);
    console.log("Cantidad actual:", cantidad_actual);

    const query = `
        SELECT 
            p.nombre,
            p.imagen,
            u.correo_electronico
        FROM 
            Producto p
        JOIN 
            Usuario u ON u.rol = 'jefe de produccion'
        WHERE 
            p.id_producto = ?;
    `;

    connection.query(query, [id_producto], (error, resultados) => {
        if (error) {
            console.error("Error al consultar el producto y correo:", error);
            return res.status(500).json({ message: "Error al consultar el producto." });
        }

        console.log("Resultados de la consulta:", resultados);

        if (resultados.length === 0) {
            console.warn("No se encontró jefe de producción o el producto no existe.");
            return res.status(404).json({ message: "Producto no encontrado o sin jefe de producción asociado." });
        }

        const correoJefeProduccion = resultados[0].correo_electronico;

        // Usamos map para crear el contenido de la tabla
        const productosHtml = resultados.map(prod => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${prod.nombre}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    <img src="${prod.imagen}" alt="Producto" style="width: 50px; height: auto;" />
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${cantidad_actual}</td>
            </tr>
        `).join('');

        const jefeProduccionMailOptions = {
            from: "quimiap.1999.quimicos@gmail.com",
            to: correoJefeProduccion,
            subject: "Alerta: Stock Bajo de Producto",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            <img src="https://i.ibb.co/dbTBHkz/LOGO-JEFE-DE-PRODUCCI-N.jpg" alt="Logo Quimiap" style="max-width: 10%; height: auto; border-radius: 50%; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); margin-right: 10px;"/>
                            <p style="color: #555; font-size: 20px; margin: 0; display: flex; align-items: center;">Tu tienda de productos químicos de confianza</p>
                        </div>
                    </div>
                    <h2 style="color: #28a745; text-align: center;">Alerta de Stock Bajo</h2>
                    <p>El siguiente producto está por debajo del nivel de stock:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="padding: 10px; border-bottom: 1px solid #ddd; color: #28a745;">Producto</th>
                                <th style="padding: 10px; border-bottom: 1px solid #ddd; color: #28a745;">Imagen</th>
                                <th style="padding: 10px; border-bottom: 1px solid #ddd; color: #28a745;">Cantidad Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosHtml}
                        </tbody>
                    </table>
                    <p style="color: #28a745;">Es necesario reponer el stock de estos productos lo antes posible.</p>
                    <p style="color: #555; font-size: 16px; text-align: center; margin-top: 20px;">¡Gracias por confiar en nosotros!</p>
                    <p style="text-align: center; font-size: 12px; color: #888;">© 2024 Quimiap. Todos los derechos reservados.</p>
                </div>
            `,
        };

        // Enviar el correo
        transporter.sendMail(jefeProduccionMailOptions, (error, info) => {
            if (error) {
                console.error("Error al enviar el correo:", error);
                return res.status(500).json({ message: "Error al enviar el correo." });
            }

            console.log("Correo enviado:", info.response);
            res.status(200).json({ message: "Alerta de stock bajo enviada exitosamente." });
        });
    });
});


// Iniciar el servidor con Express
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor de correos escuchando en http://localhost:${PORT}`);
});
