import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return new NextResponse('Invalid file type. Only PDF and Word documents are allowed.', { status: 400 })
    }

    // Create a unique filename
    const uniqueFilename = `${session.user.id}-${Date.now()}${fileExtension}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write the file
    await writeFile(join(uploadDir, uniqueFilename), buffer)

    // Update user's profile with the new resume URL
    const resumeUrl = `/uploads/${uniqueFilename}`
    await prisma.profile.upsert({
      where: {
        userId: session.user.id
      },
      create: {
        userId: session.user.id,
        resumeUrl
      },
      update: {
        resumeUrl
      }
    })

    return NextResponse.json({ url: resumeUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
} 