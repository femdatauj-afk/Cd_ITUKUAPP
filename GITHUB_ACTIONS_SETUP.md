# GitHub Actions Setup Guide - CRITICAL ⚠️

**Status**: Ready to Deploy via CI/CD

This guide enables automated deployment of your application to AWS using GitHub Actions CI/CD pipeline.

---

## 🔑 Step 1: Add GitHub Repository Secrets

### Go to Repository Settings

1. Go to your GitHub repository: `Cd_ITUKUAPP`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. You should see repository-level secrets

### Add Global Secrets (Repository Level)

Click "New repository secret" and add these (visible to all environments):

| Secret Name | Value | Description |
|---|---|---|
| `AWS_ACCOUNT_ID` | `YOUR_AWS_ACCOUNT_ID` | Your AWS Account ID (from AWS Console) |
| `AWS_REGION` | `us-east-1` | Default AWS region |
| `AWS_ROLE_ARN` | (optional) | For OIDC authentication |

---

## 🌍 Step 2: Create GitHub Environments

### Environment A: Staging

1. Go to: **Settings** → **Environments** → **New environment**
2. Name: `staging`
3. Click "Create environment"
4. In the staging environment, click **"Add secret"** and add:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | (Set in AWS IAM) |
| `AWS_SECRET_ACCESS_KEY` | (Set in AWS IAM) |
| `ECR_REGISTRY` | `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com` |
| `DATABASE_URL` | (Get from Secrets Manager) |
| `JWT_SECRET` | `your-jwt-secret-value` |

**Deployment branches**: Select "All branches"  
**Required reviewers**: None (for staging, can test freely)

### Environment B: Production

1. Go to: **Settings** → **Environments** → **New environment**
2. Name: `production`
3. Click "Create environment"
4. In the production environment, click **"Add secret"** and add:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | (Set in AWS IAM) |
| `AWS_SECRET_ACCESS_KEY` | (Set in AWS IAM) |
| `ECR_REGISTRY` | `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com` |
| `DATABASE_URL` | (Prod database URL) |
| `JWT_SECRET` | `production-jwt-secret-value` |

**Deployment branches**: Select "Selected branches" → choose `main`  
**Required reviewers**: ✅ Add 1-2 team members for approval  
**Require status checks**: Optional (recommended)

---

## 📋 Step 3: Verify Workflow Files

Your CI/CD workflows should already exist at:
- `.github/workflows/test.yml` - Runs tests on PR
- `.github/workflows/deploy.yml` - Deploys to AWS

### Test Workflow (.github/workflows/test.yml)

Check that this workflow:
- ✅ Runs on: `push` to `main`, `develop`
- ✅ Runs on: Pull requests
- ✅ Contains: Node setup, TypeScript check, ESLint, Build
- ✅ Starts: PostgreSQL service container

### Deploy Workflow (.github/workflows/deploy.yml)

Check that this workflow:
- ✅ Runs on: `push` to `develop` (staging) or `main` (production)
- ✅ Uses: Docker to build images
- ✅ Pushes to: ECR repositories
- ✅ Updates: ECS services with new task definitions
- ✅ References: Environment variables from GitHub Secrets
- ✅ Contains: Health check verification

---

## 🚀 Step 4: First Deployment to Staging

### Method A: Using Git Command Line

```bash
# Navigate to project
cd c:\Users\user\Desktop\Cd_ITUKUAPP

# Verify git remote points to your GitHub repo
git remote -v
# Should show: origin https://github.com/YOUR_USERNAME/Cd_ITUKUAPP.git

# Switch to develop branch (staging auto-deploys from develop)
git checkout develop

# Make a test commit or update a file
echo "Deployment test" >> DEPLOYMENT_TEST.txt

# Stage and commit
git add .
git commit -m "Deploy to AWS staging - Infrastructure live"

# Push to develop (GitHub Actions will automatically trigger)
git push origin develop
```

### Method B: Using GitHub Web Interface

1. Go to your GitHub repository
2. Go to **Actions** tab
3. Select **Deploy to Staging & Production** workflow
4. Click **Run workflow**
5. Select branch: `develop`
6. Click **Run workflow** button

**Either method will trigger the deploy workflow immediately.**

---

## 📊 Step 5: Monitor Deployment Progress

### In GitHub Actions

1. Go to **Actions** tab in repository
2. Click on the latest **Deploy to Staging & Production** workflow run
3. Watch the workflow execute:
   - ✅ Checkout code
   - ✅ Configure AWS credentials
   - ✅ Build backend Docker image
   - ✅ Push backend to ECR
   - ✅ Build frontend Docker image
   - ✅ Push frontend to ECR
   - ✅ Update ECS task definitions
   - ✅ Deploy backend service
   - ✅ Deploy frontend service
   - ✅ Run health checks

**Expected Duration**: 5-15 minutes

### In AWS Console

In parallel, monitor deployment:

1. **ECS Cluster Status**:
   - Go to AWS Console → ECS → Clusters → itukuapp-staging
   - Click **itukuapp-backend-staging** service
   - Check: "Running count" should increase toward "Desired count"
   - Check: Deployments tab shows new task definition revision

