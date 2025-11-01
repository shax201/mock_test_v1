import { NextRequest, NextResponse } from 'next/server'
import { generateIELTSReport, savePDFToStorage } from '@/lib/pdf/report-generator'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { candidateNumber } = await request.json()

    if (!candidateNumber) {
      return NextResponse.json(
        { error: 'Candidate number is required' },
        { status: 400 }
      )
    }

    // Find assignment and result
    const assignment = await prisma.assignment.findFirst({
      where: { candidateNumber },
      include: {
        result: {
          include: {
            pdfReport: true
          }
        },
        mock: true,
        student: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (!assignment.result) {
      return NextResponse.json(
        { error: 'Results not yet available' },
        { status: 404 }
      )
    }

    // Check if PDF already exists
    if (assignment.result.pdfReport) {
      // Return existing PDF
      const response = await fetch(assignment.result.pdfReport.fileUrl)
      const pdfBuffer = await response.arrayBuffer()
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="IELTS_Results_${candidateNumber}.pdf"`
        }
      })
    }

    // Get writing feedback
    const writingFeedback = await prisma.writingFeedback.findMany({
      where: {
        submission: {
          assignmentId: assignment.id,
          module: {
            type: 'WRITING'
          }
        }
      }
    })

    // Prepare data for PDF generation
    const resultData = {
      candidateNumber: assignment.candidateNumber,
      testTitle: assignment.mock.title,
      bands: {
        listening: assignment.result.listeningBand || 0,
        reading: assignment.result.readingBand || 0,
        writing: assignment.result.writingBand || 0,
        speaking: assignment.result.speakingBand || 0,
        overall: assignment.result.overallBand || 0
      },
      feedback: {
        writing: writingFeedback.map(fb => ({
          text: fb.comment,
          comment: fb.comment,
          range: [fb.textRangeStart, fb.textRangeEnd] as [number, number]
        }))
      },
      generatedAt: assignment.result.generatedAt.toISOString()
    }

    // Generate PDF
    const pdf = generateIELTSReport(resultData)
    const pdfBuffer = pdf.output('arraybuffer')

    // Save to storage
    const filename = `IELTS_Results_${candidateNumber}_${Date.now()}.pdf`
    const fileUrl = await savePDFToStorage(pdf, filename)

    // Save PDF report to database
    await prisma.pDFReport.create({
      data: {
        resultId: assignment.result.id,
        fileUrl: fileUrl
      }
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
