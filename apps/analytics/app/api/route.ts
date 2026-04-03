import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const data = await req.json();

  console.log('Received event:', data);

  return NextResponse.json({ status: 'success' });
}
