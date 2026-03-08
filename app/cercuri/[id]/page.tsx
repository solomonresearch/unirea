import dynamic from 'next/dynamic'

const ColegProfilePage = dynamic(() => import('./ClientPage'), { ssr: false })

export default function Page() {
  return <ColegProfilePage />
}
