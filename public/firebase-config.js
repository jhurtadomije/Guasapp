document.addEventListener("DOMContentLoaded", function () {
    console.log("🔍 Verificando carga de Firebase...");

    if (typeof firebase !== "undefined") {
        console.log("✅ Firebase detectado, inicializando...");

        // Configuración de Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyBIlM27h04I5HHC4NfkHH4i7N_f7DDdW2Y",
            authDomain: "guasapp-85724.firebaseapp.com",
            projectId: "guasapp-85724",
            storageBucket: "guasapp-85724.appspot.com",
            messagingSenderId: "777202759761",
            appId: "1:777202759761:web:755997fe1e4d99a4626070",
            measurementId: "G-HBF8STBT7P"
        };

        // Inicializar Firebase solo si aún no está inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado correctamente.");
        } else {
            console.log("⚠️ Firebase ya estaba inicializado.");
        }

        // Hacer `auth` accesible globalmente
        window.auth = firebase.auth();
    } else {
        console.error("❌ Firebase no se ha cargado correctamente.");
    }
});