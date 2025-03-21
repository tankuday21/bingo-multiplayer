# Bingo Multiplayer Game

A real-time multiplayer bingo game built with Next.js, Socket.IO, and MongoDB.

## Features

- Real-time multiplayer gameplay
- Room-based game system
- Leaderboard
- Responsive design
- Dark/Light theme support

## Tech Stack

- Next.js 14
- Socket.IO
- MongoDB
- Tailwind CSS
- TypeScript

## Deployment Instructions

### Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Heroku account (for backend)
- Vercel account (for frontend)

### Backend Deployment (Heroku)

1. Create a new Heroku app:
   ```bash
   heroku create bingo-socket-server
   ```

2. Set up environment variables in Heroku:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://bingo-multiplayer.vercel.app
   ```

3. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Set up environment variables in Vercel:
   - NEXT_PUBLIC_SOCKET_URL=https://bingo-socket-server.herokuapp.com

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bingo-multiplayer.git
   cd bingo-multiplayer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your development environment variables

4. Start the development server:
   ```bash
   npm run dev:all
   ```

## Environment Variables

- `NEXT_PUBLIC_SOCKET_URL`: Socket.IO server URL
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: MongoDB database name
- `PORT`: Server port
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origin
- `JWT_SECRET`: Secret key for JWT

## License

MIT
