# MedSage Deployment Guide

## 📦 Complete Deployment Strategy

This guide covers deploying MedSage using:
- **Frontend**: Vercel (GitHub Pages alternative)
- **Backend**: Railway or Render
- **Database**: MongoDB Atlas
- **Containerization**: Docker

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────┐
│        User Browser (Global CDN)            │
└────────────────┬────────────────────────────┘
                 │
        ┌────────▼────────┐
        │     Vercel      │ (Frontend)
        │  React + Vite   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │    Railway      │ (Backend)
        │  Node + Express │
        └────────┬────────┘
                 │
        ┌────────▼────────────┐
        │   MongoDB Atlas    │ (Database)
        │  Cloud Hosted      │
        └────────────────────┘
```

---

## Phase 1: Preparation (Local Setup)

### Step 1.1: Install Docker
- **Windows**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **macOS**: `brew install docker` or [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow [official guide](https://docs.docker.com/engine/install/)

### Step 1.2: Verify Docker Installation
```bash
docker --version
docker run hello-world
```

### Step 1.3: Create Environment File
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Step 1.4: Test Locally with Docker Compose
```bash
docker-compose up -d
# Wait 30 seconds for all services to start
docker-compose logs -f backend
# Should see "Server running on port 3000"
```

---

## Phase 2: MongoDB Atlas Setup (Cloud Database)

### Step 2.1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and sign up
3. Accept terms and create account

### Step 2.2: Create a Cluster
1. Click "Create a Database"
2. Select "FREE" tier (M0 Sandbox)
3. Choose region closest to your users
4. Click "Create Deployment"
5. Wait 1-2 minutes for cluster to initialize

### Step 2.3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. **Username**: `medsage_user`
4. **Password**: Generate secure password (copy it!)
5. **Role**: Atlas Admin (or custom read/write)
6. Click "Add User"

### Step 2.4: Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
4. Or specify your deployment IP (Railway/Render)
5. Click "Confirm"

### Step 2.5: Get Connection String
1. Go to "Databases" → Your cluster
2. Click "Connect"
3. Select "Drivers"
4. Choose "Node.js" and version 4.x
5. Copy the connection string
6. Format: `mongodb+srv://username:password@cluster.mongodb.net/medsage`
7. **Replace**: `<username>` and `<password>` with actual values

### Step 2.6: Update .env
```env
MONGODB_URI=mongodb+srv://medsage_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/medsage
```

---

## Phase 3: Railway Deployment (Backend)

### Step 3.1: Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Create new project

### Step 3.2: Connect GitHub Repository
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access GitHub
4. Select your MedSage repository
5. Click "Deploy"

### Step 3.3: Configure Railway Settings
1. Go to your project dashboard
2. Add service → "Docker"
3. Railway will auto-detect Dockerfile
4. Click "Deploy"

### Step 3.4: Set Environment Variables
1. In Railway dashboard, click on the backend service
2. Go to "Variables" tab
3. Add all variables from your .env:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://medsage_user:PASSWORD@cluster.mongodb.net/medsage
REDIS_URL=redis://...  (Get from Railway Redis add-on)
GOOGLE_AI_API_KEY=your_api_key
JWT_SECRET=generate_new_strong_secret
JWT_REFRESH_SECRET=generate_new_strong_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=https://your-vercel-domain.vercel.app
LOG_LEVEL=info
```

### Step 3.5: Add Redis Add-on (Optional but Recommended)
1. In Railway, click "Add Service" → "Add from Marketplace"
2. Search "Redis"
3. Click "Redis" and add it
4. Railway will auto-populate `REDIS_URL`

### Step 3.6: Configure Custom Domain (Optional)
1. Go to project settings
2. Under "Domains", add your custom domain
3. Add CNAME record in DNS

### Step 3.7: Monitor Deployment
1. Go to "Deployments" tab
2. Watch logs in real-time
3. Deployment complete when "Active" status shows
4. Get your Railway URL: `https://xxxx.railway.app`

### Step 3.8: Verify Backend is Running
```bash
curl https://xxxx.railway.app/api/v1/health
# Should return: {"status":"ok"}
```

---

## Phase 4: Vercel Deployment (Frontend)

### Step 4.1: Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Authorize Vercel

### Step 4.2: Import Project
1. Click "New Project"
2. Select "Import Git Repository"
3. Search for your MedSage repository
4. Click "Import"

### Step 4.3: Configure Build Settings
1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### Step 4.4: Set Environment Variables
1. In Vercel project settings, go to "Environment Variables"
2. Add:

```
VITE_API_URL=https://your-railway-backend.railway.app
```

Example: `VITE_API_URL=https://medsage-backend.railway.app`

### Step 4.5: Deploy
1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Get your Vercel URL: `https://medsage.vercel.app`

### Step 4.6: Verify Frontend is Running
1. Visit `https://medsage.vercel.app`
2. Should load landing page
3. Check API connectivity in browser console

