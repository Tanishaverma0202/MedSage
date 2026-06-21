# 🔧 MedSage Deployment - Troubleshooting & Monitoring

## 📊 Monitoring Dashboard Setup

### Real-time Monitoring

#### Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Select your project
3. View:
   - **Deployments**: Current status and history
   - **Metrics**: CPU, Memory, Network usage
   - **Logs**: Real-time application logs
   - **Services**: Health status of all services

#### Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. View:
   - **Deployments**: Build and deployment status
   - **Analytics**: Performance metrics
   - **Logs**: Build and runtime logs
   - **Monitoring**: Performance insights

#### MongoDB Atlas Dashboard
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Select your cluster
3. View:
   - **Metrics**: CPU, Memory, Network, IOPS
   - **Performance Advisor**: Query optimization suggestions
   - **Alerts**: Set up notifications
   - **Backups**: Automatic backups

---

## 🚨 Common Issues & Solutions

### Issue 1: Backend Deployment Failing

**Symptoms**: Railway shows "Build Failed" or "Deployment Failed"

**Solutions**:
```bash
# 1. Check build logs in Railway
# Look for specific error messages

# 2. Verify Node.js version
# Railway uses Node 18+ (should work)

# 3. Check dependencies
npm install
npm run build
npm run lint

# 4. Check Dockerfile
# Ensure all paths are correct

# 5. Rebuild and redeploy
# Click "Redeploy" in Railway dashboard
```

**If still failing**:
- Check Railway logs in detail
- Ensure all environment variables are set
- Try with local Docker: `docker build -f Dockerfile .`
- Check for TypeScript errors: `npm run lint`

---

### Issue 2: Frontend Deployment Failing

**Symptoms**: Vercel shows build error

**Solutions**:
```bash
# 1. Check Vercel logs
# Deployments → Click failed deployment → Logs

# 2. Verify build command
# Should be: npm run build

# 3. Check environment variables
# VITE_API_URL should be set

# 4. Clear cache and redeploy
# Settings → Git → Redeploy (clear cache option)

# 5. Local build test
npm install
npm run build
# Check if dist/ folder created
```

---

### Issue 3: API Connection Errors

**Symptoms**: Frontend can't reach backend

**Network Tab shows 404/500 errors**

**Solutions**:
```bash
# 1. Verify API URL
# Open browser DevTools → Console
# Check if VITE_API_URL is correct
console.log(import.meta.env.VITE_API_URL)

# 2. Check CORS configuration
# Should see Access-Control-Allow-Origin header in response

# 3. Update FRONTEND_URL in Railway
# Must match your Vercel domain exactly

# 4. Test backend directly
curl https://your-railway-url.railway.app/api/v1/health

# 5. Check Railway environment variables
# Ensure all API keys are present
```

---

### Issue 4: Database Connection Errors

**Symptoms**: "MongoDB connection failed" in logs

**Solutions**:
```bash
# 1. Verify connection string format
# mongodb+srv://user:password@cluster.mongodb.net/database

# 2. Check MongoDB Atlas settings
MongoDB Atlas Dashboard:
  - Network Access: Add 0.0.0.0/0
  - Database User: Verify credentials
  - Cluster Status: Should be "Active"

# 3. Test connection locally
# Update .env with MongoDB URI
npm run dev
# Check if it connects

# 4. If using Railway-managed MongoDB
# Connection string auto-generated
# Check Railway MongoDB service logs
```

---

### Issue 5: Email Not Sending

**Symptoms**: Verification emails not received

**Solutions**:
```bash
# 1. Gmail Setup (if using Gmail)
# Settings → Security → Enable "Less secure app access"
# OR Generate App Password:
# Security → 2-Step Verification → App passwords

# 2. Verify credentials in Railway
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password (NOT regular password)

# 3. Check email service logs
# Railway → Backend → Logs
# Search for "email" or "nodemailer"

# 4. Test locally first
# Create .env and test locally
npm run dev

# 5. Try different email provider
# Use SendGrid, Mailgun, or other SMTP service
```

---

### Issue 6: High Memory Usage

**Symptoms**: Backend service crashing, Railway shows high memory

**Solutions**:
```bash
# 1. Check for memory leaks
# Monitor memory growth over time
# Railway → Metrics → Memory tab

# 2. Optimize database queries
# Look for N+1 query problems
# Check MongoDB indexes

# 3. Reduce caching size
# In Redis, check memory usage
# Clear old cache entries

# 4. Scale up resources
# Railway → Service Settings → Scale resources

# 5. Implement pagination
# For large data sets, paginate results
# Backend: Implement skip/limit
# Frontend: Use infinite scroll or pagination
```

---

### Issue 7: Slow API Response Times

**Symptoms**: API calls taking > 1 second

**Solutions**:
```bash
# 1. Enable query logging
LOG_LEVEL=debug

# 2. Identify slow queries
# Check Railway logs for slow queries
# MongoDB logs for query performance

# 3. Add database indexes
# In MongoDB Atlas:
Collections → Indexes → Add index on frequently queried fields

# 4. Optimize queries
# Avoid unnecessary fields in select
# Use lean() for read-only queries

# 5. Enable caching
# Redis caching for frequently accessed data
# Cache API responses

# 6. Check network latency
# Frontend → Backend distance
# Consider CDN for static assets
```

