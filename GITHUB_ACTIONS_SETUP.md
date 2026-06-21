# GitHub Actions & Secrets Configuration Guide

## 🔐 Setup GitHub Secrets for CI/CD

Once you push to GitHub, GitHub Actions will automatically:
1. Run tests and linting
2. Build Docker images
3. Deploy to Railway

### Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret below:

---

## 📋 Required Secrets

### Docker Hub (for image storage)
```
Secret Name: DOCKER_USERNAME
Value: your_docker_hub_username
```

```
Secret Name: DOCKER_PASSWORD
Value: your_docker_hub_access_token
```

**How to get Docker Hub token:**
1. Go to https://hub.docker.com/settings/security
2. Create New Access Token
3. Copy the token

---

### Railway API Token
```
Secret Name: RAILWAY_TOKEN
Value: your_railway_api_token
```

**How to get Railway token:**
1. Go to https://railway.app/account/tokens
2. Click "Create New Token"
3. Copy the token

---

### Production Environment Variables

For automatic deployment to production, add all env vars as secrets:

```
GOOGLE_AI_API_KEY
JWT_SECRET
JWT_REFRESH_SECRET
MONGODB_URI
REDIS_URL
EMAIL_USER
EMAIL_PASSWORD
FRONTEND_URL
```

---

## 🔧 GitHub Actions Workflow

### What's Included

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main`

**Jobs**:

1. **Test Job** (always runs)
   - Install dependencies
   - Run linting
   - Run type checking
   - Run tests
   - Build project

2. **Build Docker** (runs on main push if tests pass)
   - Build backend image
   - Build frontend image
   - Push to Docker Hub

3. **Deploy** (runs on main push if build succeeds)
   - Deploy to Railway automatically

---

## ⚙️ Custom Workflow Configuration

### Modify Deployment Regions

Edit `.github/workflows/deploy.yml`:

```yaml
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    RAILWAY_SERVICE_ID: your_service_id  # Optional
  run: |
    npm install -g @railway/cli
    railway up --service backend
```

---

## 🧪 Testing Workflow Locally

### Simulate GitHub Actions Locally

Install Act (requires Docker):

```bash
# macOS
brew install act

# Linux
sudo apt-get install act

# Windows
choco install act-cli
```

### Run workflow locally:

```bash
act -j test
# Runs the test job

act -j build-docker
# Runs the Docker build (requires DOCKER_USERNAME secret locally)

# Full workflow
act
```

---

## 📊 Monitoring Workflow

### View Workflow Status

1. GitHub repo → Actions tab
2. Select workflow run
3. View:
   - ✅ Successful steps
   - ❌ Failed steps
   - 📝 Logs for debugging

### Common Workflow Failures

**Failure**: Tests not passing
- **Fix**: Run tests locally first: `npm test`

**Failure**: Docker image build fails
- **Fix**: Test build locally: `docker build -f Dockerfile .`

**Failure**: Railway deployment fails
- **Fix**: Check RAILWAY_TOKEN is valid
- **Fix**: Verify service exists in Railway

---

## 🔄 Environment-Specific Deployment

### Current Setup (Single Environment)

All pushes to `main` deploy to production.

### Advanced Setup (Staging + Production)

To add staging environment:

```yaml
# Edit .github/workflows/deploy.yml

- name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    RAILWAY_SERVICE_ID: staging-service-id
  run: railway up --service backend

- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  needs: test
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    RAILWAY_SERVICE_ID: production-service-id
  run: railway up --service backend
```

---

## 📋 Workflow Checklist

Before first deployment:

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Add all required secrets
- [ ] Verify workflow file exists: `.github/workflows/deploy.yml`
- [ ] Make test commit to trigger workflow
- [ ] Monitor Actions tab for completion
- [ ] Verify deployment successful

---

## 🆘 Troubleshooting Workflow

### Workflow Not Triggering

**Check**:
- Push is to `main` or `develop` branch
- GitHub Actions enabled (Settings → Actions)
- `.github/workflows/deploy.yml` is in repo

### Tests Failing in CI

**Debug**:
1. View full logs in Actions tab
2. Run same tests locally: `npm test`
3. Fix issues locally
4. Push again

### Docker Build Failing

**Debug**:
```bash
# Reproduce locally
docker build -f Dockerfile -t medsage-backend .

# Check errors
docker logs medsage-backend
```

### Railway Deployment Failing

**Debug**:
1. Check RAILWAY_TOKEN is valid
2. Verify service name in Railway
3. Check Railway logs: `railway logs`

---

## 🔒 Security Best Practices

### Secrets Management

✅ **Do**:
- Store sensitive data as secrets
- Rotate secrets regularly
- Use unique tokens per environment
- Review secret access logs

❌ **Don't**:
- Commit secrets to repo
- Use same secret for staging + production
- Share secrets via chat/email
- Store hardcoded credentials

### Token Rotation Schedule

- JWT secrets: Every 3 months
- API keys: Every 6 months
- Database passwords: Every 6 months
- Docker tokens: Every year

---

## 📚 GitHub Actions Documentation

- Main Docs: https://docs.github.com/en/actions
- Workflow Syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## 🎯 Advanced CI/CD Features

### Slack Notifications

Add to workflow for deployment notifications:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

GitHub automatically emails on failures:
- Settings → Notifications
- Configure email preferences

### Conditional Deployments

Only deploy if tests pass:

```yaml
deploy:
  needs: test
  if: success()
  runs-on: ubuntu-latest
```

---

## 🚀 First Deployment Steps

1. **Setup GitHub Secrets**
   - Add all required secrets from this guide

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

3. **Monitor Actions**
   - Go to Actions tab
   - Watch workflow run
   - Check logs for any errors

4. **Verify Deployment**
   - Check Railway dashboard
   - Test API endpoint
   - Verify frontend deployment

---

## 📞 Support Resources

- GitHub Actions Help: https://github.community/
- Railway CLI Docs: https://docs.railway.app/
- Docker Hub: https://hub.docker.com/

---

**Version**: 1.0.0  
**Last Updated**: June 2026

