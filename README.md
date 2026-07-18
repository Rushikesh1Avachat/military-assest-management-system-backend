# 🛡️ Military Asset Management System (Backend)

A robust RESTful backend API for the Military Asset Management System built with **Node.js**, **Express.js**, **MongoDB**, and **JWT Authentication**. The backend manages military assets, user authentication, asset assignments, expenditures, and provides secure CRUD operations through REST APIs.

---

# 📌 Project Overview

The Military Asset Management System Backend serves as the core API for managing military resources and operations. It provides secure authentication, role-based access, asset management, assignment tracking, expenditure monitoring, and database operations using MongoDB.

---

# ✨ Features

- 🔐 JWT Authentication & Authorization
- 👤 User Registration & Login
- 🛡️ Role-Based Access Control (RBAC)
- 📦 Military Asset CRUD Operations
- 📋 Asset Assignment Management
- 💰 Expenditure Management
- 🔍 Search & Filter APIs
- 📊 Dashboard Statistics APIs
- ✅ Input Validation
- ⚠️ Centralized Error Handling
- 🌐 RESTful API Architecture
- 📝 Logging & Middleware Support
- 🔒 Password Hashing using bcrypt
- 🚀 MongoDB Integration with Mongoose

---

# 🛠️ Tech Stack

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Token)
- bcryptjs
- dotenv
- cors
- nodemon

---

# 📂 Project Structure

```
backend/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── validations/
├── app.js
├── server.js
└── package.json
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/Rushikesh1Avachat/military-assest-management-system-backend.git

cd military-assest-management-system-backend
```

## Install Dependencies

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key
```

---

# ▶️ Run Development Server

```bash
npm run dev
```

or

```bash
npm start
```

Server runs on

```
http://localhost:5000
```

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login User |

## Assets

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/assets` | Get All Assets |
| GET | `/api/assets/:id` | Get Asset by ID |
| POST | `/api/assets` | Create Asset |
| PUT | `/api/assets/:id` | Update Asset |
| DELETE | `/api/assets/:id` | Delete Asset |

## Assignments

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/assignments` | Get Assignments |
| POST | `/api/assignments` | Create Assignment |
| PUT | `/api/assignments/:id` | Update Assignment |
| DELETE | `/api/assignments/:id` | Delete Assignment |

## Expenditures

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/expenditures` | Get Expenditures |
| POST | `/api/expenditures` | Add Expenditure |
| PUT | `/api/expenditures/:id` | Update Expenditure |
| DELETE | `/api/expenditures/:id` | Delete Expenditure |

---

# 🔐 Authentication

Protected routes require a JWT token.

Example Header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# 🗄️ Database

MongoDB is used as the primary database.

Main Collections:

- Users
- Assets
- Assignments
- Expenditures

---

# 🔗 Frontend Repository

Frontend Repository

https://github.com/Rushikesh1Avachat/frontend-military-assest-management-system

---

# 🧪 Testing

Run the server locally and test APIs using:

- Postman
- Thunder Client
- Insomnia

---

# 🚀 Future Enhancements

- Role-Based Dashboard
- Audit Logs
- Asset QR Code Support
- Email Notifications
- Report Generation (PDF/Excel)
- Unit & Integration Tests
- Docker Support
- CI/CD Pipeline
- API Documentation using Swagger

---

# 👨‍💻 Author

**Rushikesh Avachat**

GitHub:

https://github.com/Rushikesh1Avachat

---

# 📄 License

This project is developed for educational and portfolio purposes.
