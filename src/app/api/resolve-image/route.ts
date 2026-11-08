import { NextRequest, NextResponse } from 'next/server';
import { resolveCoverImageUrl } from '@/lib/imageResolver';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const resolved = await resolveCoverImageUrl(url);
    return NextResponse.json({ success: true, original: url, resolved });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to resolve image URL' }, { status: 500 });
  }
}
