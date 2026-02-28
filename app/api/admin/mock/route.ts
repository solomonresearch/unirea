import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

const LAST_NAMES = [
  'Popescu', 'Ionescu', 'Popa', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe',
  'Rusu', 'Munteanu', 'Matei', 'Constantin', 'Serban', 'Marin', 'Molnar',
  'Lazar', 'Florea', 'Ciobanu', 'Nistor', 'Dinu', 'Mihai', 'Radu',
  'Barbu', 'Tudor', 'Neagu', 'Dragomir', 'Ungureanu', 'Cojocaru', 'Ene',
  'Diaconu', 'Preda', 'Voicu', 'Manole', 'Tanase', 'Lupu', 'Filip',
  'Anghel', 'Vasile', 'Cristea', 'Oprea', 'Sandu',
]

const HOBBY_LABELS = [
  'Gratar', 'Fotbal', 'Muzica', 'Cafea', 'Filme', 'Drumetii', 'Gatit',
  'Calatorii', 'Vin', 'Pescuit', 'Fitness', 'Gradinarit', 'Table',
  'Barbut', 'Poker', 'Gaming', 'Dans', 'Lectura', 'Fotografie', 'Politica',
  'Camping', 'Animale', 'Ciclism', 'Vanatoare', 'Baschet', 'Teatru',
  'Arta', 'Tehnologie', 'Voluntariat', 'Podcast', 'Ski', 'Sah', 'Auto',
  'Anime', 'Istorie', 'Cosmetice', 'Dezvoltare personala', 'Spiritualitate',
  'Religie', 'Natura',
]

const PROF_SUBSET = [
  'Inginer', 'Profesor', 'Medic', 'Avocat', 'Programator', 'Contabil',
  'Arhitect', 'Economist', 'Farmacist', 'Designer', 'Jurnalist', 'Psiholog',
  'Antreprenor', 'Manager', 'Consultant', 'Dentist', 'Veterinar',
  'Electrician', 'Bucatar', 'Fotograf',
]

const DOMAIN_SUBSET = [
  'Informatica', 'Educatie', 'Sanatate', 'Drept', 'Finante', 'Constructii',
  'Agricultura', 'Turism', 'Marketing', 'Cercetare', 'Energie',
  'Transport', 'Cultura', 'Sport', 'Comert',
]

const HIGHSCHOOL_TEMPLATES = [
  'Colegiul National "{city}"',
  'Liceul Teoretic "Ion Creanga" {city}',
  'Colegiul Tehnic "Gheorghe Asachi" {city}',
  'Liceul de Arte "{city}"',
  'Colegiul Economic "Virgil Madgearu" {city}',
]

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']

