/**
 * scripts/recompute-slugs.ts
 *
 * Re-runs extractSlugs on mentor_text / mentee_text for every row in
 * mentorship_profiles and writes the results back into mentor_slugs / mentee_slugs.
 *
 * Safe to run multiple times — idempotent.
 * Pass a username to limit to one user:  npx tsx scripts/recompute-slugs.ts victor
 *
 * Run: npx tsx scripts/recompute-slugs.ts
 */

import { createClient } from '@supabase/supabase-js'
import { extractSlugs } from '../lib/taxonomy'

const SUPABASE_URL = 'https://bijgvffnjplvcpnejrdn.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpamd2ZmZuanBsdmNwbmVqcmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg0MTc1MCwiZXhwIjoyMDg2NDE3NzUwfQ.aaxkgcuPsI--TGuTSHDn8J1P9ubZ6JGOt4_kvDRRZvk'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const filterUsername = process.argv[2]?.toLowerCase()

async function main() {
  let query = supabase
    .from('mentorship_profiles')
    .select('user_id, mentor_text, mentee_text, profiles(name, username)')

  if (filterUsername) {
    query = query.ilike('profiles.username', `%${filterUsername}%`) as typeof query
  }

  const { data: rows, error } = await query

  if (error) { console.error('❌', error.message); process.exit(1) }

  const targets = filterUsername
    ? rows?.filter(r => {
        const p = r.profiles as { username?: string } | null
        return p?.username?.toLowerCase().includes(filterUsername)
      })
    : rows

  console.log(`\n📋  Processing ${targets?.length ?? 0} row(s)...\n`)

  for (const row of targets ?? []) {
    const p = row.profiles as { name?: string; username?: string } | null
    const mentor_slugs = extractSlugs(row.mentor_text ?? '')
    const mentee_slugs = extractSlugs(row.mentee_text ?? '')

    console.log(`👤  ${p?.name ?? row.user_id} (@${p?.username ?? '?'})`)
    console.log(`   mentor_text  : ${row.mentor_text ? `"${row.mentor_text.slice(0, 60)}…"` : '(empty)'}`)
    console.log(`   mentor_slugs : [${mentor_slugs.join(', ') || '—'}]`)
    console.log(`   mentee_text  : ${row.mentee_text ? `"${row.mentee_text.slice(0, 60)}…"` : '(empty)'}`)
    console.log(`   mentee_slugs : [${mentee_slugs.join(', ') || '—'}]`)

    const { error: upErr } = await supabase
      .from('mentorship_profiles')
      .update({ mentor_slugs, mentee_slugs })
      .eq('user_id', row.user_id)

    if (upErr) console.error(`   ❌  ${upErr.message}`)
    else console.log(`   ✅  Updated\n`)
  }

  console.log('Done.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
