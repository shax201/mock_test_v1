-- Database initialization script for Docker
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable in docker-compose.yml)

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';
