import { getPublicDbClient } from '@/lib/neon';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  // Validate authorization token if present in headers to secure the cron
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const accessKey = process.env.KEY_API_MONEDA_CAMBIO;
  if (!accessKey) {
    return NextResponse.json({ error: 'KEY_API_MONEDA_CAMBIO env var is missing' }, { status: 500 });
  }

  try {
    // 1. Fetch USD source rates
    const resUSD = await axios.get(`http://apilayer.net/api/live`, {
      params: {
        access_key: accessKey,
        currencies: 'USD,UYU,ARS',
        source: 'USD',
        format: 1
      }
    });
    const ratesUSD = resUSD.data.quotes || {};
    const USDUYU = ratesUSD['USDUYU'];
    const USDARS = ratesUSD['USDARS'];

    // 2. Fetch ARS source rates
    const resARS = await axios.get(`http://apilayer.net/api/live`, {
      params: {
        access_key: accessKey,
        currencies: 'USD,UYU,ARS',
        source: 'ARS',
        format: 1
      }
    });
    const ratesARS = resARS.data.quotes || {};
    const ARSUSD = ratesARS['ARSUSD'];
    const ARSUYU = ratesARS['ARSUYU'];

    // 3. Fetch UYU source rates
    const resUYU = await axios.get(`http://apilayer.net/api/live`, {
      params: {
        access_key: accessKey,
        currencies: 'USD,UYU,ARS',
        source: 'UYU',
        format: 1
      }
    });
    const ratesUYU = resUYU.data.quotes || {};
    const UYUARS = ratesUYU['UYUARS'];
    const UYUUSD = ratesUYU['UYUUSD'];

    // 4. Save to the database using the Neon Data API
    const db = getPublicDbClient();
    const { data, error } = await db.from('cambio').insert({
      fecha: new Date().toISOString().split('T')[0],
      cambiouyuusd: UYUUSD,
      cambiouyuars: UYUARS,
      cambiousduyu: USDUYU,
      cambiousdars: USDARS,
      cambioarsuyu: ARSUYU,
      cambioarsusd: ARSUSD
    }).select();

    if (error) {
      console.error('Error inserting exchange rates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cambio: data });
  } catch (err: any) {
    console.error('Cron job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