const WEIGHTED_CITIES: { city: string; county: string; weight: number; lat: number; lng: number }[] = [
  { city: 'Bucuresti', county: 'B', weight: 80, lat: 44.4268, lng: 26.1025 },
  { city: 'Cluj-Napoca', county: 'CJ', weight: 30, lat: 46.7712, lng: 23.6236 },
  { city: 'Timisoara', county: 'TM', weight: 30, lat: 45.7489, lng: 21.2087 },
  { city: 'Iasi', county: 'IS', weight: 30, lat: 47.1585, lng: 27.6014 },
  { city: 'Constanta', county: 'CT', weight: 25, lat: 44.1598, lng: 28.6348 },
  { city: 'Craiova', county: 'DJ', weight: 20, lat: 44.3302, lng: 23.7949 },
  { city: 'Brasov', county: 'BV', weight: 20, lat: 45.6427, lng: 25.5887 },
  { city: 'Galati', county: 'GL', weight: 15, lat: 45.4353, lng: 28.0080 },
  { city: 'Ploiesti', county: 'PH', weight: 15, lat: 44.9462, lng: 26.0256 },
  { city: 'Oradea', county: 'BH', weight: 15, lat: 47.0465, lng: 21.9189 },
  { city: 'Braila', county: 'BR', weight: 10, lat: 45.2652, lng: 27.9575 },
  { city: 'Arad', county: 'AR', weight: 10, lat: 46.1866, lng: 21.3123 },
  { city: 'Pitesti', county: 'AG', weight: 10, lat: 44.8565, lng: 24.8692 },
  { city: 'Sibiu', county: 'SB', weight: 10, lat: 45.7983, lng: 24.1256 },
  { city: 'Bacau', county: 'BC', weight: 10, lat: 46.5670, lng: 26.9146 },
  { city: 'Targu Mures', county: 'MS', weight: 8, lat: 46.5455, lng: 24.5625 },
  { city: 'Baia Mare', county: 'MM', weight: 8, lat: 47.6567, lng: 23.5850 },
  { city: 'Buzau', county: 'BZ', weight: 6, lat: 45.1500, lng: 26.8333 },
  { city: 'Botosani', county: 'BT', weight: 6, lat: 47.7487, lng: 26.6695 },
  { city: 'Satu Mare', county: 'SM', weight: 6, lat: 47.7950, lng: 22.8816 },
  { city: 'Ramnicu Valcea', county: 'VL', weight: 5, lat: 45.1047, lng: 24.3655 },
  { city: 'Suceava', county: 'SV', weight: 5, lat: 47.6514, lng: 26.2557 },
  { city: 'Piatra Neamt', county: 'NT', weight: 5, lat: 46.9275, lng: 26.3681 },
  { city: 'Drobeta-Turnu Severin', county: 'MH', weight: 5, lat: 44.6318, lng: 22.6568 },
  { city: 'Targu Jiu', county: 'GJ', weight: 5, lat: 45.0478, lng: 23.2745 },
  { city: 'Focsani', county: 'VN', weight: 5, lat: 45.6947, lng: 27.1896 },
  { city: 'Bistrita', county: 'BN', weight: 4, lat: 47.1333, lng: 24.5000 },
  { city: 'Resita', county: 'CS', weight: 4, lat: 45.3008, lng: 21.8897 },
  { city: 'Tulcea', county: 'TL', weight: 4, lat: 45.1790, lng: 28.8003 },
  { city: 'Slatina', county: 'OT', weight: 4, lat: 44.4300, lng: 24.3648 },
  { city: 'Zalau', county: 'SJ', weight: 4, lat: 47.1833, lng: 23.0500 },
  { city: 'Alba Iulia', county: 'AB', weight: 4, lat: 46.0667, lng: 23.5833 },
  { city: 'Deva', county: 'HD', weight: 4, lat: 45.8833, lng: 22.9000 },
  { city: 'Targoviste', county: 'DB', weight: 4, lat: 44.9242, lng: 25.4600 },
  { city: 'Sfantu Gheorghe', county: 'CV', weight: 3, lat: 45.8667, lng: 25.7833 },
  { city: 'Giurgiu', county: 'GR', weight: 3, lat: 43.9038, lng: 25.9699 },
  { city: 'Miercurea Ciuc', county: 'HR', weight: 3, lat: 46.3581, lng: 25.8025 },
  { city: 'Slobozia', county: 'IL', weight: 3, lat: 44.5667, lng: 27.3667 },
  { city: 'Calarasi', county: 'CL', weight: 3, lat: 44.2000, lng: 27.3333 },
  { city: 'Alexandria', county: 'TR', weight: 3, lat: 43.9667, lng: 25.3333 },
  { city: 'Vaslui', county: 'VS', weight: 3, lat: 46.6378, lng: 27.7294 },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1))
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function shortId() {
  return Math.random().toString(36).slice(2, 8)
}

function jitter(value: number, range: number): number {
  return value + (Math.random() - 0.5) * 2 * range
}

