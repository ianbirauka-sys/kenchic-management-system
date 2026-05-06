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

## Features

### Customer Portal
- Browse and search products
- Add items to cart with localStorage persistence
- Secure checkout with M-Pesa integration
- Order tracking and history
- Customer support interface

### Farmer Portal
- Browse chick catalog
- Place chick orders with multi-step checkout
- Access farming resources and guides
- Order tracking and management

### Employee Portal
- Order management and status updates
- Stock level monitoring and updates
- Delivery scheduling and tracking
- Sales and inventory reports

### UI/UX Highlights
- Consistent hero sections across all portals with gradient backgrounds
- Responsive design with mobile-first approach
- Role-based navigation and access control
- Modern card-based layouts with rounded corners
- Professional typography using Playfair Display font

---

## Recent Updates

- ✅ **UI Consistency**: Applied uniform hero section styling across all customer pages (Products, Cart, Order Tracking) matching the farmer portal design
- ✅ **Cart Functionality**: Fixed localStorage key synchronization for persistent cart data
- ✅ **Navigation**: Removed duplicate navbar components and ensured consistent PageWrapper usage
- ✅ **Build Optimization**: Successful production builds with proper chunking and minification

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

---

## Development

### Scripts
```bash
# Backend
cd kenchic-backend
npm run dev          # Start development server
npm test            # Run tests

# Frontend
cd kenchic-frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Environment Variables
- **Backend**: Create `.env` with DB credentials, JWT secret, and M-Pesa API keys
- **Frontend**: Set `VITE_API_BASE_URL` to backend URL

---

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License
This project is part of BBIT 3.2 coursework at JKUAT.