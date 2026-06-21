#!/bin/bash

# MedSage Deployment Quick Start Script
# Run this after configuring environment variables

set -e

echo "🚀 MedSage Deployment Started"
echo "================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose installed${NC}"

# Check .env file
if [ ! -f .env ]; then
    echo -e "${RED}.env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env with your configuration and run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Load environment variables
export $(cat .env | xargs)

# Build and start containers
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check MongoDB
echo -e "${YELLOW}Checking MongoDB connection...${NC}"
docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && \
    echo -e "${GREEN}✓ MongoDB is ready${NC}" || \
    echo -e "${RED}✗ MongoDB failed${NC}"

# Check Redis
echo -e "${YELLOW}Checking Redis connection...${NC}"
docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 && \
    echo -e "${GREEN}✓ Redis is ready${NC}" || \
    echo -e "${RED}✗ Redis failed${NC}"

# Check Backend
echo -e "${YELLOW}Checking Backend health...${NC}"
sleep 5
curl -s http://localhost:3000/api/v1/health > /dev/null && \
    echo -e "${GREEN}✓ Backend is ready${NC}" || \
    echo -e "${RED}✗ Backend failed${NC}"

echo -e "${GREEN}================================"
echo "✓ Deployment completed successfully!"
echo "================================${NC}"
echo ""
echo "Service URLs:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3000"
echo "  API Docs:  http://localhost:3000/api/v1/health"
echo ""
echo "View logs:"
echo "  All services: docker-compose logs -f"
echo "  Backend only: docker-compose logs -f backend"
echo "  MongoDB only: docker-compose logs -f mongodb"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
