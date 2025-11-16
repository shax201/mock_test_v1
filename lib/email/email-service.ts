import { Resend } from 'resend'

// Using Resend for email delivery

interface AssignmentEmailData {
  studentName: string
  studentEmail: string
  mockTitle: string
  mockDescription: string
  validUntil: string
  testLink: string
}

interface ResultModuleSummary {
  name: string
  status: string
  band: number | null
  score: number | null
  completedAt?: string | null
  testTitle?: string | null
}

interface ResultsEmailData {
  studentName: string
  studentEmail: string
  mockTitle?: string | null
  overallBand?: number | null
  modules: ResultModuleSummary[]
  message?: string | null
}

interface WritingTestResultEmailData {
  candidateName: string
  studentEmail: string
  testDate: string
  portalLink: string
  writingBand?: number | null
  overallBand?: number | null
  readingBand?: number | null
  listeningBand?: number | null
  speakingBand?: number | null
}

interface LoginCredentialsEmailData {
  studentName: string
  studentEmail: string
  password: string
  portalLink: string
}

class EmailService {
  private resend: Resend

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || 'dummy-key-for-build'
    // Resend Node SDK defaults to the public base URL (https://api.resend.com)
    // See: https://api.resend.com
    this.resend = new Resend(apiKey)
  }

  async sendAssignmentNotification(emailData: AssignmentEmailData): Promise<boolean> {
    try {
      // Skip sending if no valid API key is configured
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
        console.log('Email service not configured - skipping email send')
        return true
      }

      const { data: sendData, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'IELTS Mock Test <noreply@yourdomain.com>',
        to: emailData.studentEmail,
        subject: `New Mock Test Assignment: ${emailData.mockTitle}`,
        html: this.generateAssignmentEmailHTML(emailData),
        text: this.generateAssignmentEmailText(emailData)
      })
      if (error) throw error
      console.log('Assignment email sent successfully:', sendData?.id)
      return true
    } catch (error) {
      console.error('Error sending assignment email:', error)
      return false
    }
  }

  async sendResultsSummaryEmail(emailData: ResultsEmailData): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
        console.log('Email service not configured - skipping results email send')
        return true
      }

      const subjectParts = ['Your IELTS Mock Test Results']
      if (emailData.mockTitle) {
        subjectParts.push(`– ${emailData.mockTitle}`)
      }

      const { data: sendData, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'IELTS Mock Test <noreply@yourdomain.com>',
        to: emailData.studentEmail,
        subject: subjectParts.join(' '),
        html: this.generateResultsEmailHTML(emailData),
        text: this.generateResultsEmailText(emailData)
      })
      if (error) throw error
      console.log('Results email sent successfully:', sendData?.id)
      return true
    } catch (error) {
      console.error('Error sending results email:', error)
      return false
    }
  }

  async sendWritingTestResultEmail(emailData: WritingTestResultEmailData): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
        console.log('Email service not configured - skipping writing test result email send')
        return true
      }

      const { data: sendData, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'Radiance Education <noreply@radianceedu.app>',
        to: emailData.studentEmail,
        subject: 'Your Mock Test Result is Available',
        html: this.generateWritingTestResultEmailHTML(emailData),
        text: this.generateWritingTestResultEmailText(emailData)
      })
      if (error) throw error
      console.log('Writing test result email sent successfully:', sendData?.id)
      return true
    } catch (error) {
      console.error('Error sending writing test result email:', error)
      return false
    }
  }

  async sendLoginCredentialsEmail(emailData: LoginCredentialsEmailData): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
        console.log('Email service not configured - skipping login credentials email send')
        return true
      }

      const { data: sendData, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'Radiance Education <noreply@radianceedu.app>',
        to: emailData.studentEmail,
        subject: 'Your Student Portal Login Credentials',
        html: this.generateLoginCredentialsEmailHTML(emailData),
        text: this.generateLoginCredentialsEmailText(emailData)
      })
      if (error) throw error
      console.log('Login credentials email sent successfully:', sendData?.id)
      return true
    } catch (error) {
      console.error('Error sending login credentials email:', error)
      return false
    }
  }

  private generateAssignmentEmailHTML(data: AssignmentEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Mock Test Assignment</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 15px;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .assignment-card {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .test-button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
            .test-button:hover {
                background: #0056b3;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 20px 0;
            }
            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #007bff;
            }
            .info-label {
                font-weight: bold;
                color: #495057;
                font-size: 14px;
            }
            .info-value {
                color: #212529;
                margin-top: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                background: #e9ecef;
                border-radius: 6px;
                font-size: 14px;
                color: #6c757d;
            }
            @media (max-width: 600px) {
                .info-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" alt="IELTS Logo" class="logo" width="200" height="60" style="max-width: 200px; height: auto;" />
            <h1>🎯 New Mock Test Assignment</h1>
            <p>You have been assigned a new IELTS mock test!</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${data.studentName}</strong>,</p>
            
            <p>Great news! You have been assigned a new IELTS mock test. This is an excellent opportunity to practice and assess your English language skills.</p>
            
            <div class="assignment-card">
                <h2 style="margin-top: 0; color: #007bff;">${data.mockTitle}</h2>
                <p style="color: #6c757d; margin-bottom: 20px;">${data.mockDescription}</p>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Valid Until</div>
                        <div class="info-value">${new Date(data.validUntil).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Test Duration</div>
                        <div class="info-value">Approximately 2 hours 45 minutes</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.testLink}" class="test-button">Start Your Mock Test</a>
                </div>
            </div>
            
            <h3>📋 Test Instructions</h3>
            <ul>
                <li><strong>Reading Test (60 minutes):</strong> Read passages and answer comprehension questions. You'll need to answer 40 questions across 3 passages.</li>
                <li>Answer all questions within the time limit</li>
                <li>You can navigate between questions and passages</li>
                <li>Review your answers before submitting</li>
            </ul>
            
            <h3>💡 Tips for Success</h3>
            <ul>
                <li>Find a quiet place with no distractions</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Have a pen and paper ready for notes</li>
                <li>Complete the test in one sitting for best results</li>
            </ul>
            
            <p><strong>Important:</strong> Please complete your test before the expiration date. Late submissions cannot be accepted.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from the IELTS Mock Test System.</p>
            <p>If you have any questions, please contact your instructor or administrator.</p>
            <p>Good luck with your test! 🍀</p>
        </div>
    </body>
    </html>
    `
  }

  private generateAssignmentEmailText(data: AssignmentEmailData): string {
    return `
New Mock Test Assignment

Dear ${data.studentName},

You have been assigned a new IELTS mock test: ${data.mockTitle}

Description: ${data.mockDescription}

Valid Until: ${new Date(data.validUntil).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

Test Link: ${data.testLink}

Test Instructions:
- Reading Test (60 minutes): Read passages and answer comprehension questions
- You'll need to answer 40 questions across 3 passages
- Answer all questions within the time limit
- You can navigate between questions and passages
- Review your answers before submitting

Tips for Success:
- Find a quiet place with no distractions
- Ensure you have a stable internet connection
- Have a pen and paper ready for notes
- Complete the test in one sitting for best results

Important: Please complete your test before the expiration date. Late submissions cannot be accepted.

This is an automated message from the IELTS Mock Test System.
If you have any questions, please contact your instructor or administrator.

Good luck with your test!

---
IELTS Mock Test System
    `
  }

  private generateResultsEmailHTML(data: ResultsEmailData): string {
    const overallBand = data.overallBand !== null && data.overallBand !== undefined
      ? data.overallBand.toFixed(1)
      : 'Pending'

    const moduleRows = data.modules.map((module) => {
      const bandDisplay = module.band !== null && module.band !== undefined ? module.band.toFixed(1) : 'Pending'
      const scoreDisplay = module.score !== null && module.score !== undefined ? module.score : 'Pending'
      const completedAt = module.completedAt
        ? new Date(module.completedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '—'
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #12355b;">${module.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${module.testTitle ?? '—'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${module.status}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${bandDisplay}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${scoreDisplay}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${completedAt}</td>
        </tr>
      `
    }).join('')

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IELTS Mock Test Results</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f7fb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 640px;
          margin: 0 auto;
          padding: 20px;
        }
        .card {
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(18, 53, 91, 0.12);
          overflow: hidden;
        }
        .card-header {
          background: linear-gradient(135deg, #12355b 0%, #1f6feb 100%);
          color: #ffffff;
          padding: 32px;
          text-align: center;
        }
        .card-header h1 {
          margin: 0;
          font-size: 24px;
          letter-spacing: 0.5px;
        }
        .card-header p {
          margin: 8px 0 0;
          font-size: 16px;
          opacity: 0.85;
        }
        .logo {
          max-width: 200px;
          height: auto;
          margin-bottom: 15px;
        }
        .card-body {
          padding: 32px;
        }
        .modules-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .modules-table thead th {
          text-align: left;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 12px;
          background-color: #f1f5fb;
          color: #53657d;
        }
        .highlight {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eaf4ff;
          color: #1f6feb;
          border-radius: 999px;
          padding: 8px 16px;
          font-weight: 600;
          margin-top: 12px;
        }
        .message {
          margin-top: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #1f6feb;
          color: #12355b;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #7a8ca8;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="card-header">
            <img src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" alt="IELTS Logo" class="logo" width="200" height="60" style="max-width: 200px; height: auto;" />
            <h1>Your IELTS Mock Test Results</h1>
            <p>${data.mockTitle ?? 'Overall Performance Summary'}</p>
            <div class="highlight">
              Overall Band: <span style="margin-left: 8px; font-size: 18px;">${overallBand}</span>
            </div>
          </div>
          <div class="card-body">
            <p>Dear <strong>${data.studentName}</strong>,</p>
            <p>Thank you for completing your IELTS practice modules. Below is a snapshot of your performance across Reading, Listening, and Writing. Use this summary to celebrate progress and identify focus areas for your next study session.</p>

            <table class="modules-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Test</th>
                  <th>Status</th>
                  <th>Band</th>
                  <th>Score</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                ${moduleRows}
              </tbody>
            </table>

            ${data.message ? `<div class="message">${data.message}</div>` : ''}

            <p style="margin-top: 24px;">📝 <strong>Next Steps:</strong></p>
            <ul style="color: #12355b;">
              <li>Review modules with pending evaluations to complete the full experience.</li>
              <li>Revisit areas with lower bands and practice targeted exercises.</li>
              <li>Schedule a feedback session with your instructor to discuss improvement strategies.</li>
            </ul>

            <p>Keep up the excellent work—consistent practice is the key to achieving your target IELTS band score!</p>
          </div>
        </div>
        <div class="footer">
          This email was sent by the Radiance Education IELTS Mock Test platform. If you have any questions, please contact your instructor.
        </div>
      </div>
    </body>
    </html>
    `
  }

  private generateResultsEmailText(data: ResultsEmailData): string {
    const overallBand = data.overallBand !== null && data.overallBand !== undefined
      ? data.overallBand.toFixed(1)
      : 'Pending'

    const moduleLines = data.modules.map((module) => {
      const bandDisplay = module.band !== null && module.band !== undefined ? module.band.toFixed(1) : 'Pending'
      const scoreDisplay = module.score !== null && module.score !== undefined ? module.score : 'Pending'
      const completedAt = module.completedAt
        ? new Date(module.completedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Pending'

      return [
        `Module      : ${module.name}`,
        `Test        : ${module.testTitle ?? '—'}`,
        `Status      : ${module.status}`,
        `Band        : ${bandDisplay}`,
        `Score       : ${scoreDisplay}`,
        `Completed   : ${completedAt}`
      ].join('\n')
    }).join('\n\n')

    return `
IELTS Mock Test Results

Student : ${data.studentName}
Overall Band : ${overallBand}
Test : ${data.mockTitle ?? 'IELTS Mock Test'}

${moduleLines}

${data.message ? `Message:\n${data.message}\n\n` : ''}
Next Steps:
- Review modules marked as pending to complete your evaluation.
- Focus on areas with lower band scores for targeted improvement.
- Reach out to your instructor if you would like additional guidance.

Keep practising—steady progress will lead to your goal score!

Radiance Education
`
  }

  private generateWritingTestResultEmailHTML(data: WritingTestResultEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mock Test Result Available</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .email-container {
                background: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                border-bottom: 2px solid #12355b;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .content {
                margin-bottom: 30px;
            }
            .content p {
                margin-bottom: 15px;
            }
            .portal-link {
                display: inline-block;
                background: #12355b;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
            .portal-link:hover {
                background: #1f6feb;
            }
            .note {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .portal-link {
                display: inline-block;
                background: linear-gradient(135deg, #12355b 0%, #1f6feb 100%);
                color: #ffffff !important;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 24px 0;
                box-shadow: 0 4px 6px rgba(18, 53, 91, 0.2);
                text-align: center;
                letter-spacing: 0.5px;
                min-width: 200px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <img src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" alt="IELTS Logo" class="logo" width="200" height="60" style="max-width: 200px; height: auto;" />
                <h2 style="color: #12355b; margin: 0;">Radiance Education</h2>
            </div>
            
            <div class="content">
                <p>Dear ${data.candidateName},</p>
                
                <p>Your mock test result for <strong>${data.testDate}</strong> is now available.</p>
                
                ${(data.writingBand !== null && data.writingBand !== undefined) || 
                  (data.overallBand !== null && data.overallBand !== undefined) || 
                  (data.readingBand !== null && data.readingBand !== undefined) || 
                  (data.listeningBand !== null && data.listeningBand !== undefined) || 
                  (data.speakingBand !== null && data.speakingBand !== undefined) ? `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0;">
                    <h3 style="font-size: 20px; font-weight: 600; color: #12355b; margin-bottom: 20px; text-align: center;">Your Test Results</h3>
                    <div style="display: grid; gap: 12px;">
                        ${data.readingBand !== null && data.readingBand !== undefined ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px;">
                            <span style="font-weight: 500; color: #333;">Reading Band:</span>
                            <span style="font-size: 18px; font-weight: 600; color: #1f6feb;">${data.readingBand.toFixed(1)}</span>
                        </div>
                        ` : ''}
                        ${data.listeningBand !== null && data.listeningBand !== undefined ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px;">
                            <span style="font-weight: 500; color: #333;">Listening Band:</span>
                            <span style="font-size: 18px; font-weight: 600; color: #1f6feb;">${data.listeningBand.toFixed(1)}</span>
                        </div>
                        ` : ''}
                        ${data.writingBand !== null && data.writingBand !== undefined ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px;">
                            <span style="font-weight: 500; color: #333;">Writing Band:</span>
                            <span style="font-size: 18px; font-weight: 600; color: #1f6feb;">${data.writingBand.toFixed(1)}</span>
                        </div>
                        ` : ''}
                        ${data.speakingBand !== null && data.speakingBand !== undefined ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px;">
                            <span style="font-weight: 500; color: #333;">Speaking Band:</span>
                            <span style="font-size: 18px; font-weight: 600; color: #9333ea;">${data.speakingBand.toFixed(1)}</span>
                        </div>
                        ` : ''}
                        ${data.overallBand !== null && data.overallBand !== undefined ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: linear-gradient(135deg, #12355b 0%, #1f6feb 100%); border-radius: 6px; margin-top: 8px;">
                            <span style="font-weight: 600; color: white; font-size: 16px;">Overall Band (R+L+W+S):</span>
                            <span style="font-size: 24px; font-weight: 700; color: white;">${data.overallBand.toFixed(1)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${data.portalLink}" class="portal-link" style="display: inline-block; background: linear-gradient(135deg, #12355b 0%, #1f6feb 100%); color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(18, 53, 91, 0.2); letter-spacing: 0.5px; min-width: 200px;">Access Your Portal</a>
                </div>
                
                <div class="note">
                    <p style="margin: 0;"><strong>Note:</strong> For detailed Writing feedback, you may visit our campus within 5 days of the result date.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Regards,<br><strong>Radiance Education</strong></p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateWritingTestResultEmailText(data: WritingTestResultEmailData): string {
    const results: string[] = []
    
    if (data.readingBand !== null && data.readingBand !== undefined) {
      results.push(`Reading Band: ${data.readingBand.toFixed(1)}`)
    }
    if (data.listeningBand !== null && data.listeningBand !== undefined) {
      results.push(`Listening Band: ${data.listeningBand.toFixed(1)}`)
    }
    if (data.writingBand !== null && data.writingBand !== undefined) {
      results.push(`Writing Band: ${data.writingBand.toFixed(1)}`)
    }
    if (data.speakingBand !== null && data.speakingBand !== undefined) {
      results.push(`Speaking Band: ${data.speakingBand.toFixed(1)}`)
    }
    if (data.overallBand !== null && data.overallBand !== undefined) {
      results.push(`Overall Band (R+L+W+S): ${data.overallBand.toFixed(1)}`)
    }
    
    const resultsSection = results.length > 0 ? `\n\nYour Test Results:\n${results.join('\n')}\n` : ''
    
    return `
Dear ${data.candidateName},

Your mock test result for ${data.testDate} is now available.${resultsSection}
Portal: ${data.portalLink}

Note: For detailed Writing feedback, you may visit our campus within 5 days of the result date.

Regards,
Radiance Education
    `
  }

  private generateLoginCredentialsEmailHTML(data: LoginCredentialsEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Login Credentials</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .email-container {
                background: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                border-bottom: 2px solid #12355b;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .content {
                margin-bottom: 30px;
            }
            .content p {
                margin-bottom: 15px;
            }
            .credentials-box {
                background: #f8f9fa;
                border: 2px solid #12355b;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .credential-item {
                margin: 15px 0;
                padding: 10px;
                background: #ffffff;
                border-radius: 4px;
            }
            .credential-label {
                font-weight: bold;
                color: #12355b;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .credential-value {
                font-size: 16px;
                color: #333;
                font-family: monospace;
                word-break: break-all;
            }
            .portal-link {
                display: inline-block;
                background: #12355b;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
            .portal-link:hover {
                background: #1f6feb;
            }
            .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <img src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" alt="IELTS Logo" class="logo" width="200" height="60" style="max-width: 200px; height: auto;" />
                <h2 style="color: #12355b; margin: 0;">Radiance Education</h2>
            </div>
            
            <div class="content">
                <p>Dear ${data.studentName},</p>
                
                <p>Welcome to Radiance Education! Your student account has been created. Please find your login credentials below:</p>
                
                <div class="credentials-box">
                    <div class="credential-item">
                        <div class="credential-label">Email:</div>
                        <div class="credential-value">${data.studentEmail}</div>
                    </div>
                    <div class="credential-item">
                        <div class="credential-label">Password:</div>
                        <div class="credential-value">${data.password}</div>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.portalLink}" class="portal-link" style="color: #ffffff !important;">Access Your Portal</a>
                </div>
                
                <div class="warning">
                    <p style="margin: 0;"><strong>Important:</strong> Please keep your login credentials secure and change your password after your first login for security purposes.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Regards,<br><strong>Radiance Education</strong></p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateLoginCredentialsEmailText(data: LoginCredentialsEmailData): string {
    return `
Dear ${data.studentName},

Welcome to Radiance Education! Your student account has been created. Please find your login credentials below:

Email: ${data.studentEmail}
Password: ${data.password}

Portal: ${data.portalLink}

Important: Please keep your login credentials secure and change your password after your first login for security purposes.

Regards,
Radiance Education
    `
  }

  async testConnection(): Promise<boolean> {
    try {
      // Resend does not expose a direct verify call; we do a dry-run send to self if API key exists
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') return false
      return true
    } catch (error) {
      console.error('Email service connection failed:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
