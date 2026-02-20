import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

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

async function getAdminProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceRoleClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, role, highschool, graduation_year, class, city, country')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return profile
}

interface BotSpec {
  highschool: string
  graduation_year: number
  classLetter: string
  city: string
  country: string
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
    country: spec.country,
    hobbies: pickN(HOBBY_LABELS, 2, 4),
    profession: pickN(PROF_SUBSET, 1, 2),
    domain: pickN(DOMAIN_SUBSET, 1, 1),
    onboarding_completed: true,
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
    if (authError || !authData.user) continue

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({
        name: bot.name,
        username: bot.username,
        highschool: bot.highschool,
        graduation_year: bot.graduation_year,
        class: bot.class,
        city: bot.city,
        country: bot.country,
        hobbies: bot.hobbies,
        profession: bot.profession,
        domain: bot.domain,
        onboarding_completed: bot.onboarding_completed,
      })
      .eq('id', authData.user.id)

    if (!profileError) created++
  }
  return created
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminProfile()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scope } = await request.json()
    if (!['class', 'highschool', 'city'].includes(scope)) {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()
    const botSpecs: ReturnType<typeof generateBotProfile>[] = []

    if (scope === 'class') {
      for (let i = 0; i < 30; i++) {
        botSpecs.push(generateBotProfile({
          highschool: admin.highschool,
          graduation_year: admin.graduation_year,
          classLetter: admin.class || 'A',
          city: admin.city,
          country: admin.country,
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
            country: admin.country,
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
              country: admin.country,
            }))
          }
        }
      }
    }

    let totalCreated = 0
    const BATCH_SIZE = 10
    for (let i = 0; i < botSpecs.length; i += BATCH_SIZE) {
      const batch = botSpecs.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(bot => createBotsBatch(serviceClient, [bot]))
      )
      totalCreated += results.reduce((sum, n) => sum + n, 0)
    }

    return NextResponse.json({ created: totalCreated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const admin = await getAdminProfile()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()
    const { data: bots, error } = await serviceClient
      .from('profiles')
      .select('id')
      .like('name', 'Bot %')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!bots || bots.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    let totalDeleted = 0
    const BATCH_SIZE = 20
    for (let i = 0; i < bots.length; i += BATCH_SIZE) {
      const batch = bots.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (bot): Promise<number> => {
          const { error } = await serviceClient.auth.admin.deleteUser(bot.id)
          return error ? 0 : 1
        })
      )
      totalDeleted += results.reduce((sum, n) => sum + n, 0)
    }

    return NextResponse.json({ deleted: totalDeleted })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
