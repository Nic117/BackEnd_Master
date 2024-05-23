const socket = io();

let ulProd = document.getElementById("prod")

socket.on("nuevoProducto", prod => {
    ulProd.innerHTML += `<li>${prod}</li>`
})

socket.on("productoEliminado", prod => {
    ulProd.innerHTML = ""
    prod.forEach(p => {
        ulProd.innerHTML += `<li>${p.title}</li>`
    });
})