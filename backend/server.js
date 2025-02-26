const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", //  Permitimos las conexiones desde cualquier origen
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8 //permitimos que se puedan enviar archivos de mayor peso, como imagenes y varios.
});

const PORT = process.env.PORT || 5000;
let users = {}; //  Listamos los usuarios conectados

// Servimos la carpeta `public` como raíz de los archivos estáticos
app.use(express.static(path.join(__dirname, "../public")));

// Ruta para la página principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// 🔹 Asegurar que `socket.io.js` se sirva correctamente
app.get("/socket.io/socket.io.js", (req, res) => {
    res.sendFile(require.resolve("socket.io/client-dist/socket.io.js"));
});

// Conexión con clientes WebSocket
io.on("connection", (socket) => {
    console.log("✅ Nuevo usuario conectado:", socket.id);

    // Retransmitimos el evento escribiendo a todos los usuarios
    socket.on("typing", () => {
        if (users[socket.id]) {
            socket.broadcast.emit("userTyping", { user: users[socket.id].name });
        }
    });


    // Evento para cuando un usuario se une al chat
    socket.on("join", (userData) => {
        console.log(`✅ Usuario conectado: ${userData.name}`);

        users[socket.id] = {
            name: userData.name,
            email: userData.email || "guest",
            avatar: userData.avatar || "/assets/imagenes/default.png"
        };

        io.emit("updateUsers", Object.values(users));
        io.emit("message", { user: "Sistema", text: `${userData.name} se ha unido al chat` });

        console.log("Usuarios actuales:", users);
    });


    // Envío de mensajes y retransmision a todos los usuarios
    socket.on("sendMessage", (message) => {
        console.log("Mensaje recibido en el servidor:", message);
        io.emit("message", message);
    });

    // Envío de archivos a todos los usuarios
    socket.on("sendFile", (fileData) => {
        console.log(`📂 Archivo recibido de ${fileData.user}: ${fileData.fileName}`);

        // 🚨 Asegurar que el usuario sigue en la lista de conectados antes de emitir
        if (!users[socket.id]) {
            console.warn(`⚠️ Usuario desconocido intentando enviar archivo: ${fileData.user}`);
            return;
        }

        console.log(`🚨 Se ha recibido un archivo. ${fileData.user} sigue en línea.`);

        // ✅ Emitir el archivo a TODOS los usuarios sin modificar la lista de conectados
        io.emit("fileMessage", fileData);
    });

    // Evento personalizado para cuando un usuario cierra sesión manualmente
    socket.on("userDisconnected", (user) => {
        if (users[socket.id]) {
            io.emit("message", { user: "Sistema", text: `${users[socket.id].name} ha salido del chat` });

            io.emit("updateUsers", Object.values(users));
            console.log("Usuarios después de desconexión:", users);
        }
    });


    // Manejar desconexión automática de Socket.io
    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log(`⚠️ Usuario desconectado: ${users[socket.id].name}`);

            // 🔹 Evitar desconexión inmediata tras enviar un archivo
            setTimeout(() => {
                console.log(`⏳ Esperando para verificar desconexión de ${users[socket.id].name}...`);
                if (users[socket.id]) {
                    io.emit("message", { user: "Sistema", text: `${users[socket.id].name} ha salido del chat` });

                    // Eliminar usuario de la lista SOLO si sigue desconectado
                    delete users[socket.id];
                    io.emit("updateUsers", Object.values(users));

                    console.log("🚨 Usuarios después de desconexión:", users);
                }
            }, 2000); // 🔹 Esperar 2 segundos antes de eliminar al usuario
        }
    });

});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});