async function getAdminProfile(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    console.log('[mock] No Authorization header')
    return null
  }

  const serviceClient = createServiceRoleClient()
  const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
  if (!user) {
    console.log('[mock] auth.getUser failed:', authError?.message)
    return null
  }
  console.log('[mock] Authenticated user:', user.id)

  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('id, role, highschool, graduation_year, class, city, county, country')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[mock] Error fetching admin profile:', error.message)
    return null
  }
  if (!profile || profile.role !== 'admin') {
    console.log('[mock] User is not admin, role:', profile?.role)
    return null
  }
  console.log('[mock] Admin verified:', { id: profile.id, highschool: profile.highschool, city: profile.city, class: profile.class })
  return profile
}

interface BotSpec {
  highschool: string
  graduation_year: number
  classLetter: string
  city: string
  county: string | null
  country: string
  latitude?: number
  longitude?: number
}

function generateBotProfile(spec: BotSpec) {
  const lastName = pick(LAST_NAMES)
  const sid = shortId()
  return {
    email: `bot-${sid}@mock.unirea.ro`,
    name: `Bot ${lastName}`,
    username: `bot-${sid}`,
    highschool: spec.highschool,
    graduation_year: spec.graduation_year,
    class: spec.classLetter,
    city: spec.city,
    county: spec.county,
    country: spec.country,
    hobbies: pickN(HOBBY_LABELS, 2, 4),
    profession: pickN(PROF_SUBSET, 1, 2),
    domain: pickN(DOMAIN_SUBSET, 1, 1),
    onboarding_completed: true,
    latitude: spec.latitude ? jitter(spec.latitude, 0.03) : null,
    longitude: spec.longitude ? jitter(spec.longitude, 0.03) : null,
  }
}

async function createBotsBatch(serviceClient: ReturnType<typeof createServiceRoleClient>, bots: ReturnType<typeof generateBotProfile>[]) {
  let created = 0
  for (const bot of bots) {
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: bot.email,
      password: 'botpass123',
      email_confirm: true,
    })
    if (authError || !authData.user) {
      console.error('[mock] Auth create failed for', bot.email, ':', authError?.message)
      continue
    }

    const userId = authData.user.id
    console.log('[mock] Auth user created:', bot.email, userId)

    const { error: upsertError } = await serviceClient
      .from('profiles')
      .upsert({
        id: userId,
        email: bot.email,
        name: bot.name,
        username: bot.username,
        highschool: bot.highschool,
        graduation_year: bot.graduation_year,
        class: bot.class,
        city: bot.city,
        county: bot.county,
        country: bot.country,
        hobbies: bot.hobbies,
        profession: bot.profession,
        domain: bot.domain,
        onboarding_completed: bot.onboarding_completed,
        latitude: bot.latitude,
        longitude: bot.longitude,
      })

    if (upsertError) {
      console.error('[mock] Profile upsert failed for', bot.name, '(', userId, '):', upsertError.message)
    } else {
      console.log('[mock] Created:', bot.name, '| city:', bot.city, '| class:', bot.class, '| hs:', bot.highschool)
      created++
    }
  }
  return created
}

