import dynamic from 'next/dynamic'

const InvitePage = dynamic(() => import('./ClientPage'), { ssr: false })

export function generateStaticParams() {
  return [{ code: '_' }]
}

export default function Page() {
  return <InvitePage />
}