2. **ECR Images**:
   - Go to AWS Console → ECR
   - Check **itukuapp-backend** repository
   - Should see new image pushed with today's timestamp

3. **CloudWatch Logs**:
   - Go to CloudWatch → Log Groups
   - Check **/ecs/itukuapp-backend-staging**
   - Should see startup logs from new container

---

## ✅ Step 6: Verify Deployment Success

### Health Check Endpoints

Once deployment completes, test the endpoints:

**Backend Health Check**:
```bash
curl http://itukuapp-alb-staging-1610830723.us-east-1.elb.amazonaws.com/api/health/ready
# Expected: {"status":"ok"} or similar
```

**Frontend Check**:
```bash
curl -L http://itukuapp-alb-staging-1610830723.us-east-1.elb.amazonaws.com
# Expected: HTML response with Next.js head tags
```

**Backend API Test** (verify DB connection):
```bash
curl http://itukuapp-alb-staging-1610830723.us-east-1.elb.amazonaws.com/api/users
# Expected: 200 status with user data (or 401 if auth required)
```

### Check Task Logs

1. Go to ECS → Clusters → itukuapp-staging → itukuapp-backend-staging
2. Click **Tasks** tab
3. Click the running task
4. Click **Logs** tab
5. Verify logs show:
   - Prisma client initialized
   - Server listening on port 4000
   - No error messages

---

## 🔄 Step 7: Continuous Deployment

### Automatic Deployments

Now that CI/CD is configured:

**For Staging**:
```bash
# Any push to develop will automatically build and deploy
git push origin develop
# GitHub Actions runs within 1 minute
```

**For Production**:
```bash
# Push to main and wait for approval notification
git push origin main
# GitHub Actions will pause for required reviewers
# Approvers get notification to review and approve
# Deployment continues after approval
```

### Manual Deployment (if needed)

If you want to redeploy the same code:

1. Go to GitHub → Actions tab
2. Click "Deploy to Staging & Production" workflow
3. Click "Run workflow" dropdown
4. Select branch and run manually

---

## 🔍 Troubleshooting Common Issues

### Issue: "AWS credentials not configured"

**Cause**: GitHub Secrets not added  
**Fix**: Go to Settings → Secrets and verify AWS keys are there

### Issue: "ECR image push failed"

**Cause**: Repository not found or permissions issue  
**Fix**: Verify ECR repositories exist:
- `691193790263.dkr.ecr.us-east-1.amazonaws.com/itukuapp-backend`
- `691193790263.dkr.ecr.us-east-1.amazonaws.com/itukuapp-frontend`

### Issue: "ECS service deployment failed"

**Cause**: Task definition issue or health check failing  
**Fix**: Check CloudWatch logs:
- Go to CloudWatch → Log Groups → `/ecs/itukuapp-backend-staging`
- Look for error messages indicating what failed

### Issue: "Health checks failing"

**Cause**: Application not starting properly  
**Fix**: 
1. Check CloudWatch logs for startup errors
2. Verify environment variables are set in task definition
3. Verify database connection string is correct
4. Check RDS security group allows inbound from ECS

### Issue: "Secrets not available to application"

**Cause**: GitHub secrets not mapped to ECS task definition  
**Fix**: Verify deploy.yml contains:
```yaml
- name: Deploy backend service
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
  run: |
    # Update task definition with secrets
```

---

## 📝 Deployment Checklist

Before clicking deploy, verify:

- [ ] All GitHub secrets added (repository level)
- [ ] Staging environment created with secrets
- [ ] Production environment created with secrets (if needed)
- [ ] `.github/workflows/test.yml` exists and is valid
- [ ] `.github/workflows/deploy.yml` exists and is valid
- [ ] `terraform apply` completed successfully
- [ ] ECR repositories exist in AWS
- [ ] ECS cluster and services exist in AWS
- [ ] RDS database is running
- [ ] Dockerfile and Dockerfile.frontend are in repo root
- [ ] All source code committed to Git
- [ ] No sensitive data in commit messages

---

## 🎯 Next Actions

### Immediate (Right Now)
1. Add GitHub Secrets (copy values from this guide)
2. Create GitHub Environments (staging & production)
3. Push code to develop branch

### After First Deployment Succeeds
1. Verify health check endpoints respond
2. Test API endpoints (authentication, endpoints, websockets)
3. Check CloudWatch logs for performance/errors
4. Consider adding domain name (DNS/Route53)

### For Production
1. Create production RDS if not already done
2. Create production ECS services
3. Add production GitHub Secrets
4. Set production environment with approvers
5. Push to main branch for production deployment

---

## 📞 Support Resources

**Workflow Syntax**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions  
**AWS ECS Documentation**: https://docs.aws.amazon.com/ecs/  
**GitHub Secrets Docs**: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions  
**Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/latest

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ GitHub Actions workflow completes without errors
2. ✅ Docker images appear in ECR repositories
3. ✅ ECS tasks transition to RUNNING state
4. ✅ Health check endpoints return 200 status
5. ✅ Backend API responds with data
6. ✅ Frontend loads in browser
7. ✅ CloudWatch logs show no errors
8. ✅ ALB reports healthy targets

**Estimated time to success**: 10-20 minutes from code push
