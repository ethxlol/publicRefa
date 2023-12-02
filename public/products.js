document.addEventListener('DOMContentLoaded', function () {
	fetch('/products')
		.then((response) => response.json())
		.then((products) => {
			const productList = document.getElementById('product-list');
			products.forEach((product) => {
				const productElement = document.createElement('div');
				productElement.className = 'product';
				productElement.innerHTML = `
									<h3>${product.name}</h3>
									<p>${product.description}</p>
									<p>Pris: $${product.price.toFixed(2)}</p>
									<label for="quantity_${product.id}">Antall:</label>
									<input type="number" id="quantity_${product.id}" value="1" min="1">
									<button onclick="handleAddToCart(${product.id})">Legg til</button>
							`;
				productList.appendChild(productElement);
			});
		})
		.catch((error) => console.error('Error:', error));
});

function handleAddToCart(productId) {
	const quantityInput = document.getElementById(`quantity_${productId}`);
	const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
	addToCart(productId, quantity);
}

function addToCart(productId, quantity) {
	fetch('/add-to-cart', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			productId: productId,
			quantity: quantity,
		}),
	})
		.then((response) => response.text())
		.then((data) => {
			console.log(data);
			alert('Product added to cart!');
			// Optional: Update cart display or quantity in real-time here
		})
		.catch((error) => {
			console.error('Error:', error);
		});
}

function showCart() {
	fetch('/cart-details')
		.then((response) => response.json())
		.then((cartItems) => {
			const cartContainer = document.getElementById('cart-container');
			cartContainer.innerHTML = ''; // Clear the cart container

			if (cartItems.length === 0) {
				cartContainer.innerHTML = '<p>Your cart is empty.</p>';
			} else {
				cartItems.forEach((item) => {
					const itemElement = document.createElement('div');
					itemElement.className = 'cart-item';
					itemElement.innerHTML = `
											<p>${item.name} - $${item.price.toFixed(2)} x ${item.quantity}</p>
									`;
					cartContainer.appendChild(itemElement);
				});
			}

			cartContainer.style.display = 'block'; // Make the cart container visible
		})
		.catch((error) => console.error('Error:', error));
}

// Add this function if you want to update the displayed cart count
function updateCartCount() {
	fetch('/cart')
		.then((response) => response.json())
		.then((cartItems) => {
			const cartCountElement = document.getElementById('cart-count');
			if (cartCountElement) {
				cartCountElement.textContent = `Cart (${cartItems.reduce(
					(total, item) => total + item.quantity,
					0
				)})`;
			}
		})
		.catch((error) => console.error('Error:', error));
}

function handleCheckout() {
	fetch('/checkout', {
		method: 'POST',
	})
		.then((response) => response.text())
		.then((message) => {
			alert(message); // Show a confirmation message to the user
			showCart(); // Update the cart display, which should now be empty
		})
		.catch((error) => {
			console.error('Error:', error);
		});
}
