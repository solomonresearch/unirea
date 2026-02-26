import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('results_unlocked_at, quiz_questions(*, quiz_options(*))')
      .eq('id', params.id)
      .single()

    if (!quiz) {
      return NextResponse.json({ error: 'Sondajul nu a fost gasit' }, { status: 404 })
    }

    if (!quiz.results_unlocked_at) {
      return NextResponse.json({ error: 'Rezultatele nu sunt inca deblocate' }, { status: 403 })
    }

    const serviceClient = createServiceRoleClient()

    const [responsesRes, userResponseRes] = await Promise.all([
      serviceClient.from('quiz_responses').select('answers').eq('quiz_id', params.id),
      supabase.from('quiz_responses').select('answers').eq('quiz_id', params.id).eq('user_id', user.id).single(),
    ])

    const allResponses = responsesRes.data || []
    const totalResponses = allResponses.length

    const questions = (quiz.quiz_questions as any[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((q) => {
        const options = (q.quiz_options as any[])
          .sort((a, b) => a.order_index - b.order_index)
          .map((opt) => {
            const count = allResponses.filter((r: any) => r.answers[q.id] === opt.id).length
            return {
              id: opt.id,
              option_text: opt.option_text,
              emoji: opt.emoji,
              count,
              percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
            }
          })
        return { id: q.id, question_text: q.question_text, emoji: q.emoji, options }
      })

    return NextResponse.json({
      questions,
      user_answers: userResponseRes.data?.answers || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
