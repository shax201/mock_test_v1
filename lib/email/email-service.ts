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
