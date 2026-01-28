import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Otp } from '../entities/otp.entity';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_LENGTH = 6;

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly dataSource: DataSource,
  ) {}

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createEmailVerificationOtp(userId: string): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Invalidate any existing unused email verification OTPs for this user
      await queryRunner.manager.update(
        Otp,
        {
          user_id: userId,
          otp_type: 'email_verification',
          is_used: false,
        },
        {
          is_used: true,
        },
      );

      // Generate new OTP
      const otpCode = this.generateOtpCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      // Create new OTP
      const otp = this.otpRepository.create({
        otp_code: otpCode,
        otp_type: 'email_verification',
        user_id: userId,
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
        max_attempts: 3,
      });

      const savedOtp = await queryRunner.manager.save(Otp, otp);
      await queryRunner.commitTransaction();

      this.logger.log(`Email verification OTP created for user ${userId}`);

      return savedOtp.otp_code;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create OTP: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyEmailOtp(userId: string, otpCode: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the OTP
      const otp = await this.otpRepository.findOne({
        where: {
          user_id: userId,
          otp_code: otpCode,
          otp_type: 'email_verification',
          is_used: false,
        },
      });

      if (!otp) {
        this.logger.warn(`Invalid OTP code for user ${userId}`);
        return false;
      }

      // Check if OTP is expired
      if (new Date() > otp.expires_at) {
        this.logger.warn(`Expired OTP code for user ${userId}`);
        // Mark as used
        await queryRunner.manager.update(Otp, { id: otp.id }, { is_used: true });
        await queryRunner.commitTransaction();
        return false;
      }

      // Check if max attempts exceeded
      if (otp.attempts >= otp.max_attempts) {
        this.logger.warn(`Max attempts exceeded for OTP ${otp.id}`);
        await queryRunner.manager.update(Otp, { id: otp.id }, { is_used: true });
        await queryRunner.commitTransaction();
        return false;
      }

      // Verify OTP code matches (already checked in findOne, but double-check)
      if (otp.otp_code !== otpCode) {
        // Increment attempts for wrong code
        await queryRunner.manager.increment(Otp, { id: otp.id }, 'attempts', 1);
        await queryRunner.commitTransaction();
        this.logger.warn(`OTP code mismatch for user ${userId}`);
        return false;
      }

      // Mark OTP as used
      await queryRunner.manager.update(Otp, { id: otp.id }, { is_used: true });
      await queryRunner.commitTransaction();

      this.logger.log(`Email verification OTP verified successfully for user ${userId}`);
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to verify OTP: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
