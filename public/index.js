const socket = io(); // ✅ Define `socket` SOLO UNA VEZ al inicio

// Mostrar opciones de autenticación cuando se pulsa "Empezar"
document.getElementById("start-button").addEventListener("click", () => {
    document.getElementById("start-button").style.display = "none"; // Ocultamos el botón
    document.getElementById("auth-options").style.display = "block"; // Mostramos las opciones
});


window.onload = () => {
    setTimeout(() => {
        console.log("Verificando Socket.io...");
        console.log("typeof io:", typeof io);

        if (typeof io !== "undefined") {
            console.log("✅ Socket.io cargado correctamente.");
        } else {
            console.error("❌ Error: Socket.io no se ha cargado correctamente.");
        }
    }, 1500);

    const attachButton = document.getElementById("attach-button");
    const fileInput = document.getElementById("file-input");

    if (attachButton && fileInput) {
        attachButton.addEventListener("click", () => {
            console.log("📎 Botón de adjuntar presionado. Abriendo explorador de archivos...");
            fileInput.click(); // Simula el clic en el input oculto
        });

        fileInput.addEventListener("change", (event) => {
            console.log("📂 Archivo seleccionado. Enviando...");
            sendFile(event);
        }); // Detecta cuando se selecciona un archivo
    } else {
        console.error("❌ Error: No se encontró el botón de adjuntar o el input de archivos.");
    }
};




// Verifica si hay una sesión activa
function checkAuth() {
    firebase.auth().onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
            user = {
                name: firebaseUser.displayName || "Usuario",
                email: firebaseUser.email,
                avatar: firebaseUser.photoURL || "/assets/imagenes/default.png"
            };
            localStorage.setItem("user", JSON.stringify(user));
            showChat();
            socket.emit("join", user);
        } else {
            showLanding();
        }
    });
}


// Mostrar la Landing Page
function showLanding() {
    document.getElementById("landing-page").style.display = "block";
    document.getElementById("chat-container").style.display = "none";
}

// Mostrar el Chat sin recargar
function showChat() {
    document.getElementById("landing-page").style.display = "none";
    document.getElementById("chat-container").style.display = "flex";
}


// Registrar usuario con email y contraseña
function registerWithEmail() {
    const name = document.getElementById("register-name").value;
    const status = document.getElementById("register-status").value || "Disponible"; // Estado por defecto
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (!name || !email || !password) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => userCredential.user.updateProfile({ displayName: name }))
        .then(() => {
            user = {
                name: name,
                status: status, // Guardamos el estado del usuario
                email: email,
                avatar: "avatars/default.png"
            };
            localStorage.setItem("user", JSON.stringify(user));
            showChat();
            socket.emit("join", user);
        })
        .catch((error) => alert("Error en el registro: " + error.message));
}

// Iniciar sesión con email y contraseña
function loginWithEmail() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const status = prompt("Escribe tu estado actual (Ej: Disponible, Ocupado, etc.)") || "Disponible";

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            user = {
                name: userCredential.user.displayName || "Usuario",
                status: status, // Se le asigna el estado ingresado
                email: userCredential.user.email,
                avatar: "avatars/default.png"
            };
            localStorage.setItem("user", JSON.stringify(user));
            showChat();
            socket.emit("join", user);
        })
        .catch((error) => alert("Error en inicio de sesión: " + error.message));
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("✅ Inicio de sesión con Google exitoso. Mostrando selección de avatar...");
            pendingLoginData = {
                name: result.user.displayName,
                email: result.user.email
            };
            openAvatarModal(); // 🔹 Ahora abrimos el modal después del login con Google
        })
        .catch((error) => alert("Error en autenticación con Google: " + error.message));
}

