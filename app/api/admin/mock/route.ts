import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

async function requireAdmin() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function DELETE() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceRoleClient()

  // Find all bot profiles
  const { data: bots, error: findError } = await service
    .from('profiles')
    .select('id')
    .eq('is_bot', true)

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!bots || bots.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  const ids = bots.map(b => b.id)

  // Delete related data first (children before parents)
  const cleanupTables = [
    { table: 'notifications', column: 'user_id' },
    { table: 'notifications', column: 'actor_id' },
    { table: 'analytics_events', column: 'user_id' },
    { table: 'announcement_votes', column: 'user_id' },
    { table: 'announcement_comments', column: 'user_id' },
    { table: 'announcements', column: 'user_id' },
    { table: 'avizier_post_votes', column: 'user_id' },
    { table: 'avizier_post_comments', column: 'user_id' },
    { table: 'avizier_posts', column: 'user_id' },
    { table: 'post_votes', column: 'user_id' },
    { table: 'comments', column: 'user_id' },
    { table: 'posts', column: 'user_id' },
    { table: 'kanban_cards', column: 'created_by' },
    { table: 'carusel_likes', column: 'user_id' },
    { table: 'carusel_comments', column: 'user_id' },
    { table: 'carusel_posts', column: 'user_id' },
    { table: 'ziar_posts', column: 'user_id' },
    { table: 'messages', column: 'sender_id' },
    { table: 'conversation_participants', column: 'user_id' },
    { table: 'eveniment_participanti', column: 'user_id' },
    { table: 'evenimente', column: 'user_id' },
    { table: 'referrals', column: 'referred_id' },
    { table: 'referrals', column: 'referrer_id' },
    { table: 'quiz_peeks', column: 'user_id' },
    { table: 'quiz_responses', column: 'user_id' },
  ]

  for (const { table, column } of cleanupTables) {
    await service.from(table).delete().in(column, ids)
  }

  // Clear referred_by references pointing to bot profiles
  await service
    .from('profiles')
    .update({ referred_by: null })
    .in('referred_by', ids)

  // Delete profiles
  const { error: profileError } = await service
    .from('profiles')
    .delete()
    .in('id', ids)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Delete auth users
  let authErrors = 0
  for (const id of ids) {
    const { error } = await service.auth.admin.deleteUser(id)
    if (error) authErrors++
  }

  return NextResponse.json({
    deleted: ids.length,
    authErrors,
  })
}
