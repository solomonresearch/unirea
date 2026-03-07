import dynamic from 'next/dynamic'

const CaruselPostPage = dynamic(() => import('./ClientPage'), { ssr: false })

export function generateStaticParams() {
  return [{ id: '_' }]
}

export default function Page() {
  return <CaruselPostPage />
}
