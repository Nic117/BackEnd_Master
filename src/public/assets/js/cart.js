function clearCart(cartId) {
    fetch(`/api/carts/${cartId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            location.reload();
        })
        .catch(error => console.error('Error:', error));
}

function removeItem(cartId, productId) {
    
    fetch(`/api/carts/${cartId}/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        location.reload();
    })
    .catch(error => console.error('Error:', error));
}
