# Manan Accessories

A complete full-stack eCommerce website for premium accessories with a React customer store, secure owner dashboard, Node.js/Express API, MongoDB database, JWT admin login, image uploads, UPI QR/payment link settings, order management, and payment verification workflow.

## Features

- Premium responsive customer website
- Product listing, search, categories, product details
- Add to cart, buy now, checkout, order success
- Customer details: name, phone, email, address
- UPI QR payment, payment link, payment screenshot upload
- Separate owner login portal
- JWT-protected admin dashboard
- Add, edit, delete products
- Upload product images
- Manage product price, discount, category, stock, description
- View orders, customer details, payment screenshots, payment status
- Add or update payment QR code and payment link

## Folder Structure

```text
Manan Accessories/
  backend/
    src/
      config/
      middleware/
      models/
      routes/
      uploads/
      server.js
      seedAdmin.js
    package.json
    .env.example
  frontend/
    src/
      components/
      context/
      pages/
      services/
      styles/
      App.jsx
      main.jsx
    package.json
    index.html
    vite.config.js
```

## Setup

1. Install MongoDB locally or create a MongoDB Atlas database.
2. Open a terminal in this folder.
3. Install dependencies:

```bash
npm install
npm run install:all
```

4. Create `backend/.env` from `backend/.env.example` and update values.
5. Create the first owner account:

```bash
npm run seed
```

6. Start both frontend and backend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:5000`

## Default Admin

The seed script uses these values unless you change them in `.env`:

- Email: `owner@mananaccessories.com`
- Password: `@himanshi3`

Change the password before using the site publicly.

## Optional Online Payment Gateway

This project includes manual UPI QR/payment link checkout plus screenshot verification. Razorpay or Stripe can be added later by creating a payment order on the backend and confirming webhook events before marking orders paid.
