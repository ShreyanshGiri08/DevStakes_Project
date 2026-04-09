#!/bin/bash

# Start the Backend
echo "🚀 Starting backend API on http://127.0.0.1:8000..."
cd backend
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

# Start the Frontend
echo "🚀 Starting frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are running!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Backend: http://127.0.0.1:8000"
echo "Press Ctrl+C to stop both servers."

# Keep script running and catch Ctrl+C
trap "echo 'Terminating servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
