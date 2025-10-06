import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename parameter required' }, { status: 400 });
    }

    // Whitelist allowed files for security
    const allowedFiles = [
      '003_add_project_balances.sql',
      'create-withdrawal-requests.sql'
    ];

    if (!allowedFiles.includes(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'migrations', filename);
    const fileContent = await readFile(filePath, 'utf-8');
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
