# 🐔 Kenchic Management system

A full-stack web application for Kenya's poultry industry — connecting **customers**, **farmers**, and **employees** on a single platform with M-Pesa payment integration.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Roles & Portals](#roles--portals)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Team Responsibilities](#team-responsibilities)

---

## Overview

Kenchic is a multi-role platform with three distinct portals:

| Portal | Role | Key Actions |
|--------|------|-------------|
| **Customer** | `customer` | Browse & buy poultry products, track orders, M-Pesa checkout |
| **Farmer** | `farmer` | Order day-old chicks, manage deliveries, access farming guides |
| **Employee** | `employee` | Manage all orders, stock inventory, plan deliveries, view reports |

After login, users are automatically redirected to their role-specific portal. The `/customer/products` page is publicly accessible (browsing without an account is allowed; checkout requires login).

---

## Tech Stack

### Frontend
- **React 18** with React Router v6
- **Vite** for bundling and dev server
- **Tailwind CSS** (utility classes) + inline styles for component-level theming
- **Recharts** for analytics charts (sales over time, stock levels)
- **Axios** for API calls with automatic JWT attachment and 401 redirect handling
- **Google Fonts** — Playfair Display (headings) + DM Sans (body)

### Backend (expected)
- **Node.js + Express**
- **JWT** authentication — token carries `user.role` for access control
- **MySQL / PostgreSQL** relational database
- **Safaricom Daraja API** for M-Pesa STK Push payments

---

## Roles & Portals

### 🛒 Customer Portal (`/customer/*`)

| Screen | Route | Auth Required |
|--------|-------|---------------|
| Product Listing | `/customer/products` | No (public) |
| Cart | `/customer/cart` | Yes |
| Order Tracking | `/customer/orders` | Yes |
| Customer Support | `/customer/support` | Yes |

**Checkout flow:**
1. Add items to cart (stored in `localStorage` as `kenchic_cart`)
2. Choose delivery or pickup, enter address
3. Place order → receive `order_id`
4. Enter M-Pesa phone → STK Push sent
5. App polls `/payments/status/:checkoutRequestId` every 5 seconds (up to 12 retries / 60 seconds)
6. On `completed` status → confirmation screen

---

### 🌾 Farmer Portal (`/farmer/*`)

| Screen | Route | Auth Required |
|--------|-------|---------------|
| Chick Catalog | `/farmer/chicks` | Yes |
| Order Chicks | `/farmer/order` | Yes |
| Resources & Guides | `/farmer/resources` | Yes |

**Order flow** (4-step wizard):
1. Select chick breed
2. Enter quantity, delivery/pickup, address
3. Pay via M-Pesa STK Push
4. Order confirmation

Farmer cart is stored in `localStorage` as `farmer_cart`.

---

### 👷 Employee Dashboard (`/employee/*`)

| Screen | Route | Auth Required |
|--------|-------|---------------|
| All Orders | `/employee/orders` | Yes (`employee` only) |
| Stock Management | `/employee/stock` | Yes (`employee` only) |
| Delivery Planning | `/employee/deliveries` | Yes (`employee` only) |
| Reports & Analytics | `/employee/reports` | Yes (`employee` only) |

**Reports page** shows:
- Revenue line chart (last 30 days)
- Daily orders bar chart
- Stock level horizontal bar chart (colour-coded: green / amber / red)
- Summary cards: total revenue, total orders, average order value, low-stock alerts

---

## Project Structure

```
src/
├── api/
│   ├── auth.api.js          # register, login, getMe
│   ├── customer.api.js      # products, orders, inquiries
│   ├── employee.api.js      # orders, stock, deliveries, reports
│   ├── farmer.api.js        # chicks, farmer orders, resources
│   ├── payment.api.js       # initiatePayment, checkPaymentStatus
│   └── axios.js             # base Axios instance with JWT interceptor
│
├── context/
│   └── AuthContext.jsx      # user, token, login(), logout(), loading
│
├── components/
│   ├── Navbar.jsx           # role-aware sticky navbar with mobile menu
│   └── PageWrapper.jsx      # layout shell wrapping all authenticated pages
│
└── pages/
    ├── auth/
    │   ├── Login.jsx
    │   └── Register.jsx
    ├── customer/
    │   ├── Products.jsx      # public product grid + guest/auth navbar
    │   ├── Cart.jsx          # cart → checkout → M-Pesa → confirmation
    │   ├── OrderTracking.jsx # order list with progress stepper
    │   └── CustomerSupport.jsx
    ├── farmer/
    │   ├── ChickCatalog.jsx  # chick cards with floating order CTA
    │   ├── FarmerOrder.jsx   # 4-step order + payment wizard
    │   └── Resources.jsx     # guides, tips, notices tabs
    └── employee/
        ├── Orders.jsx        # filterable orders table with inline status update
        ├── StockManagement.jsx # inventory table + add product modal
        ├── Deliveries.jsx    # delivery scheduling + status tracking
        └── Reports.jsx       # Recharts analytics dashboard
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (see [Environment Variables](#environment-variables))

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For the backend, you'll need:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kenchic
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Safaricom Daraja (M-Pesa)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/callback
```

---

## API Reference

All requests to protected routes must include:

```
Authorization: Bearer <token>
```

The JWT payload includes `{ id, name, email, role }`. Role-based middleware checks `user.role` against `allowedRoles` for each route group.

---

### Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/auth/register` | `{ name, email, password, role }` | `{ user, token }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user, token }` |
| `GET` | `/api/auth/me` | — | `{ user }` |

---

### Customer

| Method | Endpoint | Auth | Body / Params | Response |
|--------|----------|------|---------------|----------|
| `GET` | `/api/customer/products` | No | — | `{ data: Product[] }` |
| `GET` | `/api/customer/products/:id` | No | — | `{ data: Product }` |
| `POST` | `/api/customer/orders` | Yes | `{ items, delivery_address, order_type }` | `{ data: { order_id } }` |
| `GET` | `/api/customer/orders` | Yes | — | `{ data: Order[] }` |
| `POST` | `/api/customer/inquiries` | Yes | `{ name, email, phone, inquiry_type, order_id, message }` | `{ message }` |

---

### Farmer

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| `GET` | `/api/farmer/chicks` | Yes | — | `{ data: Chick[] }` |
| `POST` | `/api/farmer/orders` | Yes | `{ chick_id, quantity, delivery_type, delivery_address, notes }` | `{ data: { order_id } }` |
| `GET` | `/api/farmer/orders` | Yes | — | `{ data: Order[] }` |
| `GET` | `/api/farmer/resources` | Yes | — | `{ data: Resource[] }` |

---

### Employee

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| `GET` | `/api/employee/orders` | Yes (employee) | — | `{ data: Order[] }` |
| `PATCH` | `/api/employee/orders/:id/status` | Yes (employee) | `{ status }` | `{ data: Order }` |
| `GET` | `/api/employee/stock` | Yes (employee) | — | `{ data: Product[] }` |
| `PATCH` | `/api/employee/stock/:id` | Yes (employee) | `{ stock_quantity }` | `{ data: Product }` |
| `POST` | `/api/employee/products` | Yes (employee) | `{ name, description, price, category, stock_quantity }` | `{ data: Product }` |
| `GET` | `/api/employee/deliveries` | Yes (employee) | — | `{ data: Delivery[] }` |
| `POST` | `/api/employee/deliveries` | Yes (employee) | `{ order_id, scheduled_date, driver_name }` | `{ data: Delivery }` |
| `GET` | `/api/employee/reports` | Yes (employee) | — | `{ data: { salesByDay, stockLevels } }` |

---

### Payments

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| `POST` | `/api/payments/initiate` | Yes | `{ order_id, phone_number }` | `{ data: { checkout_request_id } }` |
| `GET` | `/api/payments/status/:checkoutRequestId` | Yes | — | `{ data: { status } }` |

`status` values: `pending` · `completed` · `failed`

---

## Database Schema

### `users`
```sql
id, name, email, password_hash, role ENUM('customer','farmer','employee'),
phone, created_at
```

### `products`
```sql
id, name, description, price, category, stock_quantity, created_at
```

### `chicks`  *(farmer-specific product type)*
```sql
id, name, description, price_per_chick, stock_quantity, created_at
```

### `orders`
```sql
id, user_id, order_type ENUM('delivery','pickup'),
delivery_address, total_amount, status, payment_status,
created_at, updated_at
```

`status` values: `pending` → `confirmed` → `processing` → `shipped` → `delivered` | `cancelled`

### `order_items`
```sql
id, order_id, product_id, quantity, unit_price
```

### `farmer_orders`
```sql
id, farmer_id, chick_id, quantity, delivery_type,
delivery_address, notes, total_amount, status,
payment_status, created_at
```

### `deliveries`
```sql
id, order_id, driver_name, scheduled_date, status
ENUM('scheduled','in_transit','delivered','failed'),
created_at
```

### `resources`
```sql
id, title, description, file_url, created_at
```

### `inquiries`
```sql
id, user_id, name, email, phone, inquiry_type,
order_id, message, created_at
```

---

## Team Responsibilities

| Person | Area | Key Deliverables |
|--------|------|-----------------|
| **1** | Auth + Backend Structure | JWT middleware, role-based access, `/auth/register`, `/auth/login` |
| **2** | Customer Portal | Products, Cart, Checkout (M-Pesa), Order Tracking, Support |
| **3** | Farmer Portal | Chick Catalog, 4-step Order Wizard, Resources page |
| **4** | Employee Dashboard | Orders table, Stock Management, Deliveries, Recharts Reports |
| **5** | Database + API Contracts | ER diagram, shared API contract doc, integration testing |

> **Integration note:** The `AuthContext` provides `user`, `token`, `login()`, and `logout()` globally. The `axios.js` instance auto-attaches the Bearer token to every request and redirects to `/login` on a 401 response. All role-protected routes use the `ProtectedRoute` wrapper in `App.jsx`.

---

## Key Design Decisions

- **Cart persistence** — both customer and farmer carts are stored in `localStorage` so they survive page refreshes.
- **M-Pesa polling** — the frontend polls the payment status endpoint every 5 seconds with a maximum of 12 attempts (60-second timeout) before showing a failure state.
- **Public product page** — `/customer/products` is intentionally accessible without login. Guest users see "Sign in to Order" buttons; clicking triggers a redirect to `/login` with a `state.from` return path.
- **Role redirect on login** — after authentication, users are sent to their role's default route: `/customer/products`, `/farmer/chicks`, or `/employee/orders`.
- **Mobile nav** — the `Navbar` component includes a responsive hamburger menu for screens too narrow to show the full link row.