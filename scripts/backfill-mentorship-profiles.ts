/**
 * scripts/backfill-mentorship-profiles.ts
 *
 * Creates an empty mentorship_profiles row for every user who doesn't have one yet.
 * Safe to run multiple times — uses upsert with onConflict: 'user_id'.
 *
 * Run: npx tsx scripts/backfill-mentorship-profiles.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bijgvffnjplvcpnejrdn.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpamd2ZmZuanBsdmNwbmVqcmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg0MTc1MCwiZXhwIjoyMDg2NDE3NzUwfQ.aaxkgcuPsI--TGuTSHDn8J1P9ubZ6JGOt4_kvDRRZvk'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Fetch all profiles that have no mentorship_profiles row yet
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, name, highschool')
    .not('highschool', 'is', null)

  if (profilesErr) {
    console.error('❌  Failed to fetch profiles:', profilesErr.message)
    process.exit(1)
  }

  if (!profiles?.length) {
    console.log('No profiles found.')
    return
  }

  // Fetch all existing mentorship_profiles user_ids
  const { data: existing, error: existingErr } = await supabase
    .from('mentorship_profiles')
    .select('user_id')

  if (existingErr) {
    console.error('❌  Failed to fetch existing mentorship_profiles:', existingErr.message)
    process.exit(1)
  }

  const existingIds = new Set((existing ?? []).map(r => r.user_id))

  const missing = profiles.filter(p => !existingIds.has(p.id))

  console.log(`\n👤  Total profiles: ${profiles.length}`)
  console.log(`✅  Already have mentorship row: ${existingIds.size}`)
  console.log(`➕  To backfill: ${missing.length}\n`)

  if (missing.length === 0) {
    console.log('Nothing to do.')
    return
  }

  const rows = missing.map(p => ({
    user_id:       p.id,
    highschool:    p.highschool,
    mentor_text:   null,
    mentor_active: false,
    mentor_slugs:  [],
    mentee_text:   null,
    mentee_active: false,
    mentee_slugs:  [],
  }))

  // Insert in batches of 100 to avoid request size limits
  const BATCH = 100
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('mentorship_profiles')
      .upsert(batch, { onConflict: 'user_id' })

    if (error) {
      console.error(`❌  Batch ${i}–${i + batch.length} failed: ${error.message}`)
    } else {
      inserted += batch.length
      console.log(`   ✔  ${inserted}/${missing.length}`)
    }
  }

  console.log(`\n✅  Done. ${inserted} rows created.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
