import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- REFERENCIAS A LOS ELEMENTOS DEL DOM ---
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const nameInput = document.getElementById("username");
const btnRegister = document.getElementById("btn-register");
const btnLogin = document.getElementById("btn-login");

// --- FUNCIÓN PARA REGISTRARSE ---
if (btnRegister) {
    btnRegister.onclick = async () => {
        const email = emailInput.value;
        const pass = passInput.value;
        const name = nameInput.value;

        if (!email || !pass || !name) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        try {
            // 1. Crea el usuario en Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            
            // 2. Le asigna el nombre y una foto por defecto (avatar)
            await updateProfile(userCredential.user, {
                displayName: name,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` // Genera un avatar cool con su nombre
            });

            alert("¡Bienvenido a Netbook, " + name + "!");
            window.location.href = "index.html"; // Entra a la red social
        } catch (error) {
            console.error(error);
            alert("Error al registrarse: " + error.message);
        }
    };
}

// --- FUNCIÓN PARA INICIAR SESIÓN ---
if (btnLogin) {
    btnLogin.onclick = async () => {
        const email = emailInput.value;
        const pass = passInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = "index.html"; // Entra a la red social
        } catch (error) {
            alert("Correo o contraseña incorrectos.");
        }
    };
}





import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- FUNCIÓN PARA CERRAR SESIÓN ---
const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.onclick = async () => {
        try {
            await signOut(auth);
            alert("Has cerrado sesión correctamente.");
            window.location.href = "login.html"; // Regresa al login
        } catch (error) {
            console.error("Error al salir:", error);
        }
    };
}