# Tars Chat

A real-time live chat messaging web app built with Next.js, TypeScript, Convex, and Clerk.

## Features

- User authentication with Clerk
- Real-time messaging with Convex
- User discovery and search
- One-on-one and group conversations
- Online/offline status
- Typing indicators
- Message timestamps
- Message reactions
- Delete own messages
- Responsive design

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Clerk:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Copy the publishable key and secret key
   - Update `.env.local` with your keys

3. Set up Convex:
   - Install Convex CLI: `npm install -g convex`
   - Run `convex dev` in the project root
   - This will create a Convex deployment
   - Copy the deployment URL to `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

- Deploy to Vercel
- Set environment variables in Vercel dashboard
- Convex will auto-deploy on push

## Code Explanation

The app uses:
- **Next.js App Router** for routing and server components
- **TypeScript** for type safety
- **Convex** for backend database and real-time subscriptions
- **Clerk** for authentication and user management
- **Tailwind CSS** for styling

Key components:
- `Providers`: Wraps the app with Clerk and Convex providers
- `ChatApp`: Main chat interface, handles user sync and conversation selection
- `Sidebar`: Lists users and conversations with search
- `ChatArea`: Displays messages and handles sending

Real-time features are powered by Convex's live queries, automatically updating the UI when data changes.