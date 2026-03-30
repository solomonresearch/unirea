/**
 * scripts/backfill-profile-slugs.ts
 *
 * Computes profile_slugs (from hobbies + domain + profession) for every row
 * in mentorship_profiles that doesn't have them yet.
 *
 * Run: npx tsx scripts/backfill-profile-slugs.ts
 */

import { createClient } from '@supabase/supabase-js'
import { extractSlugsFromProfile } from '../lib/taxonomy'

const SUPABASE_URL = 'https://bijgvffnjplvcpnejrdn.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpamd2ZmZuanBsdmNwbmVqcmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg0MTc1MCwiZXhwIjoyMDg2NDE3NzUwfQ.aaxkgcuPsI--TGuTSHDn8J1P9ubZ6JGOt4_kvDRRZvk'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Fetch all profiles with their structured tags
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, hobbies, domain, profession')

  if (error) { console.error('❌', error.message); process.exit(1) }

  console.log(`\n👤  ${profiles?.length ?? 0} profiles found\n`)

  let updated = 0
  let skipped = 0

  for (const p of profiles ?? []) {
    const profile_slugs = extractSlugsFromProfile(
      p.hobbies    ?? [],
      p.domain     ?? [],
      p.profession ?? [],
    )

    if (profile_slugs.length === 0) { skipped++; continue }

    const { error: upErr } = await supabase
      .from('mentorship_profiles')
      .update({ profile_slugs })
      .eq('user_id', p.id)

    if (upErr) {
      console.error(`   ❌  ${p.name}: ${upErr.message}`)
    } else {
      console.log(`   ✔  ${p.name}: [${profile_slugs.join(', ')}]`)
      updated++
    }
  }

  console.log(`\n✅  Done. ${updated} updated, ${skipped} had no profile tags.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
