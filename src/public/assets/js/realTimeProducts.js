const socket = io();

let ulProd = document.getElementById("prod")

socket.on("newProduct", (newProduct) => {
    ulProd.innerHTML += `<li>${newProduct}</li>`
})

socket.on("deletedProduct", prod => {
    ulProd.innerHTML = ""
    prod.forEach(p => {
        ulProd.innerHTML += `<li>${p.title}</li>`
    });
})