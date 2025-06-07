import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const jobSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  status: z.enum(['APPLIED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'NO_RESPONSE']).default('APPLIED')
})

export async function GET() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // First get the user ID from the email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const jobs = await prisma.jobApplication.findMany({
      where: { 
        userId: user.id 
      },
      orderBy: {
        applicationDate: 'desc'
      },
      select: {
        id: true,
        jobTitle: true,
        company: true,
        applicationDate: true,
        status: true
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
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

    // First get the user ID from the email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const job = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobTitle: validatedData.jobTitle,
        company: validatedData.company,
        status: validatedData.status,
        // Set default values for required fields
        jobDescription: '',
        coverLetter: '',
        jobUrl: '',
        platform: 'OTHER'
      },
      select: {
        id: true,
        jobTitle: true,
        company: true,
        applicationDate: true,
        status: true
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error creating job application:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create job application' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // First get the user ID from the email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    
    const job = await prisma.jobApplication.update({
      where: {
        id: data.id,
        userId: user.id,
      },
      data: {
        status: data.status
      },
      select: {
        id: true,
        jobTitle: true,
        company: true,
        applicationDate: true,
        status: true
      }
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