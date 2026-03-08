import dynamic from 'next/dynamic'

const InvitePage = dynamic(() => import('./ClientPage'), { ssr: false })

export default function Page() {
  return <InvitePage />
}
