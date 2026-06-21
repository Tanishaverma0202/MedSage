# 🚀 MedSage Quick Start Deployment Guide

## Overview
This is the fastest way to get MedSage deployed using **Vercel + Railway + MongoDB Atlas**.

---

## 📋 5-Minute Setup

### Step 1: Setup MongoDB Atlas (2 minutes)
```bash
# Go to: https://www.mongodb.com/cloud/atlas
1. Sign up → Create free cluster
2. Database Access: Create user "medsage_user" with strong password
3. Network Access: Allow 0.0.0.0/0 (anywhere)
4. Copy connection string: mongodb+srv://medsage_user:PASSWORD@cluster0.xxxxx.mongodb.net/medsage
```

### Step 2: Deploy Backend to Railway (1 minute)
```bash
# Go to: https://railway.app
1. Sign in with GitHub
2. New Project → Deploy from GitHub repo
3. Select MedSage repository
4. Click Deploy
5. Add environment variables (use .env.example)
6. Get your Railway URL: https://medsage-backend-xyz.railway.app
```

### Step 3: Deploy Frontend to Vercel (1 minute)
```bash
# Go to: https://vercel.com
1. Import project from GitHub
2. Framework: Vite
3. Environment variable: VITE_API_URL=https://medsage-backend-xyz.railway.app
4. Deploy
5. Get your Vercel URL: https://medsage-xyz.vercel.app
```

### Step 4: Final Configuration (1 minute)
```bash
# In Railway environment variables, add:
FRONTEND_URL=https://medsage-xyz.vercel.app
```

**That's it! ✅ Your app is live!**

---

## 🐳 Local Testing with Docker (Optional)

### Quick Start
```bash
# Windows
./deploy.bat

# macOS/Linux
bash deploy.sh
```

### Manual Local Deployment
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your values
nano .env  # or use any text editor

# 3. Start all services
docker-compose up -d

# 4. Check logs
docker-compose logs -f backend

# 5. Test
curl http://localhost:3000/api/v1/health
```

---

## 🔑 Environment Variables Needed

| Variable | Example | Where to Get |
|----------|---------|--------------|
| MONGODB_URI | mongodb+srv://user:pass@cluster.mongodb.net/medsage | MongoDB Atlas |
| GOOGLE_AI_API_KEY | AIzaSyD... | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| JWT_SECRET | random_secure_string | Generate: `openssl rand -hex 32` |
| EMAIL_USER | your@gmail.com | Your email |
| EMAIL_PASSWORD | app_password | Gmail App Password |

---

## ✅ Verification

### Backend Running?
```bash
curl https://your-railway-url.railway.app/api/v1/health
# Should return: {"status":"ok"}
```

### Frontend Loading?
Visit: `https://your-vercel-url.vercel.app`
Should see landing page without errors

### API Connected?
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try signup
4. Should see API calls to backend

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | Check backend is running: view Railway logs |
| MongoDB error | Verify connection string and IP whitelist |
| API 404 | Check `FRONTEND_URL` in Railway environment |
| Email not sending | Verify Gmail App Password (not regular password) |
| Port already in use | `docker-compose down` and retry |

---

## 📚 Full Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete step-by-step guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment checklist
- **[README.md](README.md)** - Project overview

---

## 🎯 What's Next?

After deployment:
1. ✅ Test all features (chat, workouts, nutrition, etc.)
2. ✅ Monitor Railway and Vercel dashboards
3. ✅ Setup error tracking (Sentry recommended)
4. ✅ Enable monitoring alerts
5. ✅ Configure custom domain (optional)

---

## 💰 Cost
- **Vercel**: Free (or $20/mo Pro)
- **Railway**: Free tier, then $5/month
- **MongoDB Atlas**: Free (M0 tier)
- **Total**: ~$5/month for small scale

---

**Need help?** Check logs:
- Railway: Dashboard → Deployments → Logs
- Vercel: Deployments → Logs
- MongoDB: Atlas → Metrics

**Good luck! 🚀**

