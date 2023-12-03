# REFA E-commerce Platform (BETA)

Welcome to the REFA e-commerce platform project repository. This project is designed to provide a seamless online shopping experience for professional clientele, complete with user authentication, product listings, a shopping cart, and order processing.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (Download and install from [Node.js official website](https://nodejs.org/))
  PS: Make sure to select dropdowns corresponding to your environment and devices

- MySQL (Download and install from [MySQL official website](https://dev.mysql.com/downloads/mysql/))
  PS: Make sure to select dropdowns corresponding to your environment and devices

- A text editor like Visual Studio Code (Download from [VS Code official website](https://code.visualstudio.com/))
  PS: Make sure to select dropdowns corresponding to your environment and devices

- MySQL Workbench (Download and install from [MySQL official website](https://dev.mysql.com/downloads/workbench/))
  PS: Make sure to select dropdowns corresponding to your environment and devices

## Installation

To install REFA, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/ethxlol/publicRefa.git
```

2. Navigate to the project directory with bash:

cd c:/path/to/directory

3. Installing dependencies and packages:

npm install

## Configuration

1. Create the .env in the root of the project:

DB_HOST=localhost

DB_USER=your_username_here

DB_PASS=your_password_here

DB_NAME=database_name_here

DB_SECRET=secret_here

EMAIL_USERNAME=your_transporter_here@gmail.com (This is the transporter email)

EMAIL_PASSWORD=app pass here ! (This is an app password from google connected to a gmail account, this is to be able to use the Oauht2)

ADMIN_EMAIL=admin_emil@gmail.com (this is the email that will recieve the order pick list at the same time the user gets the confirmation email)

## Usage

1. To run the project execute the following command:

npm start

## Database

1. To setup the database for this program we need to do some setup in mySqlWorkbench:

The server name should be the on corresponding to the .env

We should append a user to the database called what you have in the .env, with all the privileges to it, and the password is whatever you put in the .env as DB_PASS.

2. Creating the tables:

To create the tables we have to run in bash "node dbSetup.js"

## mySqlWorkbench

1. Appending users:

After the table creations from the dbSetup file, you will need to append the info, the way this app is setup the data from the users will be inserted from the registration process.

However we need to set the users type_price to correspond with the pricing of each individual user:

UPDATE users
SET user_type = 'exampleType'
WHERE id = [users_Id]

The users should have:
id
username
email
password
created_at
user_type
delivery_address

2. Appending the type_prices:

The type prices is where we are adding the price of each product, this will correspond with the id of the items in the store.

You can create however many users_types you would like, and this user type is what you will append to the user in the user_type column

type_prices:
INSERT INTO `dbName`.`type_prices` (`id`, `user_type`, `product_id`, `price`) VALUES ('1', 'testType', '1', '99.99');

The type_prices should have:
id
user_type
product_id
price

3. Appending the products:

The products are the products you would like to have in the store at one time, the products are pretty straight forward and will have the price changed dynamically based on the user that is logged inn at any time.

The images should be appended directly in the server with a url.

sql:

UPDATE products
SET image_url = 'http://example.com/path/to/image.jpg'
WHERE id = [product_id]

The products should have:
id
name
description
price
quantity
image_url

This program is still in BETA, there are some small bugs to figure out, some more security to add and styling.
