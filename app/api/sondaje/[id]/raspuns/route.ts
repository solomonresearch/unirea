import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Raspunsurile sunt obligatorii' }, { status: 400 })
    }

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, active, reveal_threshold, response_count, results_unlocked_at, created_by, target_scope, title, target_highschool, quiz_questions(id, quiz_options(id))')
      .eq('id', params.id)
      .single()

    if (!quiz) {
      return NextResponse.json({ error: 'Sondajul nu a fost gasit' }, { status: 404 })
    }

    if (!quiz.active) {
      return NextResponse.json({ error: 'Sondajul nu este activ' }, { status: 400 })
    }

    const questions = quiz.quiz_questions as any[]

    if (Object.keys(answers).length !== questions.length) {
      return NextResponse.json({ error: 'Trebuie sa raspunzi la toate intrebarile' }, { status: 400 })
    }

    for (const [questionId, optionId] of Object.entries(answers)) {
      const question = questions.find((q: any) => q.id === questionId)
      if (!question) {
        return NextResponse.json({ error: 'Intrebare invalida' }, { status: 400 })
      }
      const validOption = question.quiz_options.find((o: any) => o.id === optionId)
      if (!validOption) {
        return NextResponse.json({ error: 'Optiune invalida' }, { status: 400 })
      }
    }

    const { data: existing } = await supabase
      .from('quiz_responses')
      .select('id')
      .eq('quiz_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ai raspuns deja la acest sondaj' }, { status: 409 })
    }

    const { error: insertError } = await supabase
      .from('quiz_responses')
      .insert({ quiz_id: params.id, user_id: user.id, answers })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const serviceClient = createServiceRoleClient()
    const threshold = quiz.reveal_threshold ?? 10
    const newCount = (quiz.response_count ?? 0) + 1

    await serviceClient
      .from('quizzes')
      .update({ response_count: newCount })
      .eq('id', params.id)

    const alreadyUnlocked = quiz.results_unlocked_at != null
    let unlocked = alreadyUnlocked

    if (!alreadyUnlocked && newCount >= threshold) {
      // Conditional update prevents double-unlock under concurrent submissions
      const { data: unlockResult } = await serviceClient
        .from('quizzes')
        .update({ results_unlocked_at: new Date().toISOString() })
        .eq('id', params.id)
        .is('results_unlocked_at', null)
        .select('id')

      unlocked = true

      if (unlockResult && unlockResult.length > 0) {
        try {
          await autoPost(serviceClient, {
            id: quiz.id,
            title: quiz.title,
            response_count: newCount,
            target_scope: quiz.target_scope,
            created_by: quiz.created_by,
            target_highschool: quiz.target_highschool,
          })
        } catch (postErr) {
          console.error('[sondaje] auto-post failed:', postErr)
        }
      }
    }

    return NextResponse.json({ ok: true, unlocked, response_count: newCount, reveal_threshold: threshold })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function autoPost(
  supabase: ReturnType<typeof createServiceRoleClient>,
  quiz: { id: string; title: string; response_count: number; target_scope: string; created_by: string; target_highschool: string | null }
) {
  const content = `📊 Rezultate sondaj: ${quiz.title}\n${quiz.response_count} persoane au participat\n/sondaje`

  let postId: string | null = null

  if (quiz.target_scope === 'class') {
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: quiz.created_by, content })
      .select('id')
      .single()
    if (error) throw error
    postId = data.id
  } else {
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('highschool')
      .eq('id', quiz.created_by)
      .single()

    const highschool = creatorProfile?.highschool ?? quiz.target_highschool ?? ''
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        user_id: quiz.created_by,
        highschool,
        content,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()
    if (error) throw error
    postId = data.id
  }

  if (postId) {
    await supabase
      .from('quizzes')
      .update({ result_post_id: postId })
      .eq('id', quiz.id)
  }
}
