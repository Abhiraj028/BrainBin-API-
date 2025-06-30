# BrainBin API

A secure backend API to store personal brain dumps – thoughts, code snippets, and fixes – tied to user accounts.

-> Features

- User authentication with JWT & bcrypt
- RESTful endpoints to create, read, and delete dumps
- Dumps stored per user using MongoDB
- Request validation with Zod
- Secure password hashing and route protection

-> 📋 API Endpoints

### 🔐 Auth
- `POST /signup` – Create a new user
- `POST /login` – Log in and get a token

### 🧠 Dumps
- `POST /dump` – Add a dump (requires token)
- `GET /dumps` – View all dumps (requires token)
- `DELETE /dump/:id` – Delete a dump by ID (requires token)

-> 🔧 Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- Zod (input validation)