---

## Phase 5: Configuration & Testing

### Step 5.1: Update Backend CORS Settings
1. Backend should have `FRONTEND_URL` set to your Vercel URL
2. Update Railway environment:
   ```
   FRONTEND_URL=https://medsage.vercel.app
   ```

### Step 5.2: Test Complete Flow
1. Visit Vercel frontend URL
2. Click "Sign Up"
3. Fill registration form
4. Should receive OTP email (if email configured)
5. Verify OTP and create account
6. Access dashboard and test features

### Step 5.3: Test API Endpoints
```bash
# Test health check
curl https://your-railway-url.railway.app/api/v1/health

# Test registration
curl -X POST https://your-railway-url.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "fullName": "Test User"
  }'
```

### Step 5.4: Monitor Application
- **Railway**: Dashboard → Deployments → Logs
- **Vercel**: Deployments → Logs
- **MongoDB Atlas**: Metrics → Monitor Cluster

---

## 📊 Monitoring & Maintenance

### Real-time Logs
```bash
# Railway backend logs
railway logs

# Or view in Railway dashboard
```

### Performance Monitoring
1. **Vercel Analytics**: Project → Analytics
2. **Railway Metrics**: Service → Metrics
3. **MongoDB Atlas**: Cluster → Metrics

### Enable Application Logging
Add to `.env` in Railway:
```
LOG_LEVEL=info
```

---

## 🔧 Troubleshooting

### Issue: 502 Bad Gateway on Frontend
**Solution**: Check backend is running
```bash
curl https://your-railway-url/api/v1/health
# If fails, check Railway logs
```

### Issue: Database Connection Failed
**Solution**: Verify MongoDB Atlas settings
1. Check IP whitelist includes 0.0.0.0/0
2. Verify username and password in connection string
3. Check `MONGODB_URI` in Railway environment

### Issue: Email Not Sending
**Solution**: Verify email credentials
1. Gmail: Use App Password, not regular password
2. Enable "Less secure app access" (if not using App Password)
3. Check `EMAIL_USER` and `EMAIL_PASSWORD` in .env

### Issue: CORS Error in Browser
**Solution**: Update `FRONTEND_URL` in Railway
```
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### Issue: Long Deployment Times
**Solution**: 
1. Check Railway/Vercel quota
2. Optimize Docker image size
3. Remove unnecessary dependencies

---

## 🔐 Security Checklist

Before going live:
- [ ] Change all default passwords
- [ ] Regenerate JWT secrets (never use sample values)
- [ ] Enable HTTPS (both platforms do this by default)
- [ ] Set `NODE_ENV=production` in Railway
- [ ] Remove debug logs in production (`LOG_LEVEL=info`)
- [ ] Configure rate limiting
- [ ] Enable database authentication
- [ ] Set up database backups (MongoDB Atlas does this)
- [ ] Monitor API usage
- [ ] Setup error tracking (Sentry recommended)

---

## 📈 Scaling Strategy

### Current Setup (Suitable for 1000-5000 users)
- Vercel (Auto-scales, free tier)
- Railway Pro (2-5 concurrent containers)
- MongoDB Atlas M0-M2

### Scale to 10,000+ Users
1. **Backend**: Railway Pro → Railway Team (multiple instances)
2. **Database**: MongoDB M5+ tier
3. **CDN**: Vercel built-in (auto-scales)
4. **Caching**: Redis on Railway (auto-scales)

### Scale to 100,000+ Users
1. **Backend**: Railway → AWS ECS/Kubernetes
2. **Database**: MongoDB M50+
3. **CDN**: Vercel + CloudFlare
4. **Cache**: Dedicated Redis cluster
5. **Search**: Elasticsearch
6. **Analytics**: Segment/Mixpanel

---

## 💰 Cost Estimation (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Railway | Starter | Free |
| MongoDB Atlas | M0 | Free |
| **Total** | | ~$20 |

**Note**: Upgrade tiers as usage grows

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Backend API responds
- [ ] Database connection successful
- [ ] User registration works
- [ ] Email verification works
- [ ] Login/logout works
- [ ] Chat with AI works
- [ ] All modules functional
- [ ] Mobile responsive
- [ ] Error handling working
- [ ] Logging operational
- [ ] Backups configured
- [ ] Monitoring alerts setup

---

## 📞 Useful Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

---

## 🚨 Emergency Procedures

### Rollback Failed Deployment
```bash
# Railway: Click previous deployment → "Reactivate"
# Vercel: Deployments → Select previous → "Promote to Production"
```

### Emergency Database Access
```bash
# Via MongoDB Atlas web interface
# Or MongoDB Compass (GUI tool)
```

### Service Recovery
1. Check deployment logs for errors
2. Verify all environment variables set
3. Restart service (Railway: click "Redeploy")
4. Check monitoring alerts

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**Next Review**: After first production deployment

