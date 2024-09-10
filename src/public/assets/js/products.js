document.addEventListener('DOMContentLoaded', function () {
    initializeCategorySelect();
    initializeSortSelect();
});

const comprar = async (pid) => {
    let inputCart = document.getElementById("cart");
    let cid = inputCart.value;
    console.debug(`Producto con id ${pid}, Carrito ${cid}`);

    let response = await fetch(`/api/carts/${cid}/products/${pid}`, {
        method: "post"
    });

    if (response.status === 200) {
        let datos = await response.json();
        Toastify({
            text: "Producto agregado al carrito",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#4CAF50",
                color: "white",
                borderRadius: "8px"
            },
        }).showToast();
    } else {
        Toastify({
            text: "Error al agregar el producto",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#f44336",
                color: "white",
                borderRadius: "8px"
            },
        }).showToast();
    }
}

function initializeCategorySelect() {
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        const currentUrl = new URL(window.location.href);
        const currentCategory = currentUrl.searchParams.get('category');
        const selectedValue = currentCategory ? `/products?category=${currentCategory}` : '/products';
        categorySelect.value = selectedValue;
    }
}

function initializeSortSelect() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function (event) {
            const selectedOption = event.target.value;
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('sort', selectedOption);
            window.location.href = currentUrl.toString();
        });
    }
}

document.getElementById('categorySelect').addEventListener('change', function () {
    window.location.href = this.value;
});
