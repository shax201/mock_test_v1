import crypto from 'crypto'

export interface StudentTokenData {
  candidateNumber: string
  validFrom: Date
  validUntil: Date
}

export function generateStudentToken(
  candidateNumber: string,
  validFrom: Date,
  validUntil: Date
): string {
  // Create a date-based salt for additional security
  const dateSalt = validFrom.toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Combine candidate number with date salt
  const dataToHash = `${candidateNumber}-${dateSalt}`
  
  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(dataToHash).digest('base64url')
  
  // Return token in format: {candidateNumber}-{hash}
  return `${candidateNumber}-${hash}`
}

export function validateStudentToken(token: string): StudentTokenData | null {
  try {
    // Parse token format: {candidateNumber}-{hash}
    const parts = token.split('-')
    
    if (parts.length !== 2) {
      return null
    }
    
    const [candidateNumber, hash] = parts
    
    if (!candidateNumber || !hash || candidateNumber.length === 0 || hash.length === 0) {
      return null
    }
    
    // For validation, we need to check if the token is valid
    // This would typically involve checking against the database
    // For now, we'll return the candidate number for further validation
    return {
      candidateNumber,
      validFrom: new Date(), // This should be fetched from database
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
  } catch (error) {
    return null
  }
}

export function isTokenExpired(validUntil: Date): boolean {
  return new Date() > validUntil
}

export function isTokenActive(validFrom: Date, validUntil: Date): boolean {
  const now = new Date()
  return now >= validFrom && now <= validUntil
}
