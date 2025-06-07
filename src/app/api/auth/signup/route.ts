import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json()
    console.log('Received signup request:', { name, email, phone })

    // Validate input
    if (!name || !email || !phone || !password) {
      console.log('Missing required fields:', { name, email, phone, password: !!password })
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('User already exists with email:', email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create new user
    console.log('Creating new user with data:', { name, email, phone })
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    })
    console.log('User created successfully:', user)

    return NextResponse.json(
      { 
        success: true,
        message: 'Account created successfully! Please sign in.'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating your account' },
      { status: 500 }
    )
  }
} 