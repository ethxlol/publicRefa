document.addEventListener('DOMContentLoaded', function () {
	updateCheckoutCart();
});

function updateCheckoutCart() {
	fetch('/cart-details')
		.then((response) => response.json())
		.then((cartItems) => {
			const checkoutCartContainer = document.getElementById(
				'checkout-cart-container'
			);
			checkoutCartContainer.innerHTML = '';

			cartItems.forEach((item) => {
				const price = parseFloat(item.price);
				const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2); // Format price or set to 'N/A' if not a number

				const itemElement = document.createElement('div');
				itemElement.innerHTML = `
									<p>${item.name} - $${formattedPrice}</p>
									<input type="number" value="${item.quantity}" min="1" data-product-id="${item.productId}" onchange="updateCartItemQuantity(this)">
									<button onclick="removeItemFromCart(${item.productId})">X</button>
							`;
				checkoutCartContainer.appendChild(itemElement);
			});
		})
		.catch((error) => console.error('Error:', error));
}

function showCartUpdateMessage() {
	const messageDiv = document.getElementById('cart-update-message');
	messageDiv.style.display = 'block';

	// Hide the message after 3 seconds
	setTimeout(() => {
		messageDiv.style.display = 'none';
	}, 3000);
}

function updateCartItemQuantity(input) {
	const productId = input.getAttribute('data-product-id');
	const newQuantity = input.value;
	fetch('/update-cart', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			productId: parseInt(productId, 10),
			quantity: parseInt(newQuantity, 10),
		}),
	})
		.then((response) => response.text())
		.then((data) => {
			console.log(data);
			// message to confirm user of updated cart
			showCartUpdateMessage();
			updateCheckoutCart();
		})
		.catch((error) => console.error('Error:', error));
}

function removeItemFromCart(productId) {
	fetch('/remove-from-cart', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ productId }),
	})
		.then((response) => response.text())
		.then((data) => {
			console.log(data);
			// message to confirm user of updated cart
			showCartUpdateMessage();
			updateCheckoutCart();
		})
		.catch((error) => console.error('Error:', error));
}
function submitOrder() {
	// Make a POST request to the server to place the order
	fetch('/checkout', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		// No need to send body data as the server already has the cart in session
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('Problem placing order');
			}
			return response.text();
		})
		.then((confirmationMessage) => {
			console.log(confirmationMessage);
			window.location.href = '/confirmation'; // Redirect to the confirmation page
		})
		.catch((error) => {
			console.error('Error:', error);
			alert('Error:', error);
		});
}
