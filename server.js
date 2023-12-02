require('dotenv').config();

const mysql = require('mysql');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();

app.use(express.static('public'));
app.use(
	session({
		secret: process.env.DB_SECRET,
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
});

const nodemailer = require('nodemailer');
// const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;

// Create a transporter for nodemailer
let transporter = nodemailer.createTransport({
	service: 'gmail', // Replace with your email provider
	auth: {
		user: process.env.EMAIL_USERNAME, // Your email address
		pass: process.env.EMAIL_PASSWORD, // Your email password
	},
});

// Verify the transporter configuration
transporter.verify(function (error, success) {
	if (error) {
		console.log(error);
	} else {
		console.log('Server is ready to take our messages');
	}
});

db.connect((err) => {
	if (err) {
		console.error(
			'An error occurred while connecting to the DB: ' + err.message
		);
		return;
	}
	console.log('Connected to the database successfully!');
});

app.get('/', (req, res) => {
	if (req.session.userId) {
		res.redirect('/products-page');
	} else {
		res.sendFile(__dirname + '/index.html');
	}
});

app.post('/register', async (req, res) => {
	const { username, email, password } = req.body;
	if (!username || !email || !password) {
		return res.status(400).send('Invalid input');
	}
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		db.query(
			'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
			[username, email, hashedPassword],
			(err, result) => {
				if (err) {
					console.error(err);
					return res.status(500).send('Error registering new user');
				}
				res.redirect('/login');
			}
		);
	} catch (error) {
		console.error(error);
		res.status(500).send('Server error');
	}
});

app.post('/login', async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res.status(400).send('Invalid input');
	}
	try {
		db.query(
			'SELECT * FROM users WHERE username = ?',
			[username],
			async (err, results) => {
				if (err) {
					console.error(err);
					return res.status(500).send('Server error');
				}
				if (
					results.length === 0 ||
					!(await bcrypt.compare(password, results[0].password))
				) {
					res.status(401).send('Invalid credentials');
				} else {
					req.session.userId = results[0].id;
					res.redirect('/products-page');
				}
			}
		);
	} catch (error) {
		console.error(error);
		res.status(500).send('Server error');
	}
});

app.post('/add-to-cart', (req, res) => {
	const { productId, quantity } = req.body;
	if (!req.session.cart) {
		req.session.cart = [];
	}
	const existingProductIndex = req.session.cart.findIndex(
		(item) => item.productId === productId
	);
	if (existingProductIndex >= 0) {
		req.session.cart[existingProductIndex].quantity += quantity;
	} else {
		req.session.cart.push({ productId, quantity });
	}
	res.send('Product added to cart');
});

app.get('/cart', (req, res) => {
	res.json(req.session.cart || []);
});

app.post('/remove-from-cart', (req, res) => {
	const { productId } = req.body;
	if (req.session.cart) {
		req.session.cart = req.session.cart.filter(
			(item) => item.productId !== parseInt(productId, 10)
		);
		res.send('Product removed from cart');
	} else {
		res.status(400).send('Cart not found');
	}
});

app.post('/update-cart', (req, res) => {
	const { productId, quantity } = req.body;
	if (!req.session.cart) {
		res.status(400).send('No cart found');
	} else {
		const productIndex = req.session.cart.findIndex(
			(item) => item.productId === parseInt(productId, 10)
		);
		if (productIndex !== -1) {
			req.session.cart[productIndex].quantity = parseInt(quantity, 10);
			res.send('Cart updated successfully');
		} else {
			res.status(404).send('Product not found in cart');
		}
	}
});

