import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { satisfaction_level } = await request.json();

    if (!satisfaction_level || !['Muito Satisfeito', 'Satisfeito', 'Insatisfeito'].includes(satisfaction_level)) {
      return NextResponse.json({ error: 'Invalid satisfaction level' }, { status: 400 });
    }

    await sql`
      INSERT INTO satisfaction_feedback (satisfaction_level)
      VALUES (${satisfaction_level})
    `;

    return NextResponse.json({ success: true, message: 'Obrigado pelo seu feedback!' });
  } catch (error) {
    console.error('[v0] Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') || '100';

    let feedbacks;
    
    if (date) {
      feedbacks = await sql`
        SELECT * FROM satisfaction_feedback
        WHERE DATE(created_at) = ${date}
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
      `;
    } else {
      feedbacks = await sql`
        SELECT * FROM satisfaction_feedback
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
      `;
    }

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('[v0] Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
