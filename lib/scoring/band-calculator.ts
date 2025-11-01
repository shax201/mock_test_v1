// IELTS Band Score Conversion Tables
const LISTENING_READING_BANDS = [
  { raw: 40, band: 9.0 },
  { raw: 39, band: 8.5 },
  { raw: 38, band: 8.0 },
  { raw: 37, band: 7.5 },
  { raw: 36, band: 7.0 },
  { raw: 35, band: 6.5 },
  { raw: 34, band: 6.0 },
  { raw: 33, band: 6.0 },
  { raw: 32, band: 6.0 },
  { raw: 31, band: 5.5 },
  { raw: 30, band: 5.5 },
  { raw: 29, band: 5.5 },
  { raw: 28, band: 5.0 },
  { raw: 27, band: 5.0 },
  { raw: 26, band: 5.0 },
  { raw: 25, band: 4.5 },
  { raw: 24, band: 4.5 },
  { raw: 23, band: 4.5 },
  { raw: 22, band: 4.0 },
  { raw: 21, band: 4.0 },
  { raw: 20, band: 4.0 },
  { raw: 19, band: 3.5 },
  { raw: 18, band: 3.5 },
  { raw: 17, band: 3.5 },
  { raw: 16, band: 3.0 },
  { raw: 15, band: 3.0 },
  { raw: 14, band: 3.0 },
  { raw: 13, band: 2.5 },
  { raw: 12, band: 2.5 },
  { raw: 11, band: 2.5 },
  { raw: 10, band: 2.0 },
  { raw: 9, band: 2.0 },
  { raw: 8, band: 2.0 },
  { raw: 7, band: 1.5 },
  { raw: 6, band: 1.5 },
  { raw: 5, band: 1.5 },
  { raw: 4, band: 1.0 },
  { raw: 3, band: 1.0 },
  { raw: 2, band: 1.0 },
  { raw: 1, band: 0.5 },
  { raw: 0, band: 0.0 }
]

export function calculateListeningBand(correctAnswers: number): number {
  const entry = LISTENING_READING_BANDS.find(item => item.raw === correctAnswers)
  return entry ? entry.band : 0.0
}

export function calculateReadingBand(correctAnswers: number): number {
  const entry = LISTENING_READING_BANDS.find(item => item.raw === correctAnswers)
  return entry ? entry.band : 0.0
}

export function calculateWritingBand(criteriaScores: {
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammarAccuracy: number
}): number {
  const { taskAchievement, coherenceCohesion, lexicalResource, grammarAccuracy } = criteriaScores
  
  // Calculate average
  const average = (taskAchievement + coherenceCohesion + lexicalResource + grammarAccuracy) / 4
  
  // Apply IELTS rounding rules
  return applyIELTSRounding(average)
}

export function calculateOverallBand(bands: {
  listening: number
  reading: number
  writing: number
  speaking: number
}): number {
  const { listening, reading, writing, speaking } = bands
  
  // Calculate average
  const average = (listening + reading + writing + speaking) / 4
  
  // Apply IELTS rounding rules
  return applyIELTSRounding(average)
}

/**
 * Apply IELTS band rounding rules:
 * - If the average ends in .25, round up to the next half band
 * - If the average ends in .75, round up to the next whole band
 * - Otherwise, round to the nearest half band
 */
export function applyIELTSRounding(score: number): number {
  const wholePart = Math.floor(score)
  const fractionalPart = score - wholePart
  
  if (fractionalPart < 0.25) {
    return wholePart
  } else if (fractionalPart < 0.75) {
    return wholePart + 0.5
  } else {
    return wholePart + 1.0
  }
}

export function getBandDescription(band: number): string {
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

export function getBandColor(band: number): string {
  if (band >= 7.0) return 'text-green-600 bg-green-100'
  if (band >= 6.0) return 'text-yellow-600 bg-yellow-100'
  if (band >= 5.0) return 'text-orange-600 bg-orange-100'
  return 'text-red-600 bg-red-100'
}