// Entrar como invitado
function enterAsGuest() {
    const guestName = prompt("Ingresa un nombre de invitado:");
    if (guestName) {
        console.log("✅ Acceso como invitado exitoso. Mostrando selección de avatar...");
        pendingLoginData = {
            name: guestName,
            email: "guest"
        };
        openAvatarModal(); // 🔹 Ahora abrimos el modal después del acceso como invitado
    }
}
// Cerrar sesión sin recargar
function logout() {
    if (!firebase.apps.length) {
        console.error("❌ Firebase no ha sido inicializado correctamente.");
        return;
    }

    localStorage.removeItem("user");
    firebase.auth().signOut().then(() => {
        showLanding();
        socket.emit("userDisconnected", user); //
    });
}



// Enviar mensaje
function sendMessage() {
    const input = document.getElementById("message");
    const text = input.value.trim();

    if (!text) return; // No enviar mensajes vacíos

    const messageData = { user: user.name, text: text };

    console.log("📨 Enviando mensaje al servidor:", messageData);

    // Enviar mensaje al servidor, PERO NO lo mostramos aquí
    socket.emit("sendMessage", messageData);

    input.value = ""; // Limpiar el input
}


// Detectamos si un usuario está escribiendo
document.getElementById("message").addEventListener("input", () => {
    socket.emit("typing", {user: user.name});
});

// Escuchamos el evento de "escribiendo" en el cliente
socket.on("userTyping", ({ user }) => {
    const typingElement = document.getElementById("typing-indicator");

    typingElement.innerHTML = `${user} está escribiendo...`;

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
        typingElement.innerHTML = "";
    }, 2000); // Desaparece después de 2 segundos sin actividad
});

    // Envío de archivos
