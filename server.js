require('dotenv').config(); // Load environment variables from .env file

const mysql = require('mysql2'); // MySQL client for Node.js
const express = require('express'); // Express framework for Node.js
const bcrypt = require('bcrypt'); // Library for hashing passwords
const session = require('express-session'); // Session middleware for Express
const app = express(); // Create an instance of Express

app.set('view engine', 'ejs'); // Set EJS as the template engine
// app.set('views', path.join(__dirname, '/views')); // Set the views directory (commented out)

app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(
	session({
		secret: process.env.DB_SECRET, // Secret key for session encryption
		resave: false, // Don't save session if unmodified
		saveUninitialized: true, // Save uninitialized sessions
		cookie: { secure: false }, // Cookie settings
	})
);
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Set up MySQL database connection
const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
});

const nodemailer = require('nodemailer'); // Node.js library for email sending
// const { google } = require('googleapis'); // Google APIs client library (commented out)
// const OAuth2 = google.auth.OAuth2; // OAuth2 client for authentication (commented out)

// Configure the email transporter using nodemailer
let transporter = nodemailer.createTransport({
	service: 'gmail', // Email service provider
	auth: {
		user: process.env.EMAIL_USERNAME, // Email address for sending emails
		pass: process.env.EMAIL_PASSWORD, // Email password
	},
});

// Verify the transporter configuration
transporter.verify(function (error, success) {
	if (error) {
		console.log(error); // Log any errors with the transporter
	} else {
		console.log('Server is ready to take our messages'); // Confirmation if successful
	}
});

// Connect to the MySQL database
db.connect((err) => {
	if (err) {
		console.error(
			'An error occurred while connecting to the DB: ' + err.message
		);
		return;
	}
	console.log('Connected to the database successfully!');
});

// Route for the home page
app.get('/', (req, res) => {
	if (req.session.userId) {
		res.redirect('/products-page'); // Redirect to products page if logged in
	} else {
		res.render('index'); // Render the index view if not logged in
	}
});

// Route for user registration
app.post('/register', async (req, res) => {
	const { username, email, password, delivery_address } = req.body;
	if (!username || !email || !password || !delivery_address) {
		return res.status(400).send('Invalid input'); // Check for valid input
	}
	try {
		const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
		// Insert new user into the database
		db.query(
			'INSERT INTO users (username, email, password, delivery_address) VALUES (?, ?, ?, ?)',
			[username, email, hashedPassword, delivery_address],
			(err, result) => {
				if (err) {
					console.error(err); // Log any errors
					return res.status(500).send('Error registering new user');
				}
				res.redirect('/login'); // Redirect to login after successful registration
			}
		);
	} catch (error) {
		console.error(error); // Log any errors during hashing
		res.status(500).send('Server error');
	}
});

// Route for user login
app.post('/login', async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res.status(400).send('Invalid input'); // Check for valid input
	}
	try {
		// Query the database for the user
		db.query(
			'SELECT * FROM users WHERE username = ?',
			[username],
			async (err, results) => {
				if (err) {
					console.error(err); // Log any database errors
					return res.status(500).send('Server error');
				}
				if (
					results.length === 0 ||
					!(await bcrypt.compare(password, results[0].password))
				) {
					res.status(401).send('Invalid credentials'); // Handle incorrect login
				} else {
					req.session.userId = results[0].id; // Set the user session
					res.redirect('/products-page'); // Redirect to products page
				}
			}
		);
	} catch (error) {
		console.error(error); // Log any errors
		res.status(500).send('Server error');
	}
});

// Route for user logout
app.post('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Logout error: ', err); // Log any logout errors
			return res.status(500).send('Error while logging out');
		}
		res.redirect('/login'); // Redirect to the login page after logout
	});
});

// Route for adding an item to the cart
app.post('/add-to-cart', (req, res) => {
	const { productId, quantity } = req.body;
	if (!req.session.cart) {
		req.session.cart = []; // Initialize the cart if it doesn't exist
	}
	const existingProductIndex = req.session.cart.findIndex(
		(item) => item.productId === productId
	);
	if (existingProductIndex >= 0) {
		req.session.cart[existingProductIndex].quantity += quantity; // Update quantity if product already in cart
	} else {
		req.session.cart.push({ productId, quantity }); // Add new product to the cart
	}
	res.send('Product added to cart'); // Confirm addition to cart
});

// Route for viewing the cart
app.get('/cart', (req, res) => {
	res.json(req.session.cart || []); // Return the cart contents or an empty array
});

