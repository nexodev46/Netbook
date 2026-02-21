import { db, auth } from './firebase-config.js';
import { 
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, 
    doc, updateDoc, arrayUnion, arrayRemove, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const btnPublish = document.getElementById("btn-publish-final");
const postText = document.getElementById("post-text");
const fileInput = document.getElementById("file-upload");
const postsContainer = document.getElementById("posts-container");

const CLOUD_NAME = "dzgbahmog"; 
const UPLOAD_PRESET = "ml_default"; 

// --- PUBLICAR POST ---
btnPublish.onclick = async () => {
    const file = fileInput.files[0];
    const text = postText.value;
    if (!file && !text) return;
    btnPublish.disabled = true;

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
            autor: "Luciano Novo",
            fotoAutor: "https://i.pravatar.cc/150?u=luciano",
            contenido: text,
            imagenUrl: url,
            fecha: serverTimestamp(),
            likedBy: [], 
            comentariosCount: 0
        });

        postText.value = "";
        fileInput.value = "";
    } catch (e) { console.error(e); }
    finally { btnPublish.disabled = false; btnPublish.innerText = "Publicar"; }
};

// --- RENDERIZAR FEED ---
const q = query(collection(db, "posts"), orderBy("fecha", "desc"));

onSnapshot(q, (snap) => {
    postsContainer.innerHTML = "";
    snap.forEach(postDoc => {
        const d = postDoc.data();
        const postId = postDoc.id; 
        const userId = "Luciano Novo"; 
        
        const hasLiked = d.likedBy && d.likedBy.includes(userId);
        const likesCount = d.likedBy ? d.likedBy.length : 0;

        const article = document.createElement("article");
        article.className = "post-card";
        article.innerHTML = `
            <header class="post-header">
                <img src="${d.fotoAutor}" class="avatar-sm">
                <div>
                    <h4>${d.autor}</h4>
                    <p style="font-size:12px; color:gray;">Publicado ahora</p>
                </div>
            </header>
            <div style="padding:0 16px 12px; font-size:14px;">${d.contenido}</div>
            ${d.imagenUrl ? `<img src="${d.imagenUrl}" class="post-img">` : ""}
            
            <div class="post-stats" style="padding: 8px 16px; font-size: 12px; color: #666; border-top: 1px solid #eee;">
                <span>👍 <span id="likes-count-${postId}">${likesCount}</span> personas</span> • 
                <span>💬 ${d.comentariosCount || 0} comentarios</span>
            </div>

            <footer class="post-actions">
                <button class="action-btn" id="like-${postId}" style="color: ${hasLiked ? '#0a66c2' : 'inherit'}">
                    <span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${hasLiked ? 1 : 0}">thumb_up</span> 
                    ${hasLiked ? 'Te gusta' : 'Me gusta'}
                </button>
                <button class="action-btn" id="comment-btn-${postId}"><span class="material-symbols-rounded">chat_bubble</span> Comentar</button>
                <button class="action-btn" id="share-${postId}"><span class="material-symbols-rounded">share</span> Compartir</button>
            </footer>

            <div id="comments-section-${postId}" class="comments-list" style="padding: 10px 16px; background: #f8f9fa; display: none; border-top: 1px solid #eee;">
                <div id="list-${postId}"></div>
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <input type="text" id="input-${postId}" placeholder="Escribe un comentario..." style="flex:1; border-radius:20px; border:1px solid #ddd; padding:5px 12px; outline:none;">
                    <button id="send-${postId}" class="btn-primary" style="padding:4px 12px; font-size:12px;">Enviar</button>
                </div>
            </div>
        `;

        // --- LÓGICA DE LIKE ---
        article.querySelector(`#like-${postId}`).onclick = async () => {
            const postRef = doc(db, "posts", postId);
            if (hasLiked) {
                await updateDoc(postRef, { likedBy: arrayRemove(userId) });
            } else {
                await updateDoc(postRef, { likedBy: arrayUnion(userId) });
            }
        };

        // --- LÓGICA DE COMPARTIR (INTEGRADA) ---
        article.querySelector(`#share-${postId}`).onclick = async () => {
            const shareData = {
                title: 'Netbook - Publicación de ' + d.autor,
                text: d.contenido,
                url: window.location.href 
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    alert("¡Enlace copiado al portapapeles!");
                }
            } catch (err) {
                console.log('Error al compartir:', err);
            }
        };

        // --- LÓGICA DE COMENTARIOS ---
        article.querySelector(`#comment-btn-${postId}`).onclick = () => {
            const section = article.querySelector(`#comments-section-${postId}`);
            section.style.display = section.style.display === "none" ? "block" : "none";
            cargarComentarios(postId);
        };

        article.querySelector(`#send-${postId}`).onclick = async () => {
            const input = article.querySelector(`#input-${postId}`);
            if (!input.value) return;
            await addDoc(collection(db, "posts", postId, "comentarios"), {
                texto: input.value,
                autor: userId,
                fecha: serverTimestamp()
            });
            await updateDoc(doc(db, "posts", postId), { comentariosCount: increment(1) });
            input.value = "";
        };

        postsContainer.appendChild(article);
    });
});

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