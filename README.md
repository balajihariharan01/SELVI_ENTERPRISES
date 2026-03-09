# Selvi Enterprise - Steel & Cement Management System

A full-stack e-commerce platform for construction materials (Steel & Cement) built with the MERN stack + Vite.

## 🏗️ Tech Stack

### Backend

- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend

- React 18 with Vite
- React Router v6
- Context API for state management
- Axios for API calls
- React Hot Toast for notifications
- React Icons

## 📁 Project Structure

```
selvi-enterprise/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── userRoutes.js
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   │   └── AdminLayout.jsx
    │   │   ├── layout/
    │   │   │   ├── Footer.jsx
    │   │   │   └── Navbar.jsx
    │   │   ├── AdminRoute.jsx
    │   │   ├── ProductCard.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── CartContext.jsx
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── CustomerRecords.jsx
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── OrderManagement.jsx
    │   │   │   └── ProductManagement.jsx
    │   │   ├── user/
    │   │   │   ├── Cart.jsx
    │   │   │   ├── Checkout.jsx
    │   │   │   ├── MyOrders.jsx
    │   │   │   ├── OrderDetail.jsx
    │   │   │   └── Profile.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── Products.jsx
    │   │   └── Register.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── orderService.js
    │   │   ├── productService.js
    │   │   └── userService.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas connection string)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   cd c:\balaji\final\selvi-enterprise
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**

   Create/update `.env` file in the backend directory:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/selvi-enterprise
   JWT_SECRET=your-super-secret-jwt-key-selvi-enterprise-2024
   NODE_ENV=development
   ```

4. **Seed the Database**

   ```bash
   npm run seed
   ```

   This will create:

   - Admin user: `admin@selvi.com` / `admin123`
   - Sample customer: `customer@test.com` / `password123`
   - Sample products (cement & steel)

5. **Start Backend Server**

   ```bash
   npm run dev
   ```

   Backend runs on http://localhost:5000

6. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:3000

## 👤 User Roles

### Customer (Buyer)

- Browse products (cement & steel)
- Add items to cart
- Place orders with delivery address
- Track order status
- View order history
- Manage profile

### Admin (Owner)

- Dashboard with statistics
- Manage products (CRUD operations)
- Update stock levels
- View and manage all orders
- Update order status
- View customer records

## 📋 Features

### Public Features

- Home page with featured products
- Product catalog with filters
- Product details page
- User registration and login

### Customer Features

- Shopping cart with quantity management
- Checkout with delivery address
- Order confirmation
- Order history and tracking
- Profile management

### Admin Features

- Dashboard with key metrics
- Product management (add/edit/delete)
- Stock alerts (low stock, out of stock)
- Order management with status updates
- Customer records and statistics

## 🎨 Theme

- Primary Color: Blue (#1e40af)
- Clean white background
- Construction-trust aesthetic
- Responsive design

## 📱 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products

- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (admin)
- `PUT /api/orders/:id/status` - Update status (admin)

### Users (Admin)

- `GET /api/users` - Get all users
- `GET /api/users/customers` - Get all customers
- `GET /api/users/:id` - Get single user

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected routes

## 📄 License

MIT License

---

**Selvi Enterprise** - Quality Steel & Cement for Your Construction Needs 🏗️
