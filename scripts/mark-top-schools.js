// Script to mark top 100 schools in the database
// Run with: source .env && node scripts/mark-top-schools.js

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TOP_SCHOOLS = [
  { name: 'Gheorghe Lazăr', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Colegiul Național', city: 'IAŞI', judet: 'IS', exact: 'Colegiul Național' },
  { name: 'Tudor Vianu', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Sfântul Sava', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Emil Racoviță', city: 'CLUJ', judet: 'CJ' },
  { name: 'Emil Racoviță', city: 'IAŞI', judet: 'IS' },
  { name: 'Unirea', city: 'FOCŞANI', judet: 'VN' },
  { name: 'Andrei Șaguna', city: 'BRAŞOV', judet: 'BV' },
  { name: 'Costache Negruzzi', city: 'IAŞI', judet: 'IS' },
  { name: 'Vasile Alecsandri', city: 'GALAŢI', judet: 'GL' },
  { name: 'Mircea cel Bătrân', city: 'CONSTANŢA', judet: 'CT' },
  { name: 'George Coșbuc', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Nicolae Bălcescu', city: 'CLUJ', judet: 'CJ' },
  { name: 'Gheorghe Munteanu Murgoci', city: 'BRĂILA', judet: 'BR' },
  { name: 'Ştefan cel Mare', city: 'SUCEAVA', judet: 'SV' },
  { name: 'Nicolae Grigorescu', city: 'CÂMPINA', judet: 'PH' },
  { name: 'Mihai Eminescu', city: 'IAŞI', judet: 'IS' },
  { name: 'Avram Iancu', city: 'CLUJ', judet: 'CJ' },
  { name: 'Gheorghe Şincai', city: 'CLUJ', judet: 'CJ' },
  { name: 'Ion C. Brătianu', city: 'PITEŞTI', judet: 'AG' },
  { name: 'Spiru Haret', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Grigore Moisil', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Costache Negri', city: 'GALAŢI', judet: 'GL' },
  { name: 'Horea, Cloşca şi Crişan', city: 'ALBA', judet: 'AB' },
  { name: 'Ioan Meşotă', city: 'BRAŞOV', judet: 'BV' },
  { name: 'Gheorghe Vrânceanu', city: 'BACĂU', judet: 'BC' },
  { name: 'Mihai Viteazul', city: 'ALBA', judet: 'AB', extra: 'Militar' },
  { name: 'Matei Basarab', city: 'RÂMNICU', judet: 'VL', extra: 'Informatică' },
  { name: 'Emanuil Gojdu', city: 'ORADEA', judet: 'BH' },
  { name: 'Fraţii Buzeşti', city: 'CRAIOVA', judet: 'DJ' },
  { name: 'Mihai Viteazul', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Petru Rareş', city: 'SUCEAVA', judet: 'SV' },
  { name: 'Constantin Diaconovici Loga', city: 'TIMIŞOARA', judet: 'TM' },
  { name: 'Calistrat Hogaş', city: 'PIATRA', judet: 'NT' },
  { name: 'Matei Basarab', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'B.P. Hasdeu', city: 'BUZĂU', judet: 'BZ' },
  { name: 'Grigore Moisil', city: 'IAŞI', judet: 'IS', extra: 'Informatică' },
  { name: 'Ion Creangă', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Gheorghe Şincai', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Ferdinand', city: 'BACĂU', judet: 'BC' },
  { name: 'Vasile Alecsandri', city: 'IAŞI', judet: 'IS' },
  { name: 'Eudoxiu Hurmuzachi', city: 'RĂDĂUŢI', judet: 'SV' },
  { name: 'Zinca Golescu', city: 'PITEŞTI', judet: 'AG' },
  { name: 'Grigore Moisil', city: 'TIMIŞOARA', judet: 'TM' },
  { name: 'Mihail Kogălniceanu', city: 'GALAŢI', judet: 'GL' },
  { name: 'Petru Rareş', city: 'PIATRA', judet: 'NT' },
  { name: 'Samuel von Brukenthal', city: 'SIBIU', judet: 'SB' },
  { name: 'Gheorghe Lazăr', city: 'SIBIU', judet: 'SB' },
  { name: 'Ovidius', city: 'CONSTANŢA', judet: 'CT' },
  { name: 'Mihai Eminescu', city: 'BOTOŞANI', judet: 'BT' },
  { name: 'Octavian Goga', city: 'SIBIU', judet: 'SB' },
  { name: 'Moise Nicoară', city: 'ARAD', judet: 'AR' },
  { name: 'Preparandia', city: 'ARAD', judet: 'AR' },
  { name: 'Tiberiu Popoviciu', city: 'CLUJ', judet: 'CJ' },
  { name: 'Roman Vodă', city: 'ROMAN', judet: 'NT' },
  { name: 'Mihai Viteazul', city: 'PLOIEŞTI', judet: 'PH' },
  { name: 'Constantin Carabella', city: 'TÂRGOVIŞTE', judet: 'DB' },
  { name: 'Nichita Stănescu', city: 'PLOIEŞTI', judet: 'PH' },
  { name: 'Traian Lalescu', city: 'REŞIŢA', judet: 'CS' },
  { name: 'Grigore Moisil', city: 'TULCEA', judet: 'TL' },
  { name: 'Elena Cuza', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Cantemir Vodă', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Constantin Cantacuzino', city: 'TÂRGOVIŞTE', judet: 'DB' },
  { name: 'Regina Maria', city: 'PLOIEŞTI', judet: 'PH' },
  { name: 'Alexandru Ioan Cuza', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Ion Luca Caragiale', city: 'PLOIEŞTI', judet: 'PH' },
  { name: 'Al. I. Cuza', city: 'FOCŞANI', judet: 'VN' },
  { name: 'Dimitrie Cantemir', city: 'BREAZA', judet: 'PH', extra: 'Militar' },
  { name: 'Mihai Eminescu', city: 'CONSTANŢA', judet: 'CT' },
  { name: 'Traian', city: 'CONSTANŢA', judet: 'CT' },
  { name: 'I.L. Caragiale', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Decebal', city: 'DEVA', judet: 'HD' },
  { name: 'Iancu de Hunedoara', city: 'HUNEDOARA', judet: 'HD' },
  { name: 'Lucian Blaga', city: 'CLUJ', judet: 'CJ' },
  { name: 'Gheorghe Lazăr', city: 'TIMIŞOARA', judet: 'TM' },
  { name: 'Dragoş Vodă', city: 'CÂMPULUNG', judet: 'SV' },
  { name: 'Nicu Gane', city: 'FĂLTICENI', judet: 'SV' },
  { name: 'Iosif Vulcan', city: 'ORADEA', judet: 'BH' },
  { name: 'Onisifor Ghibu', city: 'ORADEA', judet: 'BH' },
  { name: 'C.A. Rosetti', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Carol I', city: 'CRAIOVA', judet: 'DJ' },
  { name: 'Elena Ghiba Birta', city: 'ARAD', judet: 'AR' },
  { name: 'Lucian Blaga', city: 'SEBEŞ', judet: 'AB' },
  { name: 'Alexandru Papiu Ilarian', city: 'TÂRGU MUREŞ', judet: 'MS' },
  { name: 'Unirea', city: 'TÂRGU MUREŞ', judet: 'MS' },
  { name: 'Mihai Eminescu', city: 'ORADEA', judet: 'BH' },
  { name: 'Gheorghe Roşca Codreanu', city: 'BÂRLAD', judet: 'VS' },
  { name: 'Carmen Sylva', city: 'TIMIŞOARA', judet: 'TM' },
  { name: 'Ion Neculce', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Ienăchiţă Văcărescu', city: 'TÂRGOVIŞTE', judet: 'DB' },
  { name: 'Mihai Eminescu', city: 'SATU MARE', judet: 'SM' },
  { name: 'Doamna Stanca', city: 'FĂGĂRAŞ', judet: 'BV' },
  { name: 'Nicolae Bălcescu', city: 'BRĂILA', judet: 'BR' },
  { name: 'Anastasescu', city: 'ROŞIORII', judet: 'TR' },
  { name: 'Alexandru Lahovari', city: 'RÂMNICU', judet: 'VL' },
  { name: 'Tudor Vladimirescu', city: 'TÂRGU JIU', judet: 'GJ' },
  { name: 'Ecaterina Teodoroiu', city: 'TÂRGU JIU', judet: 'GJ' },
  { name: 'Silvania', city: 'ZALĂU', judet: 'SJ' },
  { name: 'Mihai Eminescu', city: 'BUCUREŞTI', judet: 'B' },
  { name: 'Liviu Rebreanu', city: 'BISTRIŢA', judet: 'BN' },
]

async function run() {
  // First add the column
  console.log('Adding top_school column...')
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS top_school boolean NOT NULL DEFAULT false'
  }).maybeSingle()
  // If rpc doesn't exist, we'll handle it via migration

  let matched = 0
  let unmatched = []

  for (let i = 0; i < TOP_SCHOOLS.length; i++) {
    const s = TOP_SCHOOLS[i]

    // Query: match name substring + judet, with city containing our city string
    let query = supabase
      .from('schools')
      .select('id, denumire_lunga_unitate, localitate_unitate, judet_pj')
      .eq('judet_pj', s.judet)
      .ilike('denumire_lunga_unitate', `%${s.name}%`)

    if (s.city) {
      query = query.ilike('localitate_unitate', `%${s.city}%`)
    }

    // Filter for Colegiu/Liceu only
    const { data } = await query.limit(10)

    if (!data || data.length === 0) {
      unmatched.push({ index: i + 1, ...s })
      continue
    }

    // If extra keyword specified, filter further
    let candidates = data
    if (s.extra) {
      const filtered = data.filter(d => d.denumire_lunga_unitate.toUpperCase().includes(s.extra.toUpperCase()))
      if (filtered.length > 0) candidates = filtered
    }

    // Filter for Colegiu/Liceu
    const highschools = candidates.filter(d => {
      const upper = d.denumire_lunga_unitate.toUpperCase()
      return upper.includes('COLEGIU') || upper.includes('LICEU')
    })

    const final = highschools.length > 0 ? highschools : candidates

    if (final.length === 0) {
      unmatched.push({ index: i + 1, ...s })
      continue
    }

    // For "Colegiul Național" in Iași (entry #2), we need the one that's literally just "Colegiul Național"
    if (s.exact) {
      const exactMatch = final.filter(d => {
        const clean = d.denumire_lunga_unitate.replace(/[„""']/g, '').trim()
        return clean === s.exact || clean.startsWith(s.exact + ' ') === false
      })
    }

    const ids = final.map(d => d.id)
    const { error } = await supabase
      .from('schools')
      .update({ top_school: true })
      .in('id', ids)

    if (error) {
      console.log(`  ERROR marking #${i+1} ${s.name}: ${error.message}`)
      unmatched.push({ index: i + 1, ...s, error: error.message })
    } else {
      matched++
      console.log(`  ✓ #${i+1} ${s.name} (${s.city}) → ${final.length} match(es): ${final.map(f => f.denumire_lunga_unitate).join(' | ')}`)
    }
  }

  console.log(`\n=== RESULTS ===`)
  console.log(`Matched: ${matched}/${TOP_SCHOOLS.length}`)
  if (unmatched.length > 0) {
    console.log(`\nUNMATCHED (${unmatched.length}):`)
    unmatched.forEach(u => console.log(`  #${u.index} ${u.name} (${u.city}, ${u.judet})`))
  }
}

run().catch(console.error)
