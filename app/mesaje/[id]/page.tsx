import dynamic from 'next/dynamic'

const ChatPage = dynamic(() => import('./ClientPage'), { ssr: false })

export function generateStaticParams() {
  return [{ id: '_' }]
}

export default function Page() {
  return <ChatPage />
}