---

### Issue 8: 502 Bad Gateway

**Symptoms**: "502 Bad Gateway" error from frontend

**Solutions**:
```bash
# 1. Check backend health
curl https://your-railway-url.railway.app/api/v1/health

# 2. Restart backend
# Railway → Service → Redeploy

# 3. Check service status
# Railway dashboard should show "Active"

# 4. Review recent deployments
# Railway → Deployments → Check for recent changes

# 5. Check error logs
# Railway → Backend service → Logs
# Look for startup errors

# 6. Verify environment variables
# All required variables must be set
# Check for typos
```

---

## 📈 Performance Monitoring

### Monitor These Metrics

**Backend Performance**:
- API Response Time (target: < 500ms)
- Error Rate (target: < 0.1%)
- Memory Usage (target: < 500MB)
- CPU Usage (target: < 50%)
- Database Connections (monitor for leaks)

**Frontend Performance**:
- Page Load Time (target: < 3s)
- Time to Interactive (target: < 5s)
- Core Web Vitals:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1

**Database Performance**:
- Query Response Time (target: < 50ms)
- Index Usage (ensure indexes are used)
- Connection Pool Usage (< 80%)
- Storage Growth Rate

### Setup Alerts

#### Railway Alerts
1. Dashboard → Service → Settings
2. Under "Alerts", enable notifications for:
   - High CPU usage
   - High memory usage
   - Deployment failures
   - Service crashes

#### Vercel Alerts
1. Settings → Monitoring
2. Enable Sentry integration for error tracking
3. Setup email notifications

#### MongoDB Atlas Alerts
1. Alerts → Alert Policies
2. Create alerts for:
   - High memory usage
   - Connection pool exhaustion
   - Replication lag
   - Database lock

---

## 🔍 Debugging Techniques

### Backend Debugging

**Check Logs**:
```bash
# Railway logs
railway logs

# Or view in dashboard: Deployments → Logs
```

**Test Endpoints**:
```bash
# Health check
curl https://your-url/api/v1/health

# User registration
curl -X POST https://your-url/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","fullName":"Test"}'

# With authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-url/api/v1/auth/me
```

**Enable Debug Logging**:
```bash
# In Railway environment
LOG_LEVEL=debug

# This provides verbose logging for troubleshooting
```

### Frontend Debugging

**Browser DevTools**:
1. Press F12
2. Console tab: Check for errors
3. Network tab: Check API calls
4. Application tab: Check localStorage for tokens

**Check Environment Variables**:
```javascript
// In browser console
console.log(import.meta.env)
```

**Network Request Inspection**:
```javascript
// Check if requests are being sent
// Network tab → XHR/Fetch filter
// Look for /api calls
```

---

## 🛡️ Security Monitoring

### Monitor These Indicators

**Suspicious Activity**:
- High failed login attempts
- Unusual API request patterns
- Large data exports
- Admin account access anomalies

**Check Security Headers**:
```bash
curl -I https://your-url
# Should include:
# Strict-Transport-Security
# X-Content-Type-Options
# X-Frame-Options
```

**Database Access Logs**:
- Monitor for unauthorized access
- Check user role changes
- Review data exports

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check error rates
- [ ] Verify services are online
- [ ] Review critical logs

### Weekly
- [ ] Review performance metrics
- [ ] Check database growth
- [ ] Update security logs analysis

### Monthly
- [ ] Analyze usage patterns
- [ ] Plan capacity scaling
- [ ] Review and rotate secrets
- [ ] Backup verification
- [ ] Security audit

### Quarterly
- [ ] Dependency updates
- [ ] Security patches
- [ ] Infrastructure review
- [ ] Cost optimization

---

## 🆘 Emergency Procedures

### Service Down

1. **Immediate** (0-2 min):
   - Alert team
   - Check service status dashboard
   - Identify affected service

2. **Quick Check** (2-5 min):
   - View recent deployment
   - Check environment variables
   - Restart service if needed

3. **Investigation** (5-15 min):
   - Review error logs
   - Check recent changes
   - Analyze metrics

4. **Recovery** (15-30 min):
   - Rollback if necessary
   - Or fix and redeploy
   - Verify service health

### Data Backup Recovery

1. **Backup Location**:
   - MongoDB Atlas: Automatic daily backups
   - Access via Atlas UI under Backups

2. **Restore Procedure**:
   - MongoDB Atlas Dashboard
   - Backups → Restore from backup
   - Select point-in-time
   - Confirm restore

3. **Test Restore** (in non-prod):
   - Restore to test database
   - Verify data integrity
   - Test application connectivity

---

## 📞 Support Resources

- **Railway Support**: https://railway.app/support
- **Vercel Support**: https://vercel.com/support
- **MongoDB Support**: https://support.mongodb.com
- **Node.js Docs**: https://nodejs.org/docs
- **Express Docs**: https://expressjs.com

---

**Last Updated**: June 2026  
**Version**: 1.0.0

