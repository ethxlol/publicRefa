# REFA E-commerce Platform

Welcome to the REFA e-commerce platform project repository. This project is designed to provide a seamless online shopping experience for professional clientele, complete with user authentication, product listings, a shopping cart, and order processing.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (Download and install from [Node.js official website](https://nodejs.org/))

- MySQL (Download and install from [MySQL official website](https://dev.mysql.com/downloads/mysql/))

- A text editor like Visual Studio Code (Download from [VS Code official website](https://code.visualstudio.com/))

- MySQL Workbench (Download and install from [MySQL official website](https://dev.mysql.com/downloads/workbench/))

## Installation

To install REFA, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/ethxlol/refa.git
```

2. Navigate to the project directory with bash:

cd c:/path/to/directory

3. Installing dependencies and packages:

npm install

## Configuration

1. Create the .env in the root of the project:

DB_HOST=localhost
DB_USER=refa
DB_PASS=refa1234
DB_NAME=REFA
DB_SECRET=refa1212
EMAIL_USERNAME=refatest1@gmail.com (This is the transporter email)
EMAIL_PASSWORD=rsjq vnze gfut kcvn (This is an app password from google connected to a gmail account, this is to be able to use the Oauht2)
ADMIN_EMAIL=refatest1@gmail.com (this is the email that will recieve the order pick list at the same time the user gets the confirmation email)

## Usage

1. To run the project execute the following command:

npm start

## Database

1. To setup the database for this program we need to do some setup in mySqlWorkbench:

The server name should be REFA

We should append a user to the database called refa, with all the privileges to it, and the password is whatever you put in the .env as DB_PASS.

2. Creating the tables:

To create the tables we have to run in bash "node dbSetup.js"

## mySqlWorkbench

1. Appending users:

In the database REFA insert the users in the columns of the user table with the corresponding information about the user, the user_type will determine the price the user is retrieving on the products on the page.

The users should have:
id
username
email
password
created_at
user_type

2. Appending the type_prices:

The type prices is where we are adding the price of each product, this will correspond with the id of the items in the store.

You can create however many users_types you would like, and this user type is what you will append to the user in the user_type column

The type_prices should have:
id
user_type
product_id
price

3. Appending the products:

The products are the products you would like to have in the store at one time, the products are pretty straight forward and will have the price changed dynamically based on the user that is logged inn at any time.

The products should have:
id
name
description
price
quantity
