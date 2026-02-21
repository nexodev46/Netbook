import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile,
    signOut,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- REFERENCIAS AL DOM ---
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const nameInput = document.getElementById("username");
const btnRegister = document.getElementById("btn-register");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const btnReset = document.getElementById("btn-reset-pass");

// --- 1. REGISTRO DE USUARIO ---
if (btnRegister) {
    btnRegister.onclick = async () => {
        const email = emailInput.value;
        const pass = passInput.value;
        const name = nameInput.value;

        if (!email || !pass || !name) {
            alert("Por favor, completa todos los campos (Nombre, Correo y Contraseña).");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            
            // Guardamos el nombre y un avatar inicial
            await updateProfile(userCredential.user, {
                displayName: name,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            });

            alert("¡Bienvenido a Netbook, " + name + "!");
            window.location.href = "index.html"; 
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        }
    };
}

// --- 2. INICIO DE SESIÓN ---
if (btnLogin) {
    btnLogin.onclick = async () => {
        const email = emailInput.value;
        const pass = passInput.value;

        if (!email || !pass) {
            alert("Escribe tu correo y contraseña.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = "index.html";
        } catch (error) {
            alert("Correo o contraseña incorrectos.");
        }
    };
}

// --- 3. CERRAR SESIÓN ---
if (btnLogout) {
    btnLogout.onclick = async () => {
        try {
            await signOut(auth);
            alert("Sesión cerrada.");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Error al salir:", error);
        }
    };
}

// --- 4. RECUPERAR CONTRASEÑA ---
if (btnReset) {
    btnReset.onclick = async (e) => {
        e.preventDefault(); 
        const email = emailInput.value;

        if (!email) {
            alert("Escribe tu correo en el campo de arriba para enviarte el enlace de recuperación.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            alert("¡Correo enviado! Revisa tu bandeja de entrada o spam.");
        } catch (error) {
            alert("Error: Verifica que el correo sea el correcto.");
        }
    };
}