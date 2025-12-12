import { NextResponse } from 'next/server';

export const GET = async () => NextResponse.json(null);

export const POST = async () => NextResponse.json({ success: false, persisted: false });

export const DELETE = async () => NextResponse.json({ success: true });
