import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { ChatApp } from '@/components/ChatApp'
import { MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h1 className="text-3xl font-bold mb-4">Welcome to Tars Chat</h1>
            <p className="text-gray-600 mb-6">Connect and chat with your friends in real-time</p>
            <SignInButton className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors" />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="h-screen">
          <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold">Tars Chat</h1>
            </div>
            <UserButton />
          </header>
          <ChatApp />
        </div>
      </SignedIn>
    </div>
  )
}