// Route for removing an item from the cart
app.post('/remove-from-cart', (req, res) => {
	const { productId } = req.body;
	if (req.session.cart) {
		req.session.cart = req.session.cart.filter(
			(item) => item.productId !== parseInt(productId, 10)
		); // Remove the item from the cart
		res.send('Product removed from cart'); // Confirm removal from cart
	} else {
		res.status(400).send('Cart not found'); // Handle case where cart doesn't exist
	}
});

// Route for updating the cart
app.post('/update-cart', (req, res) => {
	const { productId, quantity } = req.body;
	if (!req.session.cart) {
		res.status(400).send('No cart found'); // Handle case where cart doesn't exist
	} else {
		const productIndex = req.session.cart.findIndex(
			(item) => item.productId === parseInt(productId, 10)
		);
		if (productIndex !== -1) {
			req.session.cart[productIndex].quantity = parseInt(quantity, 10); // Update the cart with new quantity
			res.send('Cart updated successfully'); // Confirm cart update
		} else {
			res.status(404).send('Product not found in cart'); // Handle case where product not in cart
		}
	}
});

// Route for handling the checkout process
app.post('/checkout', (req, res) => {
	if (
		!req.session.userId ||
		!req.session.cart ||
		req.session.cart.length === 0
	) {
		return res.status(400).send('Cart is empty or user not logged in.'); // Validate user and cart existence
	}

	// Retrieve user details from the database for order processing
	db.query(
		'SELECT email, username, delivery_address FROM users WHERE id = ?',
		[req.session.userId],
		(err, userResults) => {
			if (err) {
				console.error('Error fetching user details: ', err); // Log database errors
				return res.status(500).send('Internal Server Error'); // Handle server errors
			}
			if (userResults.length === 0) {
				return res.status(404).send('User not found'); // Handle user not found scenario
			}
			// Extract user details for order processing
			const {
				delivery_address: userDeliveryAddress,
				email: userEmail,
				username: userName,
			} = userResults[0];
			const userId = req.session.userId;
			const orderDateTime = new Date().toISOString();

			// Construct query to fetch product details based on items in cart
			const productIds = req.session.cart.map((item) => item.productId);
			const placeholders = productIds.map(() => '?').join(',');
			const productDetailsQuery = `SELECT id, name, price, image_url FROM products WHERE id IN (${placeholders})`;

			// Execute query to fetch product details
			db.query(productDetailsQuery, productIds, (err, products) => {
				if (err) {
					console.error('Error fetching product details: ', err); // Log database errors
					return res.status(500).send('Error fetching product details'); // Handle server errors
				}

				// Prepare the email content with order details
				let emailMessageHtml = `<h1>Order Confirmation</h1>`;
				emailMessageHtml += `<p>User ID: ${userId}</p>`;
				emailMessageHtml += `<p>User Name: ${userName}</p>`;
				emailMessageHtml += `<p>Order Date & Time: ${orderDateTime}</p>`;
				emailMessageHtml += `<p>Delivery Address: ${userDeliveryAddress}</p>`;
				emailMessageHtml += `<ul>`;

				let total = 0;
				req.session.cart.forEach((cartItem) => {
					const product = products.find((p) => p.id === cartItem.productId);
					const lineTotal = cartItem.quantity * (product ? product.price : 0);
					total += lineTotal;
					emailMessageHtml += `<li>${
						product ? product.name : 'Unknown Product'
					} - $${product ? product.price.toFixed(2) : '0.00'} x ${
						cartItem.quantity
					} = $${lineTotal.toFixed(2)}</li>`;
				});

				emailMessageHtml += `</ul>`;
				emailMessageHtml += `<p>Total: $${total.toFixed(2)}</p>`;

				// Define email options for sending to the customer
				const customerEmailOptions = {
					from: process.env.EMAIL_USERNAME,
					to: userEmail,
					subject: 'Order Confirmation',
					html: emailMessageHtml,
				};

				// Define email options for sending to the admin
				const adminEmailOptions = {
					from: process.env.EMAIL_USERNAME,
					to: process.env.ADMIN_EMAIL, // Admin's email address
					subject: `New Order from ${userName} (User ID: ${userId})`,
					html: emailMessageHtml,
				};

				// Send order confirmation email to the customer
				transporter.sendMail(customerEmailOptions, (error, info) => {
					if (error) {
						console.error('Error sending email to customer: ', error); // Log email sending errors
						return res
							.status(500)
							.send('Error sending order confirmation email to customer.'); // Handle email sending errors
					} else {
						console.log('Email sent to customer: ' + info.response); // Log successful email delivery

						// Send notification email to the admin
						transporter.sendMail(adminEmailOptions, (error, info) => {
							if (error) {
								console.error('Error sending email to admin: ', error); // Log email sending errors
								// Continue to process despite admin email errors
							} else {
								console.log('Email sent to admin: ' + info.response); // Log successful email delivery
							}
						});

						req.session.cart = []; // Clear the cart after successful order processing
						return res.send(
							'Thank you for your purchase! An order confirmation has been sent to your email.'
						); // Send order confirmation to the user
					}
				});
			});
		}
	);
});

