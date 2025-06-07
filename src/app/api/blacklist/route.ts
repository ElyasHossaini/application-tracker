import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const blacklist = await prisma.blacklistedCompany.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        dateAdded: 'desc',
      },
    })

    return NextResponse.json(blacklist)
  } catch (error) {
    console.error('Error fetching blacklist:', error)
    return NextResponse.json(
      { error: 'Error fetching blacklist' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    const company = await prisma.blacklistedCompany.create({
      data: {
        userId: session.user.id,
        companyName: data.companyName,
        reason: data.reason,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error adding company to blacklist:', error)
    return NextResponse.json(
      { error: 'Error adding company to blacklist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    await prisma.blacklistedCompany.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing company from blacklist:', error)
    return NextResponse.json(
      { error: 'Error removing company from blacklist' },
      { status: 500 }
    )
  }
} 