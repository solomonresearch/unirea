import { createServerSupabaseClient } from '@/lib/supabase-server'
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
      .select('id, active, quiz_questions(id, quiz_options(id))')
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

    const { error } = await supabase
      .from('quiz_responses')
      .insert({ quiz_id: params.id, user_id: user.id, answers })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
