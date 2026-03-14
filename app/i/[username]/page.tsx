import { redirect } from 'next/navigation'

export default async function InviteRedirect({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  redirect(`/inregistrare?ref=${encodeURIComponent(username)}`)
}
