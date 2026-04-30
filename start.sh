#!/bin/bash
# Uruchamia backend i frontend równocześnie
# Użycie: ./start.sh

echo "🃏 Pauper Oracle — uruchamianie..."

# Backend
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✓ Backend PID: $BACKEND_PID (http://localhost:8000)"

# Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend PID: $FRONTEND_PID (http://localhost:5173)"

echo ""
echo "Naciśnij Ctrl+C żeby zatrzymać oba procesy."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
