# JobMatch Backend - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your actual credentials:

#### MongoDB

- **Local**: `mongodb://localhost:27017/jobmatch`
- **Atlas**: Get connection string from https://cloud.mongodb.com

#### JWT Secret

Generate a strong secret key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Cloudinary Setup (Free)

1. Create account: https://cloudinary.com/users/register/free
2. Go to Dashboard: https://cloudinary.com/console
3. Copy: Cloud Name, API Key, API Secret

#### Gmail Setup (Free)

1. Enable 2FA on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `.env`

### 3. Seed Admin Account

```bash
npm run seed:admin
```

Default credentials:

- Email: `admin@jobmatch.com`
- Password: `admin123456`

**⚠️ Change password after first login!**

### 4. Run Development Server

```bash
npm run dev
```

Server will start at: http://localhost:5000

## 📚 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Health Check

```bash
curl http://localhost:5000/health
```

## 🧪 Testing APIs with Postman/Thunder Client

### 1. Register User (Job Seeker)

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "js"
}
```

### 2. Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Copy the `token` from response.

### 3. Get Profile (Protected)

```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### 4. Search Jobs (Public)

```http
GET http://localhost:5000/api/js/jobs/search?keyword=developer&location=HCM
```

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
# For local installation:
sudo systemctl status mongod

# Or start it:
sudo systemctl start mongod

# For Docker:
docker run -d -p 27017:27017 --name mongodb mongo
```

### Port Already in Use

```bash
# Change PORT in .env file
PORT=5001
```

### Email Not Sending

- Check Gmail app password is correct
- Make sure 2FA is enabled
- Try with a different Gmail account

## 📦 Production Deployment (Render)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy on Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: jobmatch-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Add Environment Variables

Add all variables from `.env` file in Render dashboard.

### 4. Seed Admin

In Render dashboard, run:

```bash
npm run seed:admin
```

## 🔒 Security Best Practices

1. **Change default admin password**
2. **Use strong JWT secret** (minimum 32 characters)
3. **Use MongoDB Atlas** instead of local MongoDB in production
4. **Enable HTTPS** (Render does this automatically)
5. **Set proper CORS origin** to your frontend URL

## 📝 Database Schema

### Collections:

- `users` - Job seekers and employers
- `admins` - Admin accounts
- `companies` - Company profiles
- `jobs` - Job postings
- `applications` - Job applications
- `savedjobs` - Bookmarked jobs
- `followcompanies` - Followed companies
- `notifications` - User notifications
- `jobalerts` - Job alert subscriptions
- `reports` - User reports

## 🛠️ Useful Commands

```bash
# Development
npm run dev

# Production
npm start

# Seed admin
npm run seed:admin

# Check logs
npm run dev | grep "error"
```

## 📞 Support

If you encounter any issues:

1. Check `.env` configuration
2. Verify MongoDB connection
3. Check server logs for errors
4. Ensure all dependencies are installed

## 🎉 Success!

If you see this in console, backend is ready:

```
✅ MongoDB Connected: localhost
  ╔═══════════════════════════════════════════════════════╗
  ║   🚀 JobMatch Backend Server                         ║
  ║   Port: 5000                                          ║
  ╚═══════════════════════════════════════════════════════╝
```
