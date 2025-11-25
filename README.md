# JobMatch Backend API

Backend API for JobMatch - Job Matching Platform built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication**: JWT-based authentication for Job Seekers, Employers, and Admins
- **Job Management**: Create, update, delete, and search job postings
- **Profile Management**: Complete CV/Resume management for job seekers
- **Application System**: Apply for jobs, track application status
- **Company Profiles**: Employer company profiles with verification
- **File Upload**: Resume and image uploads via Cloudinary
- **Email Notifications**: Email service for important updates
- **Admin Panel**: User management and company verification

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)
- Gmail account (for email notifications)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   cd JobMatch-BE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your credentials:

   - MongoDB URI
   - JWT Secret
   - Cloudinary credentials
   - Gmail credentials (use App Password)

4. **Run the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "js" // or "employer"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

## 🗂️ Project Structure

```
JobMatch-BE/
├── src/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── utils/
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication in your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in your `.env` file

## ☁️ Cloudinary Setup

1. Create account at https://cloudinary.com
2. Get your credentials from Dashboard
3. Add to `.env` file

## 🚢 Deployment (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Add environment variables
5. Deploy!

## 📝 License

ISC
# Force redeploy - Tue Nov 25 19:22:30 +07 2025
