# Docker Setup for IELTS Mock Test

This document provides instructions for setting up and running the IELTS Mock Test application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd ielts-mock-test
   ```

2. **Set up environment variables:**
   ```bash
   cp docker.env .env.local
   ```
   Edit `.env.local` with your actual configuration values.

3. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Application: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

## Services

### PostgreSQL Database
- **Container:** `ielts-postgres`
- **Port:** 5432
- **Database:** `ielts_mock_test`
- **Username:** `ielts_user`
- **Password:** `ielts_password`

### Redis Cache
- **Container:** `ielts-redis`
- **Port:** 6379
- **Purpose:** Caching and session storage

### Next.js Application
- **Container:** `ielts-app`
- **Port:** 3000
- **Environment:** Production

### Database Setup
- **Container:** `ielts-db-setup`
- **Purpose:** Runs database migrations and seeding
- **Runs:** Once on startup

## Environment Variables

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NEXTAUTH_SECRET`: NextAuth.js secret key

### Optional Variables
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for file uploads
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `RESEND_API_KEY`: Resend API key for email functionality
- `EMAIL_FROM`: Email sender address

## Docker Commands

### Development
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
```

### Database Operations
```bash
# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Seed the database
docker-compose exec app npx prisma db seed

# Access database shell
docker-compose exec postgres psql -U ielts_user -d ielts_mock_test
```

### Maintenance
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Rebuild specific service
docker-compose build app

# Restart specific service
docker-compose restart app
```

## File Structure

```
ielts-mock-test/
├── Dockerfile              # Next.js application container
├── docker-compose.yml      # Multi-container orchestration
├── .dockerignore          # Files to exclude from Docker context
├── docker.env             # Environment variables template
├── init-db.sql            # Database initialization script
└── DOCKER_SETUP.md        # This documentation
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # If port 3000 is in use, stop the application and restart
   # Or change the port in docker-compose.yml
   ```

2. **Database connection issues:**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   # Check logs
   docker-compose logs postgres
   ```

3. **Build failures:**
   ```bash
   # Clean build cache
   docker-compose build --no-cache
   # Remove unused images
   docker image prune
   ```

4. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View logs for specific service
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f app
```

## Production Deployment

### Security Considerations

1. **Change default passwords:**
   - Update database credentials in `docker-compose.yml`
   - Use strong JWT secrets
   - Set secure NextAuth secrets

2. **Environment variables:**
   - Use Docker secrets or environment files
   - Never commit sensitive data to version control

3. **Network security:**
   - Use reverse proxy (nginx/traefik)
   - Enable SSL/TLS
   - Restrict database access

### Scaling

```bash
# Scale application instances
docker-compose up --scale app=3

# Use Docker Swarm for production
docker stack deploy -c docker-compose.yml ielts-stack
```

## Data Persistence

- **Database data:** Stored in `postgres_data` volume
- **Redis data:** Stored in `redis_data` volume
- **Uploads:** Mounted to `./uploads` directory
- **Test results:** Mounted to `./test-results` directory

## Backup and Restore

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U ielts_user ielts_mock_test > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U ielts_user ielts_mock_test < backup.sql
```

### Backup Volumes
```bash
# Backup postgres data
docker run --rm -v ielts-mock-test_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore postgres data
docker run --rm -v ielts-mock-test_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Monitoring

### Health Checks
```bash
# Check service health
docker-compose ps

# Check application health
curl http://localhost:3000/api/health
```

### Resource Usage
```bash
# View resource usage
docker stats

# View specific container stats
docker stats ielts-app
```

## Development vs Production

### Development
- Uses `docker-compose.yml` with development settings
- Hot reloading enabled
- Debug logging enabled
- Database seeded with test data

### Production
- Uses optimized Docker images
- Production environment variables
- Database migrations run automatically
- Logging configured for production

## Support

For issues related to Docker setup:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all required ports are available
4. Check Docker and Docker Compose versions

For application-specific issues, refer to the main README.md file.
