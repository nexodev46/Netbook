import { db, auth } from './firebase-config.js';
import { 
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, 
    doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const btnPublish = document.getElementById("btn-publish-final");
const postText = document.getElementById("post-text");
const fileInput = document.getElementById("file-upload");
const postsContainer = document.getElementById("posts-container");

const CLOUD_NAME = "dzgbahmog"; 
const UPLOAD_PRESET = "ml_default"; 

let currentUser = null;

// 1. Manejo de Sesión
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if(document.querySelector(".avatar-nav")) document.querySelector(".avatar-nav").src = user.photoURL || "https://i.pravatar.cc/150";
        if(document.querySelector(".info h3")) document.querySelector(".info h3").innerText = user.displayName || "Usuario";
    } else {
        window.location.href = "login.html";
    }
});

// 2. Publicar Post
btnPublish.onclick = async () => {
    const file = fileInput.files[0];
    const text = postText.value;
    if (!currentUser || (!file && !text)) return;
    
    btnPublish.disabled = true;
    btnPublish.innerText = "Publicando...";

    try {
        let url = "";
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
            const data = await res.json();
            url = data.secure_url;
        }

        await addDoc(collection(db, "posts"), {
            autor: currentUser.displayName,
            fotoAutor: currentUser.photoURL,
            userId: currentUser.uid,
            contenido: text,
            imagenUrl: url,
            fecha: serverTimestamp(),
            likedBy: [], 
            comentariosCount: 0
        });

        postText.value = "";
        fileInput.value = "";
    } catch (e) { 
        console.error(e); 
    } finally { 
        btnPublish.disabled = false; 
        btnPublish.innerText = "Publicar"; 
    }
};

// 3. Cargar Posts en Tiempo Real
const q = query(collection(db, "posts"), orderBy("fecha", "desc"));