function getCityCoords(city: string): { lat: number; lng: number } | null {
  const entry = WEIGHTED_CITIES.find(c => c.city === city)
  return entry ? { lat: entry.lat, lng: entry.lng } : null
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminProfile(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scope } = await request.json()
    console.log('[mock] POST request, scope:', scope)
    if (!['class', 'highschool', 'city', 'country'].includes(scope)) {
      console.log('[mock] Invalid scope:', scope)
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()
    const botSpecs: ReturnType<typeof generateBotProfile>[] = []
    const adminCoords = getCityCoords(admin.city)

    if (scope === 'class') {
      for (let i = 0; i < 30; i++) {
        botSpecs.push(generateBotProfile({
          highschool: admin.highschool,
          graduation_year: admin.graduation_year,
          classLetter: admin.class || 'A',
          city: admin.city,
          county: admin.county,
          country: admin.country,
          latitude: adminCoords?.lat,
          longitude: adminCoords?.lng,
        }))
      }
    } else if (scope === 'highschool') {
      for (const cls of CLASSES) {
        for (let i = 0; i < 30; i++) {
          botSpecs.push(generateBotProfile({
            highschool: admin.highschool,
            graduation_year: admin.graduation_year,
            classLetter: cls,
            city: admin.city,
            county: admin.county,
            country: admin.country,
            latitude: adminCoords?.lat,
            longitude: adminCoords?.lng,
          }))
        }
      }
    } else if (scope === 'city') {
      const highschools = HIGHSCHOOL_TEMPLATES.slice(0, 3).map(
        t => t.replace('{city}', admin.city)
      )
      for (const hs of highschools) {
        for (const cls of CLASSES) {
          for (let i = 0; i < 30; i++) {
            botSpecs.push(generateBotProfile({
              highschool: hs,
              graduation_year: admin.graduation_year,
              classLetter: cls,
              city: admin.city,
              county: admin.county,
              country: admin.country,
              latitude: adminCoords?.lat,
              longitude: adminCoords?.lng,
            }))
          }
        }
      }
    } else if (scope === 'country') {
      for (const entry of WEIGHTED_CITIES) {
        for (let i = 0; i < entry.weight; i++) {
          const hs = pick(HIGHSCHOOL_TEMPLATES).replace('{city}', entry.city)
          botSpecs.push(generateBotProfile({
            highschool: hs,
            graduation_year: admin.graduation_year,
            classLetter: pick(CLASSES),
            city: entry.city,
            county: entry.county,
            country: 'Romania',
            latitude: entry.lat,
            longitude: entry.lng,
          }))
        }
      }
    }

    console.log('[mock] Generated', botSpecs.length, 'bot specs for scope:', scope)

    let totalCreated = 0
    const BATCH_SIZE = 10
    for (let i = 0; i < botSpecs.length; i += BATCH_SIZE) {
      const batch = botSpecs.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(bot => createBotsBatch(serviceClient, [bot]))
      )
      const batchCreated = results.reduce((sum, n) => sum + n, 0)
      totalCreated += batchCreated
      console.log(`[mock] Batch ${i / BATCH_SIZE + 1}: created ${batchCreated}/${batch.length}, total so far: ${totalCreated}/${botSpecs.length}`)
    }

    console.log('[mock] Done. Total created:', totalCreated, '/', botSpecs.length)
    return NextResponse.json({ created: totalCreated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('[mock] POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminProfile(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[mock] DELETE request')
    const serviceClient = createServiceRoleClient()
    const { data: bots, error } = await serviceClient
      .from('profiles')
      .select('id')
      .like('name', 'Bot %')

    if (error) {
      console.error('[mock] Error fetching bot profiles:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!bots || bots.length === 0) {
      console.log('[mock] No bot profiles found to delete')
      return NextResponse.json({ deleted: 0 })
    }

    console.log('[mock] Found', bots.length, 'bot profiles to delete')

    let totalDeleted = 0
    const BATCH_SIZE = 20
    for (let i = 0; i < bots.length; i += BATCH_SIZE) {
      const batch = bots.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (bot): Promise<number> => {
          const { error: delError } = await serviceClient.auth.admin.deleteUser(bot.id)
          if (delError) {
            console.error('[mock] Failed to delete user', bot.id, ':', delError.message)
            return 0
          }
          return 1
        })
      )
      const batchDeleted = results.reduce((sum, n) => sum + n, 0)
      totalDeleted += batchDeleted
      console.log(`[mock] Delete batch ${i / BATCH_SIZE + 1}: deleted ${batchDeleted}/${batch.length}, total so far: ${totalDeleted}/${bots.length}`)
    }

    console.log('[mock] Done. Total deleted:', totalDeleted, '/', bots.length)
    return NextResponse.json({ deleted: totalDeleted })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('[mock] DELETE error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
