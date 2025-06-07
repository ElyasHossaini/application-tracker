import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobDescription, profile } = await request.json()

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    const prompt = `Write a professional cover letter for a job application. Use the following information:

Job Description:
${jobDescription}

Candidate Information:
- Name: ${profile?.name || 'Not provided'}
- Current Location: ${profile?.location || 'Not provided'}
- Job Titles: ${profile?.jobPreferences?.jobTitles?.join(', ') || 'Not provided'}
- LinkedIn: ${profile?.linkedInProfile || 'Not provided'}

Guidelines:
- Keep it concise and professional
- Highlight relevant skills and experience based on the job description
- Show enthusiasm for the role and company
- Include a strong closing statement
- Format it as a proper business letter
- Do not include the date or addresses

Write the cover letter now:`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional cover letter writer who creates compelling, personalized cover letters."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const coverLetter = completion.choices[0].message.content

    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
} 