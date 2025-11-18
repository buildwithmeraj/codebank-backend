# 🏦 CodeBank - Backend API

A robust RESTful API backend for CodeBank, a modern code snippet management system built with Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🔐 **Authentication & Authorization** - Secure JWT-based authentication
- 📝 **Code Snippet Management** - Create, read, update, and delete code snippets
- 🏷️ **Tagging System** - Organize snippets with tags and categories
- 🔍 **Search Functionality** - Full-text search for code snippets
- 👥 **User Management** - User registration, profile management
- 📊 **Syntax Highlighting Support** - Multiple programming languages
- 🔒 **Security** - Password hashing, rate limiting, CORS protection
- ⚡ **Performance** - Optimized MongoDB queries with indexing

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Express Validator / Joi
- **Security:** Helmet, CORS, bcrypt

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (v4.4 or higher)

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/buildwithmeraj/codebank-backend.git
cd codebank-backend
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables))

4. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

The server should now be running on `http://localhost:5000` (or your configured port)

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/codebank
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/codebank

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:3000

# Optional: Email Configuration (for password reset, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| POST   | `/auth/register` | Register a new user |
| POST   | `/auth/login`    | Login user          |
| GET    | `/auth/me`       | Get current user    |
| POST   | `/auth/logout`   | Logout user         |

### Snippet Endpoints

| Method | Endpoint           | Description        | Auth Required |
| ------ | ------------------ | ------------------ | ------------- |
| GET    | `/snippets`        | Get all snippets   | ✅            |
| GET    | `/snippets/:id`    | Get single snippet | ✅            |
| POST   | `/snippets`        | Create new snippet | ✅            |
| PUT    | `/snippets/:id`    | Update snippet     | ✅            |
| DELETE | `/snippets/:id`    | Delete snippet     | ✅            |
| GET    | `/snippets/search` | Search snippets    | ✅            |

### User Endpoints

| Method | Endpoint              | Description         | Auth Required |
| ------ | --------------------- | ------------------- | ------------- |
| GET    | `/users/profile`      | Get user profile    | ✅            |
| PUT    | `/users/profile`      | Update profile      | ✅            |
| GET    | `/users/:id/snippets` | Get user's snippets | ✅            |

### Example Request

**Create a new snippet:**

```bash
POST /api/v1/snippets
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "title": "React useState Hook",
  "description": "Basic example of useState hook",
  "code": "const [count, setCount] = useState(0);",
  "language": "javascript",
  "tags": ["react", "hooks", "javascript"]
}
```

## 📁 Project Structure

```
codebank-backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── db.js
│   ├── controllers/      # Route controllers
│   │   ├── authController.js
│   │   ├── snippetController.js
│   │   └── userController.js
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   └── Snippet.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── snippets.js
│   │   └── users.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── utils/            # Utility functions
│   │   └── helpers.js
│   └── app.js           # Express app setup
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── server.js            # Entry point
```

## 📜 Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Merajul Islam**

- Portfolio: [meraj.pro](https://meraj.pro)
- GitHub: [@buildwithmeraj](https://github.com/buildwithmeraj)
- Email: buildwithmeraj@gmail.com

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this project
- Inspired by modern code snippet management tools

---

<p align="center">Made with ❤️ by Merajul Islam</p>
