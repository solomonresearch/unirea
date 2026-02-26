import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('highschool, graduation_year, class, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profilul nu a fost gasit' }, { status: 400 })
    }

    const { data: allQuizzes, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*, quiz_options(*))')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ quizzes: [], profile })
    }

    const now = new Date()
    const scopedQuizzes = (allQuizzes || []).filter((quiz: any) => {
      if (quiz.expires_at && new Date(quiz.expires_at) < now) return false
      if (quiz.target_scope === 'all') return true
      if (quiz.target_scope === 'school') return quiz.target_highschool === profile.highschool
      if (quiz.target_scope === 'year') return quiz.target_highschool === profile.highschool && quiz.target_year === profile.graduation_year
      if (quiz.target_scope === 'class') return quiz.target_highschool === profile.highschool && quiz.target_year === profile.graduation_year && quiz.target_class === profile.class
      return false
    })

    if (scopedQuizzes.length === 0) {
      return NextResponse.json({ quizzes: [], profile })
    }

    const quizIds = scopedQuizzes.map((q: any) => q.id)

    const { data: userResponses } = await supabase
      .from('quiz_responses')
      .select('quiz_id')
      .eq('user_id', user.id)
      .in('quiz_id', quizIds)

    const completedIds = new Set((userResponses || []).map((r: any) => r.quiz_id))

    const quizzes = scopedQuizzes.map((quiz: any) => {
      const questions = (quiz.quiz_questions || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          ...q,
          quiz_options: (q.quiz_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
        }))
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        target_scope: quiz.target_scope,
        active: quiz.active,
        expires_at: quiz.expires_at,
        created_by: quiz.created_by,
        created_at: quiz.created_at,
        questions,
        completed: completedIds.has(quiz.id),
        response_count: quiz.response_count ?? 0,
        reveal_threshold: quiz.reveal_threshold ?? 10,
        results_unlocked_at: quiz.results_unlocked_at ?? null,
        anonymous_mode: quiz.anonymous_mode ?? false,
      }
    })

    return NextResponse.json({ quizzes, profile })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, target_scope, target_highschool, target_year, target_class, expires_at, active, questions, reveal_threshold, anonymous_mode } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
    }

    if (!questions || questions.length !== 4) {
      return NextResponse.json({ error: 'Sondajul trebuie sa aiba exact 4 intrebari' }, { status: 400 })
    }

    for (const q of questions) {
      if (!q.options || q.options.length !== 4) {
        return NextResponse.json({ error: 'Fiecare intrebare trebuie sa aiba exact 4 optiuni' }, { status: 400 })
      }
    }

    const parsedThreshold = Number(reveal_threshold ?? 10)
    const clampedThreshold = Math.min(100, Math.max(2, isNaN(parsedThreshold) ? 10 : parsedThreshold))

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        target_scope: target_scope || 'all',
        target_highschool: target_highschool || null,
        target_year: target_year || null,
        target_class: target_class || null,
        expires_at: expires_at || null,
        active: active ?? true,
        created_by: user.id,
        reveal_threshold: clampedThreshold,
        anonymous_mode: anonymous_mode ?? false,
      })
      .select()
      .single()

    if (quizError) {
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    for (const q of questions) {
      const { data: question, error: qError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quiz.id,
          question_text: q.question_text,
          emoji: q.emoji || null,
          order_index: q.order_index,
        })
        .select()
        .single()

      if (qError) {
        return NextResponse.json({ error: qError.message }, { status: 500 })
      }

      const { error: optError } = await supabase
        .from('quiz_options')
        .insert(
          q.options.map((opt: any) => ({
            question_id: question.id,
            option_text: opt.option_text,
            emoji: opt.emoji || null,
            order_index: opt.order_index,
          }))
        )

      if (optError) {
        return NextResponse.json({ error: optError.message }, { status: 500 })
      }
    }

    return NextResponse.json(quiz, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