function sendFile(event) {
    event.preventDefault(); // ⛔ Evita recarga inesperada

    const file = event.target.files[0];
    if (!file) {
        console.error("❌ No se seleccionó ningún archivo.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function () {
        const fileData = {
            user: user.name,
            fileName: file.name,
            fileType: file.type,
            fileContent: reader.result // Convertir archivo a base64
        };

        console.log("📎 Enviando archivo:", fileData);
        socket.emit("sendFile", fileData); // Enviar al servidor

        // 🛠 Evita desconexión inmediata del usuario
        setTimeout(() => {
            console.log("✅ Archivo enviado sin desconectar al usuario.");
        }, 2000);
    };

    reader.readAsDataURL(file); // Leer el archivo como base64
}



function displayMessage(msg) {
    const messagesContainer = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    // Si el mensaje es del usuario actual, se alinea a la derecha
    if (msg.user === user.name) {
        messageElement.classList.add("sent");
    } else {
        messageElement.classList.add("received");
    }

    if (msg.fileContent) {
        // 🔹 Verificar si el archivo es una imagen o no
        if (msg.fileType.startsWith("image/")) {
            // ✅ Mostrar imágenes en el chat
            messageElement.innerHTML = `
                <strong>${msg.user}:</strong> <br>
                <img src="${msg.fileContent}" alt="${msg.fileName}" class="chat-image">
            `;
        } else {
            // ✅ Mostrar otros archivos como enlaces de descarga
            messageElement.innerHTML = `
                <strong>${msg.user}:</strong> ha enviado un archivo: <br>
                <a href="${msg.fileContent}" download="${msg.fileName}" target="_blank">
                    📄 ${msg.fileName}
                </a>
            `;
        }
    } else {
        // ✅ Mensajes de texto normales
        messageElement.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    }

    // 🔹 Agregar el mensaje al chat
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll al último mensaje
}



// Escuchar archivos enviados por otros usuarios
socket.on("fileMessage", (fileData) => {
    console.log("📎 Archivo recibido:", fileData);

    const messagesContainer = document.getElementById("messages");
    const fileElement = document.createElement("div");
    fileElement.classList.add("message");

    if (fileData.user === user.name) {
        fileElement.classList.add("sent");
    } else {
        fileElement.classList.add("received");
    }

    let content = `<strong>${fileData.user}:</strong> `;

    if (fileData.fileType.startsWith("image/")) {
        content += `<br><img src="${fileData.fileContent}" class="chat-image" style="max-width: 200px; border-radius: 5px;">`;
    } else if (fileData.fileType.startsWith("audio/")) {
        content += `<br><audio controls><source src="${fileData.fileContent}" type="${fileData.fileType}"></audio>`;
    } else {
        content += `<br><a href="${fileData.fileContent}" download="${fileData.fileName}">📂 Descargar ${fileData.fileName}</a>`;
    }

    fileElement.innerHTML = content;
    messagesContainer.appendChild(fileElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});









// Detectar Enter para enviar mensaje
function checkEnter(event) {
    if (event.key === "Enter") sendMessage();
}

socket.on("message", (msg) => {
    console.log("📩 Recibido mensaje:", msg);

    // Verificamos que el mensaje tiene datos válidos
    if (!msg || typeof msg !== "object" || !msg.user || (!msg.text && !msg.fileContent)) {
        console.error("❌ Error: Mensaje recibido con datos inválidos:", msg);
        return;
    }

    displayMessage(msg);
});



// Actualizar la lista de usuarios conectados
socket.on("updateUsers", (users) => {
    const userList = document.getElementById("user-list");
    userList.innerHTML = ""; // Limpiar la lista antes de actualizar

    users.forEach(u => {
        // 🔹 Asegurar que la imagen tiene una URL válida
        const avatarSrc = u.avatar ? u.avatar : "/assets/imagenes/default.png";

        const li = document.createElement("li");
        li.innerHTML = `<img src="${avatarSrc}" class="user-avatar"> ${u.name}`;
        userList.appendChild(li);
    });

    console.log("Usuarios conectados:", users); // Verificar en consola
});


const avatars = ["default.png", "burro.png", "niña.png", "panda.png", "perro.png", "troll.png"];
let selectedAvatar = "default.png";
let pendingLogin = null;

function generateAvatars() {
    const avatarContainer = document.getElementById("avatar-selection");
    avatarContainer.innerHTML = ""; // 🔹 Limpiar antes de insertar nuevos avatares

    avatars.forEach(avatar => {
        const img = document.createElement("img");
        img.src = `assets/imagenes/${avatar}`;
        img.classList.add("avatar-option");
        img.onclick = () => selectAvatar(avatar);
        avatarContainer.appendChild(img);
    });
}

// Función para abrir el modal y cargar los avatares antes de iniciar sesión
function openAvatarModal() {
    if (!pendingLoginData) {
        console.error("❌ Error: No hay datos de usuario almacenados.");
        return;
    }

    console.log("✅ Mostrando selección de avatar...");
    generateAvatars();
    document.getElementById("avatar-modal").style.display = "flex";
}



// Función para cerrar el modal
function closeAvatarModal() {
    document.getElementById("avatar-modal").style.display = "none";
    pendingLogin = null; // Resetear login pendiente
}

// Seleccionar un avatar
function selectAvatar(avatar) {
    selectedAvatar = avatar;

    // Resaltar el avatar seleccionado
    document.querySelectorAll(".avatar-option").forEach(img => img.classList.remove("selected"));
    document.querySelector(`img[src='assets/imagenes/${avatar}']`).classList.add("selected");
}

// Confirmar avatar y continuar con el login
function confirmAvatar() {
    console.log("🔹 Confirmando avatar seleccionado:", selectedAvatar);

    if (!selectedAvatar) {
        console.error("❌ Error: No se ha seleccionado un avatar.");
        alert("Error: Debes seleccionar un avatar.");
        return;
    }

    if (!pendingLoginData) {
        console.error("❌ Error: No hay datos de usuario pendientes.");
        return;
    }

    // Guardamos los datos finales del usuario
    user = {
        name: pendingLoginData.name,
        email: pendingLoginData.email,
        avatar: `/assets/imagenes/${selectedAvatar}`
    };

    console.log("✅ Datos de usuario almacenados:", user);

    // Guardar en LocalStorage y conectar al chat
    localStorage.setItem("user", JSON.stringify(user));
    showChat();
    socket.emit("join", user);

    // Cerrar el modal
    closeAvatarModal();
}



