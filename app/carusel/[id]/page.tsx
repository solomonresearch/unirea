import dynamic from 'next/dynamic'

const CaruselPostPage = dynamic(() => import('./ClientPage'), { ssr: false })

export default function Page() {
  return <CaruselPostPage />
}
