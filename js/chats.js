import { db, auth } from './firebase-config.js';
import { 
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let activeReceiverId = null;
let unsubscribeChat = null;

// 1. Verificar usuario
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("Chat listo para:", user.displayName);
    }
});

// 2. Escuchar clics en los botones de "Mensaje" de los posts
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.chat-trigger');
    if (btn) {
        activeReceiverId = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');

        const chatWindow = document.getElementById('chat-window');
        const chatTitle = document.getElementById('chat-user-name');
        
        if (chatWindow && chatTitle) {
            chatTitle.innerText = "Chat con " + name;
            chatWindow.style.display = 'flex';
            cargarMensajes(activeReceiverId); // Cargamos la conversación
        }
    }
});

// 3. Función para enviar mensajes
const enviarMensaje = async () => {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();

    if (!texto || !activeReceiverId || !currentUser) return;

    try {
        await addDoc(collection(db, "chats"), {
            senderId: currentUser.uid,
            receiverId: activeReceiverId,
            mensaje: texto,
            fecha: serverTimestamp(),
            // Clave para la privacidad:
            participants: [currentUser.uid, activeReceiverId].sort()
        });
        input.value = "";
        input.focus();
    } catch (error) {
        console.error("Error al enviar:", error);
    }
};

// Eventos de envío
const btnSend = document.getElementById('btn-send-chat');
if (btnSend) btnSend.onclick = enviarMensaje;

const chatInput = document.getElementById('chat-input');
if (chatInput) {
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') enviarMensaje(); };
}

// 4. CARGAR MENSAJES (La parte que fallaba)
function cargarMensajes(receiverId) {
    const chatBox = document.getElementById('chat-messages');
    if (!currentUser || !chatBox) return;

    // Limpiar rastro de chats anteriores
    if (unsubscribeChat) unsubscribeChat();

    // Filtro de seguridad por participantes
    const participants = [currentUser.uid, receiverId].sort();
    const qChat = query(
        collection(db, "chats"), 
        where("participants", "==", participants), 
        orderBy("fecha", "asc")
    );

    unsubscribeChat = onSnapshot(qChat, (snap) => {
        // IMPORTANTE: Limpiamos el texto de "Selecciona un profesional"
        chatBox.innerHTML = ""; 

        if (snap.empty) {
            chatBox.innerHTML = `
                <div style="text-align:center; color:gray; margin-top:20px; font-size:13px;">
                    No hay mensajes aquí aún.<br>¡Escribe algo para empezar!
                </div>`;
            return;
        }

        snap.forEach(doc => {
            const m = doc.data();
            const isMine = m.senderId === currentUser.uid;
            
            const msgDiv = document.createElement("div");
            msgDiv.innerText = m.mensaje;
            
            // Estilos dinámicos para las burbujas
            Object.assign(msgDiv.style, {
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                background: isMine ? '#0a66c2' : '#e4e6eb',
                color: isMine ? 'white' : 'black',
                padding: '8px 14px',
                borderRadius: '18px',
                marginBottom: '6px',
                maxWidth: '75%',
                fontSize: '14px',
                wordBreak: 'break-word',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            });
            
            chatBox.appendChild(msgDiv);
        });
        
        // Scroll automático al último mensaje
        chatBox.scrollTop = chatBox.scrollHeight;
    }, (error) => {
        console.error("Error en Snapshot:", error);
    });
}