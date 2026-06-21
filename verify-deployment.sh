#!/bin/bash

# MedSage Deployment - Post-Setup Verification Script
# Run this after deployment to verify everything is working

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     MedSage Deployment Verification Script (v1.0)        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${1:-http://localhost:3000}"
FRONTEND_URL="${2:-http://localhost:5173}"

echo -e "${BLUE}Configuration:${NC}"
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test Backend
echo -e "${YELLOW}Testing Backend...${NC}"
if curl -s "${BACKEND_URL}/api/v1/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
    
    # Get health details
    HEALTH=$(curl -s "${BACKEND_URL}/api/v1/health")
    echo "  Health status: $HEALTH"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "  Make sure backend is running"
    exit 1
fi

# Test Frontend (if local)
echo ""
echo -e "${YELLOW}Testing Frontend...${NC}"
if [[ $FRONTEND_URL == http://localhost* ]]; then
    if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
    else
        echo -e "${RED}✗ Frontend is not accessible${NC}"
        echo "  Make sure frontend is running"
    fi
fi

# Test API Endpoints
echo ""
echo -e "${YELLOW}Testing API Endpoints...${NC}"

echo -n "  GET /api/v1/health... "
if curl -s "${BACKEND_URL}/api/v1/health" -H "Content-Type: application/json" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Test Database Connection
echo ""
echo -e "${YELLOW}Testing Database Connection...${NC}"
echo -n "  Connection: "
if curl -s "${BACKEND_URL}/api/v1/health" | grep -q '"database"'; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ (Check backend logs)${NC}"
fi

# Test CORS (if frontend is different domain)
echo ""
echo -e "${YELLOW}Testing CORS Configuration...${NC}"
CORS_HEADER=$(curl -s -I "${BACKEND_URL}/api/v1/health" | grep -i "access-control-allow-origin" || echo "")
if [ -z "$CORS_HEADER" ]; then
    echo -e "${YELLOW}⚠ CORS headers not found${NC}"
    echo "  This is normal if not configured for specific domain"
else
    echo -e "${GREEN}✓ CORS configured${NC}"
    echo "  $CORS_HEADER"
fi

# Docker Status (if Docker available)
echo ""
echo -e "${YELLOW}Docker Status (if applicable)...${NC}"
if command -v docker &> /dev/null; then
    RUNNING=$(docker ps --filter "status=running" --format "{{.Names}}" | grep -c "medsage" || echo "0")
    TOTAL=$(docker ps -a --filter "name=medsage" --format "{{.Names}}" | wc -l || echo "0")
    
    if [ "$RUNNING" -gt 0 ]; then
        echo -e "${GREEN}✓ Docker containers running: $RUNNING${NC}"
        docker ps --filter "name=medsage" --format "table {{.Names}}\t{{.Status}}"
    else
        echo -e "${YELLOW}⚠ No running MedSage containers${NC}"
    fi
else
    echo "  Docker not installed"
fi

# Test Credentials
echo ""
echo -e "${YELLOW}Environment Check...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    
    # Check for critical env vars
    VARS=("MONGODB_URI" "GOOGLE_AI_API_KEY" "JWT_SECRET" "EMAIL_USER")
    for var in "${VARS[@]}"; do
        if grep -q "^$var=" .env; then
            echo "  ✓ $var configured"
        else
            echo "  ✗ $var NOT configured"
        fi
    done
else
    echo -e "${RED}✗ .env file not found${NC}"
fi

# Final Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Verification Complete!${NC}"
echo ""
echo "Next Steps:"
echo "  1. Open frontend: $FRONTEND_URL"
echo "  2. Try user registration"
echo "  3. Verify email sending"
echo "  4. Test chat with AI"
echo "  5. Check browser console for errors"
echo ""
echo "Useful Commands:"
echo "  View logs:       docker-compose logs -f backend"
echo "  Restart backend: docker-compose restart backend"
echo "  Stop services:   docker-compose down"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  Troubleshooting: MONITORING_TROUBLESHOOTING.md"
echo "  Full Guide:      DEPLOYMENT.md"
echo "  Quick Ref:       QUICK_START_DEPLOYMENT.md"
echo ""
