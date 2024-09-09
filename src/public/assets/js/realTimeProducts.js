const socket = io();
function addProduct(product) {
    const ulProd = document.getElementById("prod");
    const li = document.createElement("li");
    li.textContent = product;
    ulProd.appendChild(li);
}

function updateProductList(products) {
    const ulProd = document.getElementById("prod");
    ulProd.innerHTML = "";
    products.forEach(product => {
        addProduct(product.title);
    });
}

socket.on("newProduct", addProduct);
socket.on("deletedProduct", updateProductList);
