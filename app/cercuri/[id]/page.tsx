import dynamic from 'next/dynamic'

const ColegProfilePage = dynamic(() => import('./ClientPage'), { ssr: false })

export function generateStaticParams() {
  return [{ id: '_' }]
}

export default function Page() {
  return <ColegProfilePage />
}
