import dynamic from 'next/dynamic'

const ChatPage = dynamic(() => import('./ClientPage'), { ssr: false })

export default function Page() {
  return <ChatPage />
}
