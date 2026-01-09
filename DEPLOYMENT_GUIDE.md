# AppTodo Deployment Guide

Complete guide to deploying AppTodo to production environments.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Docker Setup](#docker-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Cloud Providers](#cloud-providers)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Domain name (for production)
- SSL Certificate (for HTTPS)

### 5-Minute Setup

```bash
# Clone repository
git clone <repository-url>
cd apptodo

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

Access the application at `http://localhost`

---

## 🛠️ Local Development

### Development Setup

```bash
# Install dependencies (without Docker)
cd app/backend && uv sync --python 3.12
cd ../frontend && npm install

# Start backend
cd app/backend
source .venv/bin/activate
uvicorn main:app --reload

# Start frontend (in another terminal)
cd app/frontend
npm run dev

# Run tests
npm run test          # Frontend unit tests
npm run test:e2e      # E2E tests
cd ../backend && pytest  # Backend tests
```

### Docker Development

```bash
# Build images
docker-compose build

# Start services with volumes (hot reload)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run tests inside container
docker-compose exec backend pytest
docker-compose exec frontend npm run test

# Stop services
docker-compose down
```

---

## 🌍 Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured (`.env`)
- [ ] SSL certificates ready
- [ ] Database backups enabled
- [ ] Monitoring setup complete
- [ ] Domain DNS configured
- [ ] Server access verified
- [ ] Git repo accessible from server

### Production Environment Variables

```bash
# Copy and customize for production
cp .env.example .env.production

# Update critical variables
SECRET_KEY=<strong-random-key>
DEBUG=false
ENVIRONMENT=production
CORS_ORIGINS=https://example.com
DATABASE_URL=postgresql://user:pass@db-host/apptodo
VITE_API_URL=https://api.example.com/api/v1
```

### Manual Deployment

```bash
# SSH into production server
ssh user@production-server

# Clone/update repository
cd /opt/apptodo
git pull origin main

# Copy production environment
cp .env.production .env

# Build and start services
docker-compose build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations (if needed)
docker-compose exec backend alembic upgrade head

# Verify deployment
docker-compose ps
curl https://api.example.com/health
```

### Zero-Downtime Deployment

```bash
# 1. Pull latest changes on secondary
git pull origin main

# 2. Build on secondary
docker-compose build

# 3. Start new containers
docker-compose up -d

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Warm up caches
curl https://api.example.com/tasks

# 6. Switch load balancer to secondary
# (Configure in your load balancer)

# 7. Bring down primary
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# 8. Promote secondary to primary
# (Update DNS/load balancer)
```

---

## 🐳 Docker Setup

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Build with no cache
docker-compose build --no-cache

# Push to registry
docker tag apptodo:latest registry.example.com/apptodo:latest
docker push registry.example.com/apptodo:latest
```

### Image Optimization

```dockerfile
# Multi-stage build reduces final image size
# See Dockerfile for details

# Build stages:
# 1. Frontend builder - Node build
# 2. Backend builder - Python dependencies
# 3. Runtime - Combined optimized image
```

**Image Sizes:**
- Frontend builder: ~400MB
- Backend builder: ~500MB
- Final runtime: ~300MB

### Docker Volumes

```bash
# Create persistent volumes
docker volume create apptodo-data
docker volume create apptodo-backups

# Inspect volume
docker volume inspect apptodo-data

# Backup volume
docker run --rm -v apptodo-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/data-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v apptodo-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/data-backup.tar.gz -C /data
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:

1. **Runs tests** on every push
2. **Builds Docker image** on main branch
3. **Deploys to staging** on develop branch
4. **Runs E2E tests** on main branch
5. **Deploys to production** on successful tests

### Setting Up Secrets

Go to GitHub repository → Settings → Secrets:

```bash
# Staging deployment
STAGING_HOST=staging.example.com
STAGING_USER=deploy
STAGING_DEPLOY_KEY=<ssh-private-key>

# Production deployment
PROD_HOST=prod.example.com
PROD_USER=deploy
PROD_DEPLOY_KEY=<ssh-private-key>

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

### Manual CI/CD Triggers

```bash
# Trigger workflow from CLI
gh workflow run ci-cd.yml --ref main

# View workflow status
gh run list

# View logs
gh run view <run-id> --log
```

---

## ☁️ Cloud Providers

### AWS Deployment

**Using ECR + ECS:**

```bash
# Create ECR repository
aws ecr create-repository --repository-name apptodo

# Push image
docker tag apptodo:latest <account-id>.dkr.ecr.<region>.amazonaws.com/apptodo:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/apptodo:latest

# Deploy using CloudFormation or Terraform
```

**Using Elastic Beanstalk:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker apptodo

# Create environment
eb create apptodo-prod --instance-type t3.medium

# Deploy
eb deploy

# View logs
eb logs

# Monitor
eb health
```

### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create apptodo-prod

# Set buildpack
heroku buildpacks:set heroku/docker

# Configure environment
heroku config:set SECRET_KEY=<key>
heroku config:set DEBUG=false

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=2
```

### DigitalOcean App Platform

```bash
# Install doctl
cd ~; cd .config/doctl/clusters/...

# Deploy via UI or API
doctl apps create --spec app.yaml
```

### Railway.app Deployment

```bash
# Connect GitHub repository
# Railway auto-detects from Dockerfile and docker-compose.yml

# Configure environment variables in dashboard
# Auto-deploys on git push
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# API health
curl https://api.example.com/health

# Database health
docker-compose exec backend python -c "
from app.database import SessionLocal
try:
    db = SessionLocal()
    db.execute('SELECT 1')
    print('Database OK')
except Exception as e:
    print(f'Database ERROR: {e}')
"

# Container health
docker-compose ps
docker stats
```

### Logs Management

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f nginx

# Rotate logs
docker-compose exec backend logrotate /etc/logrotate.conf

# Archive old logs
tar czf logs-backup-$(date +%Y%m%d).tar.gz ./logs/
```

### Backup Strategy

```bash
# Daily automated backups (via docker-compose.prod.yml)
# Location: ./backups/

# Manual backup
docker-compose exec backend sqlite3 ./data/app.db '.dump' | \
  gzip > backups/manual-backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Restore from backup
gunzip < backups/app-backup.sql.gz | sqlite3 ./data/app.db

# Cloud backup
aws s3 sync ./backups s3://apptodo-backups/
```

### Performance Monitoring

**Prometheus Metrics:**

```bash
# Start Prometheus
docker-compose --profile monitoring up -d prometheus

# Access: http://localhost:9090

# Key metrics:
# - HTTP request latency
# - Database query time
# - Memory usage
# - Disk I/O
```

**Grafana Dashboards:**

```bash
# Start Grafana
docker-compose --profile monitoring up -d grafana

# Access: http://localhost:3000
# Default: admin/admin

# Import dashboards:
# - Node Exporter Full
# - Prometheus Stats
# - Custom AppTodo Dashboard
```

### Uptime Monitoring

```bash
# UptimeRobot integration
POST https://api.uptimerobot.com/v2/monitorGroup

# AlertManager
curl -X POST https://alertmanager.example.com/api/v1/alerts
```

---

## 🔍 Troubleshooting

### Common Issues

#### Container won't start

```bash
# Check logs
docker-compose logs backend

# Verify image
docker images | grep apptodo

# Rebuild
docker-compose build --no-cache

# Check disk space
docker system df
```

#### Database connection error

```bash
# Check database service
docker-compose ps db

# Verify connection string
echo $DATABASE_URL

# Test connection
sqlite3 ./data/app.db "SELECT 1;"
```

#### High memory usage

```bash
# Check memory
docker stats

# Limit container memory
# In docker-compose.yml:
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 512M
```

#### Slow API responses

```bash
# Check slow queries
docker-compose exec backend python -m cProfile -s cumtime main.py

# Monitor database
docker-compose exec backend sqlite3 ./data/app.db "EXPLAIN QUERY PLAN SELECT ..."

# Check network
docker network inspect apptodo-network
```

#### SSL certificate issues

```bash
# Verify certificate
openssl x509 -in ssl/cert.pem -text -noout

# Renew certificate (Let's Encrypt)
certbot renew --quiet

# Check certificate expiration
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs --tail=100 -f
   ```

2. **Verify configuration:**
   ```bash
   docker-compose config
   ```

3. **Inspect containers:**
   ```bash
   docker-compose exec backend sh
   docker-compose exec backend env
   ```

4. **Test connectivity:**
   ```bash
   docker-compose exec backend curl http://localhost:8000/health
   docker-compose exec frontend curl http://backend:8000/health
   ```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vue.js Production Build](https://vitejs.dev/guide/build.html)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt SSL](https://letsencrypt.org/)

---

**Last Updated:** January 2026

For issues, contact: devops@example.com
