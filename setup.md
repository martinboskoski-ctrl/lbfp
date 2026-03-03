ecommended setup (all free tiers available)
                                                                                      
  1. Database → MongoDB Atlas                                                         

  - Go to https://cloud.mongodb.com
  - Create a free M0 cluster
  - It gives you a MONGO_URI connection string to use in the backend

  2. Backend (Express) → Railway or Render

  Railway (https://railway.app) is the easiest:
  - Connect your GitHub repo
  - Point it to the server/ folder
  - Add environment variables (MONGO_URI, JWT_SECRET, PORT)
  - It auto-deploys on every git push

  Render (https://render.com) is the free alternative (slower cold starts on free
  tier)

  3. Frontend (React/Vite) → Vercel

  - Connect your GitHub repo to Vercel
  - Set root directory to client/
  - Add one env variable: VITE_API_URL=https://your-railway-backend-url/api
  - Auto-deploys on every git push

  ---
  The flow

  Browser → Vercel (React frontend)
                  ↓ API calls
           Railway (Express backend)
                  ↓
           MongoDB Atlas


For local:
http://localhost:5173/login
martinboshkoski@Martins-MacBook-Air ~ % cd /Users/martinboshkoski/packflow && ./start.sh


./start.sh