# Kenchic Management System
BBIT 3.2 — Group 10A — JKUAT

A full-stack web platform for Kenchic with three portals: customer, farmer, and employee.

---

## Tech stack
- **Frontend** — React + Tailwind CSS (Vite)
- **Backend** — Node.js + Express
- **Database** — MySQL
- **Auth** — JWT with role-based access control

---

## Getting started

### 1. Clone the repo
```bash
git clone https://github.com/Brandon-Morision/kenchic-management-system.git
cd kenchic-management-system
```

### 2. Set up the database
- Open MySQL and run: `source kenchic-backend/config/schema.sql`
- This creates the `kenchic_db` database and all tables

### 3. Set up the backend
```bash
cd kenchic-backend
cp .env.example .env        # then fill in your DB credentials and JWT secret
npm install
npm run dev                 # runs on http://localhost:5000
```

### 4. Set up the frontend
```bash
cd kenchic-frontend
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                 # runs on http://localhost:5173
```

---

## API endpoints

| Method | URL | Role | Description |
|--------|-----|------|-------------|
| POST | /api/auth/register | public | Register a new user |
| POST | /api/auth/login | public | Login and get JWT token |
| GET | /api/auth/me | any | Get current user |
| GET | /api/customer/products | customer | List all products |
| GET | /api/customer/products/:id | customer | Get product detail |
| POST | /api/customer/orders | customer | Place an order |
| GET | /api/customer/orders | customer | Get my orders |
| GET | /api/farmer/chicks | farmer | List chick catalog |
| POST | /api/farmer/orders | farmer | Place chick order |
| GET | /api/farmer/orders | farmer | Get my orders |
| GET | /api/farmer/resources | farmer | Get guides/resources |
| GET | /api/employee/orders | employee | All orders |
| PATCH | /api/employee/orders/:id/status | employee | Update order status |
| GET | /api/employee/stock | employee | View stock levels |
| PATCH | /api/employee/stock/:id | employee | Update stock quantity |
| GET | /api/employee/deliveries | employee | View deliveries |
| POST | /api/employee/deliveries | employee | Schedule delivery |
| GET | /api/employee/reports | employee | Sales + stock reports |

---

## Auth headers
All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

## User roles
- `customer` — can browse products and place orders
- `farmer` — can browse chicks and place chick orders
- `employee` — full access to orders, stock, deliveries, and reports

---

## Project structure
```
kenchic-management-system/
├── kenchic-backend/
│   ├── config/         # DB connection + schema.sql
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth + role middleware
│   ├── models/         # DB query functions
│   ├── routes/         # Express routes
│   ├── utils/          # JWT + response helpers
│   └── server.js
└── kenchic-frontend/
    └── src/
        ├── api/        # All axios calls
        ├── context/    # Auth context
        ├── components/ # Shared UI components
        └── pages/      # auth / customer / farmer / employee
```