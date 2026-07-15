#!/bin/bash
echo "======================================================================"
echo "  Starting AntiFraud Monitoring System Containers..."
echo "======================================================================"
echo

docker compose up --build -d

echo
echo "======================================================================"
echo "  System launched successfully!"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:8000"
echo "======================================================================"
