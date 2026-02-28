import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFileBuffer } from '@/lib/google-drive'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: post } = await supabase
      .from('carusel_posts')
      .select('drive_file_id, mime_type')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Imaginea nu a fost gasita' }, { status: 404 })
    }

    const { buffer, mimeType } = await getFileBuffer(post.drive_file_id)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType || post.mime_type,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
