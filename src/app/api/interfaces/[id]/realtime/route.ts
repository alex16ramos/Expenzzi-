import { NextResponse } from 'next/server';
import { realtimeEmitter, RealtimeEventPayload } from '@/lib/events';

export const dynamic = 'force-dynamic';

/**
 * GET /api/interfaces/[id]/realtime
 * High-performance Server-Sent Events (SSE) stream endpoint.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const interfaceId = resolvedParams.id;
    const channelName = `realtime:${interfaceId}`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection payload immediately
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', interfaceId, timestamp: new Date().toISOString() })}\n\n`)
        );

        const onMutationEvent = (payload: RealtimeEventPayload) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            // Controller closed
          }
        };

        realtimeEmitter.on(channelName, onMutationEvent);

        // Periodic keep-alive ping every 15 seconds
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(keepAliveInterval);
          }
        }, 15000);

        req.signal.addEventListener('abort', () => {
          realtimeEmitter.off(channelName, onMutationEvent);
          clearInterval(keepAliveInterval);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'none',
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/realtime GET Error]:', err);
    return NextResponse.json({ error: 'Error al abrir canal en tiempo real' }, { status: 500 });
  }
}
