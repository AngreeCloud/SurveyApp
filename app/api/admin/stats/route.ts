import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let stats;
    
    if (date) {
      stats = await sql`
        SELECT 
          satisfaction_level,
          COUNT(*) as count
        FROM satisfaction_feedback
        WHERE DATE(created_at) = ${date}
        GROUP BY satisfaction_level
      `;
    } else {
      stats = await sql`
        SELECT 
          satisfaction_level,
          COUNT(*) as count
        FROM satisfaction_feedback
        GROUP BY satisfaction_level
      `;
    }

    const total = stats.reduce((sum: number, item: any) => sum + parseInt(item.count), 0);

    const result = {
      total,
      stats: stats.map((item: any) => ({
        level: item.satisfaction_level,
        count: parseInt(item.count),
        percentage: total > 0 ? ((parseInt(item.count) / total) * 100).toFixed(1) : '0.0'
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[v0] Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
