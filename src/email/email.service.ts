import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly brevoApi: brevo.TransactionalEmailsApi;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      this.logger.error(
        '❌ BREVO_API_KEY not found in environment variables. Email sending will fail!',
      );
    } else {
      this.logger.log('✅ BREVO_API_KEY found in environment variables');
    }

    this.brevoApi = new brevo.TransactionalEmailsApi();
    this.brevoApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey || '');
  }

  async sendEmailVerificationOtp(email: string, firstName: string, otpCode: string): Promise<void> {
    try {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
      }

      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'AIMS ERP';

      this.logger.log(`Preparing email to ${email} from ${senderEmail} (${senderName})`);

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = 'Verify Your Email Address - AIMS ERP';
      sendSmtpEmail.htmlContent = this.getEmailVerificationTemplate(firstName, otpCode);
      sendSmtpEmail.textContent = this.getEmailVerificationTemplateText(firstName, otpCode);
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = [{ email, name: firstName }];
      sendSmtpEmail.replyTo = { email: senderEmail, name: senderName };

      this.logger.log(`Sending email via Brevo API to ${email}...`);
      this.logger.log(`Sender: ${senderEmail} (${senderName})`);
      this.logger.log(`OTP Code: ${otpCode}`);

      const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      const messageId = result.body?.messageId || 'N/A';

      // Log full response for debugging
      this.logger.log(`Brevo API Response: ${JSON.stringify(result.body, null, 2)}`);
      this.logger.log(`✅ Email verification OTP sent to ${email}. Message ID: ${messageId}`);

      // Important: Check Brevo dashboard if email not received
      if (messageId !== 'N/A') {
        this.logger.warn(
          `⚠️  If email not received, check Brevo dashboard: https://app.brevo.com/transactional`,
        );
        this.logger.warn(`⚠️  Message ID: ${messageId}`);
        this.logger.warn(
          `⚠️  Common issues: 1) Sender email not verified 2) Email in spam 3) Domain not verified`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send email verification OTP to ${email}`);
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);

      // Log full error details for debugging
      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        if (error.stack) {
          this.logger.error(`Stack: ${error.stack}`);
        }
      }

      // Check if it's a Brevo API error
      if (error && typeof error === 'object' && 'response' in error) {
        const brevoError = error as { response?: { body?: unknown } };
        this.logger.error(
          `Brevo API response: ${JSON.stringify(brevoError.response?.body, null, 2)}`,
        );
      }

      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  private getEmailVerificationTemplate(firstName: string, otpCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Email Verification - AIMS ERP</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">AIMS ERP</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin-top: 0; font-size: 20px; font-weight: 600;">Hello ${firstName}!</h2>
                    <p style="font-size: 16px; color: #555555; margin: 0 0 20px 0;">Thank you for signing up with AIMS ERP. Please verify your email address by using the OTP code below:</p>
                    
                    <!-- OTP Code Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px;">
                          <p style="font-size: 14px; color: #666666; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                          <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="font-size: 14px; color: #666666; margin: 20px 0;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666666; margin: 30px 0 0 0;">If you didn't create an account with AIMS ERP, please ignore this email.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 12px; color: #999999; margin: 0;">© ${new Date().getFullYear()} AIMS ERP. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getEmailVerificationTemplateText(firstName: string, otpCode: string): string {
    return `
Hello ${firstName}!

Thank you for signing up with AIMS ERP. Please verify your email address by using the OTP code below:

Your Verification Code: ${otpCode}

This code will expire in 10 minutes.

If you didn't create an account with AIMS ERP, please ignore this email.

© ${new Date().getFullYear()} AIMS ERP. All rights reserved.
    `.trim();
  }

  async sendPasswordResetOtp(email: string, firstName: string, otpCode: string): Promise<void> {
    try {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
      }

      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'AIMS ERP';

      this.logger.log(
        `Preparing password reset email to ${email} from ${senderEmail} (${senderName})`,
      );

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = 'Reset Your Password - AIMS ERP';
      sendSmtpEmail.htmlContent = this.getPasswordResetTemplate(firstName, otpCode);
      sendSmtpEmail.textContent = this.getPasswordResetTemplateText(firstName, otpCode);
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = [{ email, name: firstName }];
      sendSmtpEmail.replyTo = { email: senderEmail, name: senderName };

      this.logger.log(`Sending password reset email via Brevo API to ${email}...`);
      const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      const messageId = result.body?.messageId || 'N/A';

      this.logger.log(`Brevo API Response: ${JSON.stringify(result.body, null, 2)}`);
      this.logger.log(`✅ Password reset OTP sent to ${email}. Message ID: ${messageId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset OTP to ${email}`);
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        if (error.stack) {
          this.logger.error(`Stack: ${error.stack}`);
        }
      }

      if (error && typeof error === 'object' && 'response' in error) {
        const brevoError = error as { response?: { body?: unknown } };
        this.logger.error(
          `Brevo API response: ${JSON.stringify(brevoError.response?.body, null, 2)}`,
        );
      }

      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  private getPasswordResetTemplate(firstName: string, otpCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Reset Password - AIMS ERP</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">AIMS ERP</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin-top: 0; font-size: 20px; font-weight: 600;">Hello ${firstName}!</h2>
                    <p style="font-size: 16px; color: #555555; margin: 0 0 20px 0;">We received a request to reset your password. Use the OTP code below to reset your password:</p>
                    
                    <!-- OTP Code Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px;">
                          <p style="font-size: 14px; color: #666666; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                          <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="font-size: 14px; color: #666666; margin: 20px 0;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666666; margin: 30px 0 0 0;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 12px; color: #999999; margin: 0;">© ${new Date().getFullYear()} AIMS ERP. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplateText(firstName: string, otpCode: string): string {
    return `
Hello ${firstName}!

We received a request to reset your password. Use the OTP code below to reset your password:

Your Reset Code: ${otpCode}

This code will expire in 10 minutes.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} AIMS ERP. All rights reserved.
    `.trim();
  }

  async sendUserInvitation(
    email: string,
    firstName: string,
    companyName: string,
    roleName: string,
    password: string,
    inviteToken: string,
  ): Promise<void> {
    try {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
      }

      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'AIMS ERP';
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const inviteLink = `${appUrl}/accept-invite?token=${inviteToken}`;

      this.logger.log(
        `Preparing user invitation email to ${email} from ${senderEmail} (${senderName})`,
      );

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = `You've been invited to join ${companyName} on AIMS ERP`;
      sendSmtpEmail.htmlContent = this.getUserInvitationTemplate(
        firstName,
        companyName,
        roleName,
        email,
        password,
        inviteLink,
      );
      sendSmtpEmail.textContent = this.getUserInvitationTemplateText(
        firstName,
        companyName,
        roleName,
        email,
        password,
        inviteLink,
      );
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = [{ email, name: firstName }];
      sendSmtpEmail.replyTo = { email: senderEmail, name: senderName };

      this.logger.log(`Sending user invitation email via Brevo API to ${email}...`);
      const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      const messageId = result.body?.messageId || 'N/A';

      this.logger.log(`Brevo API Response: ${JSON.stringify(result.body, null, 2)}`);
      this.logger.log(`✅ User invitation email sent to ${email}. Message ID: ${messageId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send user invitation email to ${email}`);
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        if (error.stack) {
          this.logger.error(`Stack: ${error.stack}`);
        }
      }

      if (error && typeof error === 'object' && 'response' in error) {
        const brevoError = error as { response?: { body?: unknown } };
        this.logger.error(
          `Brevo API response: ${JSON.stringify(brevoError.response?.body, null, 2)}`,
        );
      }

      throw new InternalServerErrorException('Failed to send invitation email');
    }
  }

  private getUserInvitationTemplate(
    firstName: string,
    companyName: string,
    roleName: string,
    email: string,
    password: string,
    inviteLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>You've been invited - AIMS ERP</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">AIMS ERP</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin-top: 0; font-size: 20px; font-weight: 600;">Hello ${firstName}!</h2>
                    <p style="font-size: 16px; color: #555555; margin: 0 0 20px 0;">You've been invited to join <strong>${companyName}</strong> on AIMS ERP.</p>
                    
                    <p style="font-size: 16px; color: #555555; margin: 20px 0 10px 0;">You have been assigned the role: <strong style="color: #667eea; text-transform: uppercase;">${roleName}</strong></p>
                    
                    <p style="font-size: 16px; color: #555555; margin: 20px 0;">Your account has been created with the following credentials:</p>
                    
                    <!-- Credentials Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td style="background-color: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                          <p style="font-size: 14px; color: #666666; margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                          <p style="font-size: 14px; color: #666666; margin: 10px 0 0 0;"><strong>Temporary Password:</strong></p>
                          <div style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: 'Courier New', monospace; margin-top: 10px; padding: 10px; background-color: #ffffff; border-radius: 4px; text-align: center;">${password}</div>
                          <p style="font-size: 12px; color: #999999; margin: 15px 0 0 0; text-align: center;">⚠️ Please change this password after your first login</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="font-size: 14px; color: #666666; margin: 20px 0;">Or copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #999999; margin: 0; word-break: break-all;">${inviteLink}</p>
                    
                    <p style="font-size: 14px; color: #666666; margin: 30px 0 0 0;">If you didn't expect this invitation, please ignore this email.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 12px; color: #999999; margin: 0;">© ${new Date().getFullYear()} AIMS ERP. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getUserInvitationTemplateText(
    firstName: string,
    companyName: string,
    roleName: string,
    email: string,
    password: string,
    inviteLink: string,
  ): string {
    return `
Hello ${firstName}!

You've been invited to join ${companyName} on AIMS ERP.

You have been assigned the role: ${roleName}

Your account has been created with the following credentials:

Email: ${email}
Temporary Password: ${password}

⚠️ Please change this password after your first login

Accept your invitation by clicking this link:
${inviteLink}

If you didn't expect this invitation, please ignore this email.

© ${new Date().getFullYear()} AIMS ERP. All rights reserved.
    `.trim();
  }
}
