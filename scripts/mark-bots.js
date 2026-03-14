// Mark bot profiles in the database
// Run with: source .env && node scripts/mark-bots.js
//
// First run with --dry-run to preview which profiles will be marked:
//   source .env && node scripts/mark-bots.js --dry-run

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DRY_RUN = process.argv.includes('--dry-run')

async function run() {
  // 1. Ensure column exists
  console.log('Ensuring is_bot column exists...')
  await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false'
  }).maybeSingle()

  // 2. Find candidates: non-real users (bot emails, generated names, etc.)
  const { data: allProfiles, error } = await supabase
    .from('profiles')
    .select('id, name, username, email')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching profiles:', error.message)
    return
  }

  const botIds = []
  const botProfiles = []

  for (const p of allProfiles) {
    const email = (p.email || '').toLowerCase()
    const name = (p.name || '').toLowerCase()
    const username = (p.username || '').toLowerCase()

    const isBot =
      email.includes('@bot.') ||
      email.includes('+bot') ||
      email.startsWith('bot-') ||
      email.startsWith('bot_') ||
      email.includes('@test.') ||
      email.includes('+mock') ||
      email.startsWith('mock-') ||
      email.startsWith('fake-') ||
      email.startsWith('test-') ||
      name.startsWith('bot ') ||
      name.endsWith(' bot') ||
      username.startsWith('bot_') ||
      username.startsWith('bot-')

    if (isBot) {
      botIds.push(p.id)
      botProfiles.push(p)
    }
  }

  console.log(`\nFound ${botProfiles.length} bot profiles out of ${allProfiles.length} total:`)
  botProfiles.forEach(p => {
    console.log(`  ${p.name} (@${p.username}) — ${p.email}`)
  })

  if (botIds.length === 0) {
    console.log('\nNo bots found. If bots use a different email/name pattern, edit the matching rules in this script.')
    return
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes made. Run without --dry-run to mark these profiles.')
    return
  }

  // 3. Mark them
  const { error: updateError, count } = await supabase
    .from('profiles')
    .update({ is_bot: true })
    .in('id', botIds)

  if (updateError) {
    console.error('Error marking bots:', updateError.message)
  } else {
    console.log(`\n✓ Marked ${botIds.length} profiles as is_bot = true`)
  }
}

run().catch(console.error)
