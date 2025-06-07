import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { PrismaClientKnownRequestError, PrismaClientInitializationError } from '@prisma/client/runtime/library'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            jobPreferences: true
          }
        }
      }
    })

    if (!user) {
      return new NextResponse('Profile not found', { status: 404 })
    }

    // Format the response
    const profile = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.profile?.location || '',
      resumeUrl: user.profile?.resumeUrl || '',
      linkedInProfile: user.profile?.linkedInProfile || '',
      indeedProfile: user.profile?.indeedProfile || '',
      githubProfile: user.profile?.githubProfile || '',
      jobPreferences: user.profile?.jobPreferences || {
        jobTitles: [],
        locations: [],
        isRemoteOnly: false,
        minSalary: null,
        maxSalary: null,
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile GET error:', error)
    if (error instanceof PrismaClientInitializationError) {
      return new NextResponse('Database connection error. Please try again.', { status: 500 })
    }
    if (error instanceof PrismaClientKnownRequestError) {
      return new NextResponse(`Database error: ${error.message}`, { status: 500 })
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()
    const { jobTitles, isRemoteOnly, minSalary, maxSalary, location, linkedInProfile, indeedProfile, githubProfile, resumeUrl } = data

    // Update or create profile first
    const profile = await prisma.profile.upsert({
      where: {
        userId: session.user.id
      },
      create: {
        userId: session.user.id,
        location: location || '',
        linkedInProfile: linkedInProfile || '',
        indeedProfile: indeedProfile || '',
        githubProfile: githubProfile || '',
        resumeUrl: resumeUrl || '',
      },
      update: {
        ...(location !== undefined && { location }),
        ...(linkedInProfile !== undefined && { linkedInProfile }),
        ...(indeedProfile !== undefined && { indeedProfile }),
        ...(githubProfile !== undefined && { githubProfile }),
        ...(resumeUrl !== undefined && { resumeUrl }),
      },
      include: {
        jobPreferences: true
      }
    })

    // Only update job preferences if they were provided
    let jobPreferences = profile.jobPreferences
    if (jobTitles !== undefined || isRemoteOnly !== undefined || minSalary !== undefined || maxSalary !== undefined) {
      jobPreferences = await prisma.jobPreferences.upsert({
        where: {
          profileId: profile.id
        },
        create: {
          profileId: profile.id,
          jobTitles: Array.isArray(jobTitles) ? jobTitles : jobTitles?.split(',').map((t: string) => t.trim()) || [],
          locations: [],
          isRemoteOnly: isRemoteOnly || false,
          minSalary: minSalary ? parseInt(minSalary) : null,
          maxSalary: maxSalary ? parseInt(maxSalary) : null,
        },
        update: {
          ...(jobTitles && {
            jobTitles: Array.isArray(jobTitles) ? jobTitles : jobTitles.split(',').map((t: string) => t.trim())
          }),
          ...(isRemoteOnly !== undefined && { isRemoteOnly }),
          ...(minSalary !== undefined && { minSalary: minSalary ? parseInt(minSalary) : null }),
          ...(maxSalary !== undefined && { maxSalary: maxSalary ? parseInt(maxSalary) : null }),
        }
      })
    }

    return NextResponse.json({
      ...profile,
      jobPreferences
    })
  } catch (error) {
    console.error('Profile PUT error:', error)
    if (error instanceof PrismaClientInitializationError) {
      return new NextResponse('Database connection error. Please try again.', { status: 500 })
    }
    if (error instanceof PrismaClientKnownRequestError) {
      return new NextResponse(`Database error: ${error.message}`, { status: 500 })
    }
    return new NextResponse(
      error instanceof Error ? error.message : 'Failed to update profile',
      { status: 500 }
    )
  }
} 