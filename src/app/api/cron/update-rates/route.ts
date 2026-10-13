import { NextResponse } from 'next/server';
import { defaultExchangeRateService } from '@/lib/exchange-rates/provider.factory';

export async function GET(req: Request) {
  // Validate authorization token if present in headers to secure the cron
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const rates = await defaultExchangeRateService.getTodayExchangeRates();
    return NextResponse.json({ success: true, provider: defaultExchangeRateService.getProvider().name, rates });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Cron job update-rates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