app.post('/checkout', (req, res) => {
	if (
		!req.session.userId ||
		!req.session.cart ||
		req.session.cart.length === 0
	) {
		return res.status(400).send('Cart is empty or user not logged in.');
	}

	// Fetch the user's email and username from the database
	db.query(
		'SELECT email, username FROM users WHERE id = ?',
		[req.session.userId],
		(err, userResults) => {
			if (err) {
				console.error('Error fetching user details: ', err);
				return res.status(500).send('Internal Server Error');
			}
			if (userResults.length === 0) {
				return res.status(404).send('User not found');
			}

			const userEmail = userResults[0].email;
			const userName = userResults[0].username;
			const userId = req.session.userId;
			const orderDateTime = new Date().toISOString();

			// Fetch the details of the products in the cart
			const productIds = req.session.cart.map((item) => item.productId);
			const placeholders = productIds.map(() => '?').join(',');
			const productDetailsQuery = `SELECT id, name, price FROM products WHERE id IN (${placeholders})`;

			db.query(productDetailsQuery, productIds, (err, products) => {
				if (err) {
					console.error('Error fetching product details: ', err);
					return res.status(500).send('Error fetching product details');
				}

				let emailMessageHtml = `<h1>Order Confirmation</h1>`;
				emailMessageHtml += `<p>User ID: ${userId}</p>`;
				emailMessageHtml += `<p>User Name: ${userName}</p>`;
				emailMessageHtml += `<p>Order Date & Time: ${orderDateTime}</p>`;
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

				// Email options for the customer
				const customerEmailOptions = {
					from: process.env.EMAIL_USERNAME,
					to: userEmail,
					subject: 'Order Confirmation',
					html: emailMessageHtml,
				};

				// Email options for the admin
				const adminEmailOptions = {
					from: process.env.EMAIL_USERNAME,
					to: process.env.ADMIN_EMAIL, // Admin's email
					subject: `New Order from ${userName} (User ID: ${userId})`,
					html: emailMessageHtml,
				};

				// Send the email to the customer
				transporter.sendMail(customerEmailOptions, (error, info) => {
					if (error) {
						console.error('Error sending email to customer: ', error);
						return res
							.status(500)
							.send('Error sending order confirmation email to customer.');
					} else {
						console.log('Email sent to customer: ' + info.response);

						// Send the email to the admin
						transporter.sendMail(adminEmailOptions, (error, info) => {
							if (error) {
								console.error('Error sending email to admin: ', error);
								// Not returning here to allow for customer email success message
							} else {
								console.log('Email sent to admin: ' + info.response);
							}
						});

						req.session.cart = []; // Clear the cart after sending the email
						return res.send(
							'Thank you for your purchase! An order confirmation has been sent to your email.'
						);
					}
				});
			});
		}
	);
});

app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(400).send('Unable to log out');
		}
		res.redirect('/');
	});
});

app.get('/register', (req, res) => {
	res.sendFile(__dirname + '/register.html');
});

app.get('/login', (req, res) => {
	res.sendFile(__dirname + '/login.html');
});

app.get('/products', (req, res) => {
	if (!req.session.userId) {
		return res.status(401).send('Please log in to view products');
	}
	const userTypeQuery = 'SELECT user_type FROM users WHERE id = ?';
	db.query(userTypeQuery, [req.session.userId], (err, userTypeResults) => {
		if (err) {
			console.error(err);
			return res.status(500).send('Error fetching user type');
		}
		if (userTypeResults.length === 0) {
			return res.status(404).send('User not found');
		}
		const userType = userTypeResults[0].user_type;
		const userSpecificPriceQuery = `
            SELECT p.id, p.name, p.description, p.quantity, 
                   COALESCE(tp.price, p.price) AS price
            FROM products p
            LEFT JOIN type_prices tp ON p.id = tp.product_id AND tp.user_type = ?
        `;
		db.query(userSpecificPriceQuery, [userType], (err, products) => {
			if (err) {
				console.error(err);
				return res
					.status(500)
					.send('Error fetching products with user-specific prices');
			}
			res.json(products);
		});
	});
});

app.get('/products-page', (req, res) => {
	if (req.session.userId) {
		res.sendFile(__dirname + '/products.html');
	} else {
		res.redirect('/login');
	}
});

app.get('/cart-details', (req, res) => {
	if (!req.session.cart || req.session.cart.length === 0) {
		return res.json([]);
	}
	const productIds = req.session.cart.map((item) => item.productId);
	if (productIds.length === 0) {
		return res.json([]);
	}
	const placeholders = productIds.map(() => '?').join(',');
	const productDetailsQuery = `SELECT id, name, price FROM products WHERE id IN (${placeholders})`;
	db.query(productDetailsQuery, productIds, (err, products) => {
		if (err) {
			console.error('Error fetching product details: ', err);
			return res.status(500).send('Error fetching product details');
		}
		const cartWithDetails = req.session.cart.map((cartItem) => {
			const product = products.find((p) => p.id === cartItem.productId);
			return {
				...cartItem,
				name: product ? product.name : 'Unknown',
				price: product ? product.price : 0,
			};
		});
		res.json(cartWithDetails);
	});
});

app.get('/checkout', (req, res) => {
	if (req.session.userId) {
		res.sendFile(__dirname + '/checkout.html');
	} else {
		res.redirect('/login'); // Redirect to login if not logged in
	}
});

// Serve the order confirmation page
app.get('/confirmation', (req, res) => {
	res.sendFile(__dirname + '/confirmation.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
