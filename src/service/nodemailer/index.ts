import { config } from 'config';
import { StatusCodes } from 'http-status-codes';
import { AppError } from 'model';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

class MailerService {
  private transporter: any;
  private static instance: MailerService;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.nodemailer.host,
      port: config.nodemailer.port,
      secure: config.nodemailer.secure,
      auth: {
        user: config.nodemailer.emailUser,
        pass: config.nodemailer.emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 120000,
      socketTimeout: 120000,
      debug: true,
      logger: true,
      family: 4,
    } as SMTPTransport.Options);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MailerService();
    }
    return this.instance;
  }

  async sendOtpEmail({ toEmail, otp }: { toEmail: string; otp: string }) {
    const mailOptions = {
      from: `"Xác minh OTP" <${config.nodemailer.emailUser}>`,
      to: toEmail,
      subject: 'QD FOOD - Mã xác minh OTP của bạn',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
          <h2 style="color: #2c7be5; text-align: center;">🔐 Mã xác minh OTP</h2>
          <p style="font-size: 16px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; color: #333;">
            Đây là mã OTP để xác minh tài khoản:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="display: inline-block; background-color: #2c7be5; color: #fff; padding: 12px 25px; border-radius: 6px; font-size: 22px; letter-spacing: 3px; font-weight: bold;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #555;">
            ⚠️ Mã OTP này sẽ hết hạn sau <b>15 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 14px; color: #999; text-align: center;">Cảm ơn bạn đã sử dụng dịch vụ của QD Food</p>
        </div>
      </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new AppError({
        id: 'MailerService.sendOtpEmail',
        message: 'Không thể gửi email OTP',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async resetPassword({ toEmail }: { toEmail: string }) {
    const mailOptions = {
      from: `"Thông báo bảo mật" <${config.nodemailer.emailUser}>`,
      to: toEmail,
      subject: 'QD FOOD - Mật khẩu của bạn đã được thay đổi',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
          <h2 style="color: #2c7be5; text-align: center;">🔐 Thông báo bảo mật</h2>
          <p style="font-size: 16px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; color: #333;">
            Mật khẩu tài khoản của bạn vừa được thay đổi thành công.
          </p>
          <p style="font-size: 15px; color: #555;">
            Nếu bạn không thực hiện thao tác này, vui lòng <b>đặt lại mật khẩu</b> ngay lập tức hoặc liên hệ bộ phận hỗ trợ của chúng tôi.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 14px; color: #999; text-align: center;">Cảm ơn bạn đã tin tưởng QD Food</p>
        </div>
      </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new AppError({
        id: 'MailerService.resetPassword',
        message: 'Không thể gửi email thông báo đổi mật khẩu',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}

export const mailerService = MailerService.getInstance();