onSnapshot(q, (snap) => {
    postsContainer.innerHTML = "";
    snap.forEach(postDoc => {
        const d = postDoc.data();
        const postId = postDoc.id; 
        
        const hasLiked = currentUser && d.likedBy && d.likedBy.includes(currentUser.uid);
        const likesCount = d.likedBy ? d.likedBy.length : 0;

        const article = document.createElement("article");
        article.className = "post-card";
        
        // Estructura Unificada (Contenido + Botón Chat)
        article.innerHTML = `
            <header class="post-header" style="display: flex; justify-content: space-between; align-items: start; padding: 12px; position: relative;">
                <div style="display: flex; gap: 10px;">
                    <img src="${d.fotoAutor || 'https://i.pravatar.cc/150'}" class="avatar-sm">
                    <div>
                        <h4 style="margin:0;">${d.autor}</h4>
                        <p style="font-size:12px; color:gray; margin:0;">Publicado ahora</p>
                    </div>
                </div>

                ${currentUser && d.userId === currentUser.uid ? `
                    <div style="position: relative;">
                        <button class="action-btn-dots" id="dots-${postId}" style="background:none; border:none; cursor:pointer; color:#666;">
                            <span class="material-symbols-rounded">more_horiz</span>
                        </button>
                        <div id="menu-${postId}" class="card" style="display:none; position:absolute; right:0; top:30px; z-index:100; width:120px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding:5px; background:white;">
                            <button id="del-${postId}" style="width:100%; background:none; border:none; color:red; display:flex; align-items:center; gap:5px; cursor:pointer; padding:8px; font-weight:600;">
                                <span class="material-symbols-rounded" style="font-size:18px;">delete</span> Eliminar
                            </button>
                        </div>
                    </div>
                ` : ""}
            </header>

            <div style="padding:0 16px 12px; font-size:14px;">${d.contenido}</div>
            ${d.imagenUrl ? `<img src="${d.imagenUrl}" class="post-img" style="width:100%; max-height:400px; object-fit:cover;">` : ""}
            
            <div class="post-stats" style="padding: 8px 16px; font-size: 12px; color: #666; border-top: 1px solid #eee;">
                <span>👍 <span id="likes-count-${postId}">${likesCount}</span> personas</span> • 
                <span>💬 ${d.comentariosCount || 0} comentarios</span>
            </div>

            <footer class="post-actions" style="display:flex; justify-content: space-around; padding: 5px; border-top: 1px solid #eee;">
                <button class="action-btn" id="like-${postId}" style="color: ${hasLiked ? '#0a66c2' : 'inherit'}">
                    <span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${hasLiked ? 1 : 0}">thumb_up</span> 
                    Me gusta
                </button>
                
                <button class="action-btn chat-trigger" data-id="${d.userId}" data-name="${d.autor}">
                    <span class="material-symbols-rounded">chat</span> Mensaje
                </button>

                <button class="action-btn" id="comment-btn-${postId}">
                    <span class="material-symbols-rounded">chat_bubble</span> Comentar
                </button>
            </footer>

            <div id="comments-section-${postId}" class="comments-list" style="padding: 10px 16px; background: #f8f9fa; display: none; border-top: 1px solid #eee;">
                <div id="list-${postId}"></div>
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <input type="text" id="input-${postId}" placeholder="Escribe un comentario..." style="flex:1; border-radius:20px; border:1px solid #ddd; padding:5px 12px; outline:none;">
                    <button id="send-${postId}" class="btn-primary" style="padding:4px 12px; font-size:12px;">Enviar</button>
                </div>
            </div>
        `;

        // Lógica de Menú Eliminar
        if (currentUser && d.userId === currentUser.uid) {
            const btnDots = article.querySelector(`#dots-${postId}`);
            const menu = article.querySelector(`#menu-${postId}`);
            const btnDel = article.querySelector(`#del-${postId}`);
            btnDots.onclick = (e) => {
                e.stopPropagation();
                menu.style.display = menu.style.display === "none" ? "block" : "none";
            };
            btnDel.onclick = async () => {
                if(confirm("¿Seguro que quieres borrar este post?")) {
                    await deleteDoc(doc(db, "posts", postId));
                }
            };
        }

        // Lógica de Likes
        article.querySelector(`#like-${postId}`).onclick = async () => {
            if(!currentUser) return;
            const postRef = doc(db, "posts", postId);
            if (hasLiked) {
                await updateDoc(postRef, { likedBy: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(postRef, { likedBy: arrayUnion(currentUser.uid) });
            }
        };

        // Lógica de Comentarios
        article.querySelector(`#comment-btn-${postId}`).onclick = () => {
            const section = article.querySelector(`#comments-section-${postId}`);
            section.style.display = section.style.display === "none" ? "block" : "none";
            cargarComentarios(postId);
        };

        article.querySelector(`#send-${postId}`).onclick = async () => {
            const input = article.querySelector(`#input-${postId}`);
            if (!input.value || !currentUser) return;
            await addDoc(collection(db, "posts", postId, "comentarios"), {
                texto: input.value,
                autor: currentUser.displayName,
                fecha: serverTimestamp()
            });
            await updateDoc(doc(db, "posts", postId), { comentariosCount: increment(1) });
            input.value = "";
        };

        postsContainer.appendChild(article);
    });
});

// Función para cargar comentarios
async function cargarComentarios(postId) {
    const list = document.getElementById(`list-${postId}`);
    const qCom = query(collection(db, "posts", postId, "comentarios"), orderBy("fecha", "asc"));
    onSnapshot(qCom, (snap) => {
        list.innerHTML = "";
        snap.forEach(cDoc => {
            const c = cDoc.data();
            list.innerHTML += `
                <div style="background: #fff; padding: 8px; border-radius: 8px; margin-bottom: 5px; font-size: 13px; border: 1px solid #eee;">
                    <strong>${c.autor}</strong>: ${c.texto}
                </div>
            `;
        });
    });
}