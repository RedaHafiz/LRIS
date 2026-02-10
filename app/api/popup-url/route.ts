import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'POPUPURL.txt')
    const content = await readFile(filePath, 'utf-8')
    return NextResponse.json({ url: content.trim() })
  } catch (error) {
    console.error('Error reading POPUPURL.txt:', error)
    return NextResponse.json({ url: '' }, { status: 404 })
  }
}
