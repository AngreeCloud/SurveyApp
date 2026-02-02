import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const date = searchParams.get('date');

    let feedbacks;
    
    if (date) {
      feedbacks = await sql`
        SELECT * FROM satisfaction_feedback
        WHERE DATE(created_at) = ${date}
        ORDER BY created_at DESC
      `;
    } else {
      feedbacks = await sql`
        SELECT * FROM satisfaction_feedback
        ORDER BY created_at DESC
      `;
    }

    if (format === 'csv') {
      const csv = [
        'ID,Nível de Satisfação,Data,Hora',
        ...feedbacks.map((f: any) => {
          const date = new Date(f.created_at);
          return `${f.id},${f.satisfaction_level},${date.toLocaleDateString('pt-BR')},${date.toLocaleTimeString('pt-BR')}`;
        })
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="feedback-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'txt') {
      const txt = feedbacks.map((f: any) => {
        const date = new Date(f.created_at);
        return `ID: ${f.id}\nNível: ${f.satisfaction_level}\nData: ${date.toLocaleDateString('pt-BR')}\nHora: ${date.toLocaleTimeString('pt-BR')}\n---`;
      }).join('\n');

      return new NextResponse(txt, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="feedback-${new Date().toISOString().split('T')[0]}.txt"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('[v0] Error exporting data:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
