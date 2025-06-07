import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const jobSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  location: z.string(),
  jobDescription: z.string(),
  jobUrl: z.string().url(),
  platform: z.enum(['LINKEDIN', 'INDEED', 'OTHER']),
  coverLetter: z.string(),
})

export async function GET() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await prisma.jobApplication.findMany({
      where: { 
        userId: session.user.id 
      },
      orderBy: {
        applicationDate: 'desc'
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = jobSchema.parse(body)

    const job = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        jobTitle: validatedData.jobTitle,
        company: validatedData.company,
        location: validatedData.location,
        jobDescription: validatedData.jobDescription,
        jobUrl: validatedData.jobUrl,
        platform: validatedData.platform,
        coverLetter: validatedData.coverLetter,
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create job application' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    const job = await prisma.jobApplication.update({
      where: {
        id: data.id,
        userId: session.user.id,
      },
      data: {
        status: data.status,
        response: data.response,
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error updating job application:', error)
    return NextResponse.json(
      { error: 'Error updating job application' },
      { status: 500 }
    )
  }
} 