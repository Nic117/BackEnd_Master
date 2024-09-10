const generateOrder = async () => {
    const cartId = document.getElementById('cart-id').value;

    try {
        const response = await fetch(`/api/carts/${cartId}/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: nombre,
                email: email,
                phone: telefono
            })
        });

        const data = await response.json();
        if (data.success) {
            alert(`Compra realizada! ID del ticket: ${data.ticket.code}`);
        } else {
            alert('Hubo un error al procesar la compra.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
