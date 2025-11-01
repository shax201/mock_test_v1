import jsPDF from 'jspdf'

interface ResultData {
  candidateNumber: string
  testTitle: string
  bands: {
    listening: number
    reading: number
    writing: number
    speaking: number
    overall: number
  }
  feedback: {
    writing: Array<{
      text: string
      comment: string
      range: [number, number]
    }>
  }
  generatedAt: string
}

export function generateIELTSReport(data: ResultData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Colors
  const primaryColor = [0, 102, 204] // Blue
  const secondaryColor = [51, 51, 51] // Dark gray
  const accentColor = [0, 150, 136] // Teal

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Logo placeholder
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Radiance Education', 20, 25)
  
  // Title
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('IELTS Mock Test Results', 20, 60)
  
  // Candidate Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Candidate Number: ${data.candidateNumber}`, 20, 80)
  doc.text(`Test: ${data.testTitle}`, 20, 90)
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, 20, 100)
  
  // Band Scores Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
  doc.text('Band Scores', 20, 120)
  
  // Band scores table
  const bandScores = [
    { module: 'Listening', score: data.bands.listening },
    { module: 'Reading', score: data.bands.reading },
    { module: 'Writing', score: data.bands.writing },
    { module: 'Speaking', score: data.bands.speaking },
    { module: 'Overall', score: data.bands.overall }
  ]
  
  let yPosition = 140
  bandScores.forEach((band, index) => {
    // Module name
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text(band.module, 20, yPosition)
    
    // Score
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const scoreColor = band.score >= 7 ? [0, 150, 0] : band.score >= 6 ? [255, 165, 0] : [255, 0, 0]
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.text(band.score.toString(), 120, yPosition)
    
    // Band description
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    const description = getBandDescription(band.score)
    doc.text(description, 140, yPosition)
    
    yPosition += 15
  })
  
  // Writing Feedback Section
  if (data.feedback.writing.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text('Writing Feedback', 20, yPosition)
    yPosition += 20
    
    data.feedback.writing.forEach((feedback, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
      doc.text(`Comment ${index + 1}:`, 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      
      // Split long text into multiple lines
      const commentLines = doc.splitTextToSize(feedback.comment, pageWidth - 40)
      commentLines.forEach((line: string) => {
        doc.text(line, 20, yPosition)
        yPosition += 5
      })
      
      yPosition += 5
      
      // Original text
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(80, 80, 80)
      doc.text(`Original text: "${feedback.text}"`, 20, yPosition)
      yPosition += 15
    })
  }
  
  // Footer
  const footerY = pageHeight - 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('This report is generated automatically and is valid for 30 days.', 20, footerY)
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 100, footerY)
  
  return doc
}

function getBandDescription(band: number): string {
  if (band >= 9.0) return 'Expert User'
  if (band >= 8.0) return 'Very Good User'
  if (band >= 7.0) return 'Good User'
  if (band >= 6.0) return 'Competent User'
  if (band >= 5.0) return 'Modest User'
  if (band >= 4.0) return 'Limited User'
  if (band >= 3.0) return 'Extremely Limited User'
  if (band >= 2.0) return 'Intermittent User'
  if (band >= 1.0) return 'Non User'
  return 'Did not attempt'
}

export function savePDFToStorage(pdf: jsPDF, filename: string): Promise<string> {
  // This would integrate with your storage solution (S3, Cloudinary, etc.)
  // For now, return a mock URL
  return Promise.resolve(`https://storage.example.com/reports/${filename}`)
}
