# Luxury Perfume E-Commerce Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Quick Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (if not exists)
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=perfume_luxury_db
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=your-secret-key-here-make-it-long-and-random
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123
RAZORPAY_KEY_ID=rzp_test_SYFRK4IwukAGQI
RAZORPAY_KEY_SECRET=ZMRNrxk6WKla71pyhmZS49PD
EMERGENT_LLM_KEY=your-emergent-key-here
EOF

# Run the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install
# or
npm install

# Create .env file (if not exists)
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Run the frontend
yarn start
# or
npm start
```

## MongoDB Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify it's running
mongo --version
```

### Option 2: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update backend/.env:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
   ```

## Common Issues & Solutions

### Issue 1: "ModuleNotFoundError"
```bash
# Make sure you're in the backend directory
cd backend
pip install -r requirements.txt
```

### Issue 2: "Port 8001 already in use"
```bash
# Find and kill the process
lsof -ti:8001 | xargs kill -9
# or use a different port
uvicorn server:app --host 0.0.0.0 --port 8002 --reload
# Update frontend/.env with new port
```

### Issue 3: "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
sudo systemctl status mongodb
# or
ps aux | grep mongo

# Start MongoDB if not running
sudo systemctl start mongodb
```

### Issue 4: Frontend build errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json yarn.lock
yarn install
# or
npm install
```

### Issue 5: CORS errors
- Make sure backend/.env has: `CORS_ORIGINS=http://localhost:3000`
- Ensure frontend/.env has: `REACT_APP_BACKEND_URL=http://localhost:8001`

## Testing the Application

### 1. Check Backend
```bash
curl http://localhost:8001/api/products
```

### 2. Test Admin Login
- Email: admin@gmail.com
- Password: admin123

### 3. Test User Account
- Email: user@test.com
- Password: user123

## Available Coupons
- WELCOME10 - 10% off (min purchase ₹3000)
- LUXURY500 - ₹500 off (min purchase ₹5000)

## Razorpay Test Cards
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## Project Structure
```
/app
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── pages/        # All page components
│   │   ├── components/   # Reusable components
│   │   └── context/      # Auth context
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment variables
└── SETUP_GUIDE.md       # This file
```

## Need Help?

If you're still having issues, please provide:
1. Error message (full output)
2. Operating system
3. Python version: `python --version`
4. Node version: `node --version`
5. Which command failed

## Development URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
