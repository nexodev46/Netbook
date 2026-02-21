const modal = document.getElementById("modal-post");
const btnOpen = document.getElementById("open-modal");
const btnClose = document.querySelector(".close-modal");

// Abrir modal
btnOpen.onclick = function() {
    modal.style.display = "block";
}

// Cerrar modal al dar clic en la X
btnClose.onclick = function() {
    modal.style.display = "none";
}

// Cerrar modal si hacen clic fuera del cuadro blanco
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}