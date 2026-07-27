import { NextResponse } from 'next/server';
import { getTodayExchangeRates } from '@/lib/exchange-rate';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cotizaciones
 * Returns today's active exchange rates (USD, ARS, UYU) with database daily caching.
 */
export async function GET() {
  try {
    const rates = await getTodayExchangeRates();
    const todayStr = new Date().toISOString().split('T')[0];

    return NextResponse.json({
      success: true,
      fecha: todayStr,
      rates,
    });
  } catch (err: unknown) {
    console.error('[API /api/cotizaciones GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
