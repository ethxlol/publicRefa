require('dotenv').config();
const mysql = require('mysql');

// Database connection
const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
	if (err) {
		console.error('Error connecting to the database', err);
		return;
	}
	console.log('Connected to database');

	// SQL for creating 'products' table
	const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL
    );`;

	// SQL for creating 'type_prices' table
	const createTypePricesTable = `
    CREATE TABLE IF NOT EXISTS type_prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type ENUM('retail', 'wholesale', 'bigclient') NOT NULL,
      product_id INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );`;

	// SQL for creating 'users' table
	const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_type ENUM('retail', 'wholesale', 'bigclient') DEFAULT 'retail'
    );`;

	// Execute the queries to create tables
	db.query(createProductsTable, (err, result) => {
		if (err) throw err;
		console.log('Products table created');

		db.query(createTypePricesTable, (err, result) => {
			if (err) throw err;
			console.log('Type_prices table created');

			db.query(createUsersTable, (err, result) => {
				if (err) throw err;
				console.log('Users table created');

				// Optionally insert some initial data into 'products' table
				// const insertProducts = `
				//   INSERT INTO products (name, description, price, quantity) VALUES
				//   ('Sample Product 1', 'Description for product 1', 19.99, 100),
				//   ('Sample Product 2', 'Description for product 2', 29.99, 150);`;

				// Optionally insert some initial data into 'users' table
				// const insertUsers = `
				//   INSERT INTO users (username, email, password, user_type) VALUES
				//   ('john_doe', 'john@example.com', 'hashed_password', 'retail'),
				//   ('jane_doe', 'jane@example.com', 'hashed_password', 'wholesale');`;

				// Execute the queries to insert data
				// db.query(insertProducts, (err, result) => {
				// 	if (err) throw err;
				// 	console.log('Inserted sample products');

				// 	db.query(insertUsers, (err, result) => {
				// 		if (err) throw err;
				// 		console.log('Inserted sample users');

				// Close the connection once all queries are done
				db.end();
			});
		});
	});
});
// 	});
// });
