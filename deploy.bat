@echo off
REM MedSage Deployment Quick Start Script for Windows
REM Run this after configuring environment variables

echo.
echo ====================================
echo MedSage Deployment Started
echo ====================================
echo.

REM Check Docker installation
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo - Docker is installed

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed
    pause
    exit /b 1
)
echo - Docker Compose is installed

REM Check .env file
if not exist ".env" (
    echo.
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo ERROR: .env file created from template.
    echo Please edit .env with your configuration and run this script again.
    echo Opening .env in notepad...
    notepad .env
    pause
    exit /b 1
)

echo - .env file found

REM Build and start containers
echo.
echo Building Docker images...
docker-compose build
if errorlevel 1 (
    echo ERROR: Docker build failed
    pause
    exit /b 1
)

echo.
echo Starting services...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

REM Wait for services to be ready
echo.
echo Waiting for services to be ready (30 seconds)...
timeout /t 30 /nobreak

REM Display status
echo.
echo ====================================
echo Deployment completed!
echo ====================================
echo.
echo Service URLs:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo   API Docs:  http://localhost:3000/api/v1/health
echo.
echo Useful commands:
echo   View logs:        docker-compose logs -f
echo   View backend:     docker-compose logs -f backend
echo   Stop services:    docker-compose down
echo   Restart backend:  docker-compose restart backend
echo.

pause
