# REFA E-commerce Platform

Welcome to the REFA e-commerce platform project repository. This project is designed to provide a seamless online shopping experience for professional clientele, complete with user authentication, product listings, a shopping cart, and order processing.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (Download and install from [Node.js official website](https://nodejs.org/))
- MySQL (Download and install from [MySQL official website](https://www.mysql.com/))
- A text editor like Visual Studio Code (Download from [VS Code official website](https://code.visualstudio.com/))

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
EMAIL_USERNAME=refatest1@gmail.com
EMAIL_PASSWORD=rsjq vnze gfut kcvn
ADMIN_EMAIL=refatest1@gmail.com

## Usage

1. To run the project execute the following command:

npm start

## Database

1. To setup the database for this program we need to do some setup in mySqlWorkbench:

The server name should be REFA

We should append a user to the database called refa, with all the privileges to it, and the password is whatever you put in the .env as DB_PASS.

2. Creating the tables:

To create the tables we have to run in bash "node dbSetup.js"