// Route for logging out the user
app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(400).send('Unable to log out'); // Handle errors during logout
		}
		res.redirect('/'); // Redirect to home page after successful logout
	});
});

// Route for rendering the registration page
app.get('/register', (req, res) => {
	res.render('register'); // Render the registration page
});

// Route for rendering the login page
app.get('/login', (req, res) => {
	res.render('login'); // Render the login page
});

// Route for fetching current logged-in user's username
app.get('/current-user', (req, res) => {
	if (req.session.userId) {
		db.query(
			'SELECT username FROM users WHERE id = ?',
			[req.session.userId],
			(err, results) => {
				if (err) {
					console.error('Error fetching user: ', err); // Log database errors
					return res.status(500).send('Internal Server Error'); // Handle server errors
				}
				if (results.length > 0) {
					return res.json({ username: results[0].username }); // Send username to the client
				}
			}
		);
	} else {
		res.status(401).send('Not logged in'); // Handle scenario when user is not logged in
	}
});

// Route for fetching products with dynamic pricing based on user type
app.get('/products', (req, res) => {
	if (!req.session.userId) {
		return res.status(401).send('Please log in to view products'); // Ensure user is logged in
	}
	// Query to get the user type of the logged-in user
	const userTypeQuery = 'SELECT user_type FROM users WHERE id = ?';
	db.query(userTypeQuery, [req.session.userId], (err, userTypeResults) => {
		if (err) {
			console.error(err); // Log database errors
			return res.status(500).send('Error fetching user type'); // Handle server errors
		}
		if (userTypeResults.length === 0) {
			return res.status(404).send('User not found'); // Handle user not found scenario
		}
		const userType = userTypeResults[0].user_type;

		// Query to fetch products with prices specific to user type
		const userSpecificPriceQuery = `
					SELECT p.id, p.name, p.description, p.quantity, p.image_url,
								 COALESCE(tp.price, p.price) AS price
					FROM products p
					LEFT JOIN type_prices tp ON p.id = tp.product_id AND tp.user_type = ?
			`;
		db.query(userSpecificPriceQuery, [userType], (err, products) => {
			if (err) {
				console.error(err); // Log database errors
				return res
					.status(500)
					.send('Error fetching products with user-specific prices'); // Handle server errors
			}
			res.json(products); // Send products data to the client
		});
	});
});

// Route for rendering the products page
app.get('/products-page', (req, res) => {
	if (req.session.userId) {
		res.render('products'); // Render the products page for logged-in users
	} else {
		res.redirect('/login'); // Redirect to login page if not logged in
	}
});

// Route for fetching detailed cart information
app.get('/cart-details', (req, res) => {
	if (!req.session.cart || req.session.cart.length === 0) {
		return res.json([]); // Return empty array if cart is empty
	}
	const productIds = req.session.cart.map((item) => item.productId);
	if (productIds.length === 0) {
		return res.json([]); // Return empty array if no product IDs are found
	}
	const placeholders = productIds.map(() => '?').join(',');
	// Query to fetch detailed information about products in the cart
	const productDetailsQuery = `SELECT id, name, description, price, quantity, image_url FROM products WHERE id IN (${placeholders})`;
	db.query(productDetailsQuery, productIds, (err, products) => {
		if (err) {
			console.error('Error fetching product details: ', err); // Log database errors
			return res.status(500).send('Error fetching product details'); // Handle server errors
		}
		// Map each cart item with additional product details
		const cartWithDetails = req.session.cart.map((cartItem) => {
			const product = products.find((p) => p.id === cartItem.productId);
			return {
				...cartItem,
				name: product ? product.name : 'Unknown',
				price: product ? product.price : 0,
			};
		});
		res.json(cartWithDetails); // Send detailed cart information to the client
	});
});

// Route for rendering the checkout page
app.get('/checkout', (req, res) => {
	if (req.session.userId) {
		res.render('checkout'); // Render the checkout page for logged-in users
	} else {
		res.redirect('/login'); // Redirect to login page if not logged in
	}
});

// Route for serving the order confirmation page
app.get('/confirmation', (req, res) => {
	res.render('confirmation'); // Render the order confirmation page
});

// Setting up the server to listen on a specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`); // Log the server's running status and port number
});
