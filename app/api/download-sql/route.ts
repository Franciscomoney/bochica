import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'migrations', '003_add_project_balances.sql');
    const fileContent = await readFile(filePath, 'utf-8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename="003_add_project_balances.sql"',
      },
    });
  } catch (error) {
    console.error('Error reading SQL file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
