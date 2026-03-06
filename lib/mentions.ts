import type { SupabaseClient } from '@supabase/supabase-js'

const MENTION_REGEX = /@([a-z0-9._]+)/g

export function extractMentions(text: string): string[] {
  const matches = text.match(MENTION_REGEX)
  if (!matches) return []
  const usernames = matches.map(m => m.slice(1))
  return [...new Set(usernames)]
}

export async function processMentions(
  supabase: SupabaseClient,
  actorId: string,
  content: string,
  context: 'avizier' | 'tabla' | 'carusel' | 'mesaje' | 'ziar',
  referenceId?: string
) {
  const usernames = extractMentions(content)
  if (usernames.length === 0) return

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', usernames)

  if (!users || users.length === 0) return

  const preview = content.length > 100 ? content.slice(0, 100) + '...' : content

  const notifications = users
    .filter(u => u.id !== actorId)
    .map(u => ({
      user_id: u.id,
      actor_id: actorId,
      type: 'mention' as const,
      context,
      reference_id: referenceId,
      content_preview: preview,
    }))

  if (notifications.length === 0) return

  await supabase.from('notifications').insert(notifications)
}
