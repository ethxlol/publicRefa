document.addEventListener('DOMContentLoaded', function () {
	fetch('/products')
		.then((response) => response.json())
		.then((products) => {
			const productList = document.getElementById('product-list');
			products.forEach((product) => {
				const imageUrl = product.image_url || 'path/to/default/image.jpg'; // Fallback to default image if image_url is not present
				const price = parseFloat(product.price);
				const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2); // Format price or set to 'N/A' if not a number

				const productElement = document.createElement('div');
				productElement.className = 'product';
				productElement.innerHTML = `
									<style>
											/* Your existing styles */
									</style>
									<img src="${imageUrl}" alt="${product.name}" class="thumbnail" />
									<h3>${product.name}</h3>
									<p>${product.description}</p>
									<p>Price: $${formattedPrice}</p>
									<label for="quantity_${product.id}">Quantity:</label>
									<input type="number" id="quantity_${product.id}" value="1" min="1">
									<button onclick="handleAddToCart(${product.id})">Add to Cart</button>
							`;
				productList.appendChild(productElement);
				console.log(product); // Debug: Log the product object to see if image_url is present
			});
		})
		.catch((error) => console.error('Error:', error));
});

function showAddToCartMessage() {
	const messageDiv = document.getElementById('add-to-cart-message');
	messageDiv.style.display = 'block';

	// Hide the message after 3 seconds
	setTimeout(() => {
		messageDiv.style.display = 'none';
	}, 3000);
}

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
			showAddToCartMessage();
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
					const price = parseFloat(item.price);
					const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2); // Format price or set to 'N/A' if not a number

					const itemElement = document.createElement('div');
					itemElement.className = 'cart-item';
					itemElement.innerHTML = `
											<p>${item.name} - $${formattedPrice} x ${item.quantity}</p>
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
