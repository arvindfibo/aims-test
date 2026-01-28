import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SignupDto, SignupResponseDto } from './dto/signup.dto';
import { VerifyEmailDto, VerifyEmailResponseDto } from './dto/verify-email.dto';
import { User } from '../entities/user.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<SignupResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await this.userRepository.findOne({
        where: {
          email: signupDto.email,
        },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const existingCompanyGroupByName = await this.companyGroupRepository.findOne({
        where: {
          name: signupDto.company_group.name,
        },
      });

      if (existingCompanyGroupByName) {
        throw new ConflictException('Company group with this name already exists');
      }

      if (signupDto.company_group.code) {
        const existingCompanyGroupByCode = await this.companyGroupRepository.findOne({
          where: {
            code: signupDto.company_group.code,
          },
        });

        if (existingCompanyGroupByCode) {
          throw new ConflictException('Company group with this code already exists');
        }
      }

      const hashedPassword = await bcrypt.hash(signupDto.password, this.SALT_ROUNDS);

      const user = this.userRepository.create({
        email: signupDto.email,
        phone: signupDto.phone || null,
        first_name: signupDto.first_name,
        last_name: signupDto.last_name || null,
        password: hashedPassword,
        is_active: true,
        is_verified: false,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      if (!savedUser) {
        throw new InternalServerErrorException('Failed to create user');
      }

      const companyGroup = this.companyGroupRepository.create({
        name: signupDto.company_group.name,
        code: signupDto.company_group.code || null,
        description: signupDto.company_group.description || null,
        is_active: true,
        super_admin_id: savedUser.id,
      });

      const savedCompanyGroup = await queryRunner.manager.save(CompanyGroup, companyGroup);

      if (!savedCompanyGroup) {
        throw new InternalServerErrorException('Failed to create company group');
      }

      await queryRunner.commitTransaction();

      // Generate and send email verification OTP (outside transaction)
      try {
        this.logger.log(`Generating OTP for user ${savedUser.id}`);
        const otpCode = await this.otpService.createEmailVerificationOtp(savedUser.id);
        this.logger.log(`OTP generated: ${otpCode} for user ${savedUser.email}`);

        this.logger.log(`Attempting to send email to ${savedUser.email}`);
        await this.emailService.sendEmailVerificationOtp(
          savedUser.email,
          savedUser.first_name,
          otpCode,
        );
        this.logger.log(`✅ Email verification OTP sent successfully to ${savedUser.email}`);
      } catch (emailError) {
        // Log detailed error but don't fail signup if email fails
        this.logger.error(`❌ Failed to send verification email to ${savedUser.email}`);
        this.logger.error(
          `Error details: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
        );
        if (emailError instanceof Error && emailError.stack) {
          this.logger.error(`Stack trace: ${emailError.stack}`);
        }
      }

      this.logger.log(
        `User ${savedUser.email} signed up successfully with company group ${savedCompanyGroup.name}`,
      );

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          first_name: savedUser.first_name,
          last_name: savedUser.last_name || undefined,
          is_active: savedUser.is_active,
          is_verified: savedUser.is_verified,
          created_at: savedUser.created_at,
        },
        company_group: {
          id: savedCompanyGroup.id,
          name: savedCompanyGroup.name,
          code: savedCompanyGroup.code || undefined,
          is_active: savedCompanyGroup.is_active,
          created_at: savedCompanyGroup.created_at,
        },
        message: 'Signup successful. Please verify your email to activate your account.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error(`Signup failed: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred during signup');
    } finally {
      await queryRunner.release();
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: {
          email: verifyEmailDto.email,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or OTP code');
      }

      // Check if already verified
      if (user.is_verified) {
        throw new BadRequestException('Email is already verified');
      }

      // Verify OTP
      const isOtpValid = await this.otpService.verifyEmailOtp(user.id, verifyEmailDto.otp_code);

      if (!isOtpValid) {
        throw new UnauthorizedException('Invalid or expired OTP code');
      }

      // Update user as verified
      user.is_verified = true;
      const updatedUser = await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: true,
      };

      const accessToken = this.jwtService.sign(payload);

      this.logger.log(`Email verified successfully for user ${user.email}`);

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name || undefined,
          is_active: updatedUser.is_active,
          is_verified: updatedUser.is_verified,
        },
        message: 'Email verified successfully. You are now logged in.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Email verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred during email verification');
    } finally {
      await queryRunner.release();
    }
  }
}
