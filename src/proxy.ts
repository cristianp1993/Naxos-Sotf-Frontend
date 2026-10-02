import { NextRequest, NextResponse } from 'next/server';

// CP 2026-10-01 Esta app no usa Server Actions, asi que cualquier request con
// el header next-action es trafico de bots/scanners y se rechaza con 404
// antes de que llegue al handler de Next y ensucie los logs
export function proxy(request: NextRequest) {
  if (request.headers.has('next-action')) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}
