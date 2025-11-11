// eslint-disable-next-line import/no-extraneous-dependencies
import { StatusCodes } from 'http-status-codes';
import { AppError } from 'model';
import nodemailer from 'nodemailer';
import { config } from 'config';
import os from 'os';

class MailerService {
  private transporter: any;
  private static instance: MailerService;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'nhatnguyen.090300@gmail.com',
        pass: 'lpkj bsjf rkby qfki',
      },
      tls: {
        servername: 'smtp.gmail.com',
      },
      connectionTimeout: 60000,
      socketTimeout: 60000,
      debug: true,
      logger: true,
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MailerService();
    }
    return this.instance;
  }

  async sendOtpEmail({ toEmail, otp }: { toEmail: string; otp: string }) {
    const mailOptions = {
      from: `"OTP Verification" <${config.nodemailer.emailUser}>`,
      to: toEmail,
      subject: 'Your OTP Code',
      html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 15 minutes.</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new AppError({
        id: 'MailerService.sendOtpEmail',
        message: 'Failed to send OTP email',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async resetPassword({ toEmail }: { toEmail: string }) {
    const mailOptions = {
      from: `"Security Notification" <${config.nodemailer.emailUser}>`,
      to: toEmail,
      subject: 'Your password has been changed',
      html: `
      <div style="font-family: Arial, sans-serif; color: #333">
        <h2>🔐 Your password was changed</h2>
        <p>Hello,</p>
        <p>This is a confirmation that your password has just been changed.</p>
        <p>If you did not make this change, please reset your password immediately or contact support.</p>
        <br/>
        <p>— QD Food Team</p>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new AppError({
        id: 'MailerService.sendOtpEmail',
        message: 'Failed to send OTP email',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}

export const mailerService = MailerService.getInstance();
