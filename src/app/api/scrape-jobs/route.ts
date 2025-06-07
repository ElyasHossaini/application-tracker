import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import puppeteer from 'puppeteer'

const prisma = new PrismaClient()

async function scrapeLinkedInJobs(searchParams: URLSearchParams) {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const jobTitle = searchParams.get('jobTitle') || 'Software Engineer'
  const location = searchParams.get('location') || 'Remote'
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    jobTitle
  )}&location=${encodeURIComponent(location)}`

  try {
    await page.goto(url)
    await page.waitForSelector('.jobs-search__results-list')

    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.jobs-search__results-list > li')
      return Array.from(jobCards, (card) => {
        const titleElement = card.querySelector('.base-search-card__title')
        const companyElement = card.querySelector('.base-search-card__subtitle')
        const locationElement = card.querySelector('.job-search-card__location')
        const linkElement = card.querySelector('a')

        return {
          title: titleElement?.textContent?.trim() || '',
          company: companyElement?.textContent?.trim() || '',
          location: locationElement?.textContent?.trim() || '',
          url: linkElement?.href || '',
          platform: 'LINKEDIN' as const,
        }
      })
    })

    return jobs
  } finally {
    await browser.close()
  }
}

async function scrapeIndeedJobs(searchParams: URLSearchParams) {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const jobTitle = searchParams.get('jobTitle') || 'Software Engineer'
  const location = searchParams.get('location') || 'Remote'
  const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(
    jobTitle
  )}&l=${encodeURIComponent(location)}`

  try {
    await page.goto(url)
    await page.waitForSelector('.job_seen_beacon')

    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.job_seen_beacon')
      return Array.from(jobCards, (card) => {
        const titleElement = card.querySelector('.jobTitle')
        const companyElement = card.querySelector('.companyName')
        const locationElement = card.querySelector('.companyLocation')
        const linkElement = card.querySelector('a')

        return {
          title: titleElement?.textContent?.trim() || '',
          company: companyElement?.textContent?.trim() || '',
          location: locationElement?.textContent?.trim() || '',
          url: linkElement ? 'https://www.indeed.com' + linkElement.getAttribute('href') : '',
          platform: 'INDEED' as const,
        }
      })
    })

    return jobs
  } finally {
    await browser.close()
  }
}

interface BlacklistedCompany {
  companyName: string
}

export async function GET(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    let jobs = []

    if (platform === 'linkedin' || !platform) {
      const linkedInJobs = await scrapeLinkedInJobs(searchParams)
      jobs.push(...linkedInJobs)
    }

    if (platform === 'indeed' || !platform) {
      const indeedJobs = await scrapeIndeedJobs(searchParams)
      jobs.push(...indeedJobs)
    }

    // Filter out blacklisted companies
    const blacklistedCompanies = await prisma.blacklistedCompany.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        companyName: true,
      },
    })

    const blacklist = new Set(blacklistedCompanies.map((bc: BlacklistedCompany) => bc.companyName.toLowerCase()))
    jobs = jobs.filter((job) => !blacklist.has(job.company.toLowerCase()))

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error scraping jobs:', error)
    return NextResponse.json(
      { error: 'Error scraping jobs' },
      { status: 500 }
    )
  }
} 