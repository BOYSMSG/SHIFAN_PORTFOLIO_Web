import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionFromRequest } from '@/lib/auth';
import {
  getAllProjectsForAdmin,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const projects = await getAllProjectsForAdmin();
    return NextResponse.json({ success: true, projects, total: projects.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch admin projects.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !body.name) {
      return NextResponse.json({ error: 'Project name is required.' }, { status: 400 });
    }

    const result = await createProject(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create project.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error creating project.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const { id, ...updates } = body;
    const result = await updateProject(id, updates);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update project.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error updating project.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    const result = await deleteProject(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete project.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error deleting project.' }, { status: 500 });
  }
}
