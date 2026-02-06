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
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ResendOtpDto, ResendOtpResponseDto } from './dto/resend-otp.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/forgot-password.dto';
import { User } from '../entities/user.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
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
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
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
        company_group_admin_id: savedUser.id,
      });

      const savedCompanyGroup = await queryRunner.manager.save(CompanyGroup, companyGroup);

      if (!savedCompanyGroup) {
        throw new InternalServerErrorException('Failed to create company group');
      }
      const groupAdminRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'GROUP_ADMIN' },
      });

      if (!groupAdminRole) {
        this.logger.error('GROUP_ADMIN role not found. Please run seeders first: pnpm seed:role');
        throw new InternalServerErrorException(
          'GROUP_ADMIN role not found. Please contact administrator to seed roles.',
        );
      }

      const existingUserRole = await queryRunner.manager.findOne(UserRole, {
        where: {
          user_id: savedUser.id,
          role_id: groupAdminRole.id,
          company_group_id: savedCompanyGroup.id,
        },
      });

      if (existingUserRole) {
        throw new ConflictException('User already has GROUP_ADMIN role assigned');
      }

      const userRole = this.userRoleRepository.create({
        user_id: savedUser.id,
        role_id: groupAdminRole.id,
        company_group_id: savedCompanyGroup.id,
      });
      await queryRunner.manager.save(UserRole, userRole);

      await queryRunner.commitTransaction();

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
        this.logger.log(`Email verification OTP sent successfully to ${savedUser.email}`);
      } catch (emailError) {
        this.logger.error(`Failed to send verification email to ${savedUser.email}`);
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
      const user = await this.userRepository.findOne({
        where: {
          email: verifyEmailDto.email,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or OTP code');
      }
      if (user.is_verified) {
        throw new BadRequestException('Email is already verified');
      }
      const isOtpValid = await this.otpService.verifyEmailOtp(user.id, verifyEmailDto.otp_code);
      if (!isOtpValid) {
        throw new UnauthorizedException('Invalid or expired OTP code');
      }
      user.is_verified = true;
      const updatedUser = await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();
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

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email: loginDto.email,
        },
      });

      if (!user) {
        this.logger.warn(`Login attempt with invalid email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid email or password');
      }
      if (!user.is_active) {
        this.logger.warn(`Login attempt for inactive user: ${user.email}`);
        throw new UnauthorizedException('Account is inactive. Please contact support.');
      }
      if (!user.password) {
        this.logger.warn(`Login attempt for user without password: ${user.email}`);
        throw new UnauthorizedException('Invalid email or password');
      }
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${user.email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.is_verified) {
        this.logger.warn(`Login attempt for unverified user: ${user.email}`);
        throw new UnauthorizedException('Please verify your email before logging in.');
      }
      const payload = {
        sub: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified,
      };
      const accessToken = this.jwtService.sign(payload);
      this.logger.log(`User ${user.email} logged in successfully`);
      return {
        access_token: accessToken,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name || undefined,
          is_active: user.is_active,
          is_verified: user.is_verified,
        },
        message: 'Login successful.',
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  async resendOtp(resendOtpDto: ResendOtpDto): Promise<ResendOtpResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email: resendOtpDto.email,
        },
      });

      if (!user) {
        this.logger.warn(`Resend OTP attempt for non-existent email: ${resendOtpDto.email}`);
        return {
          message: 'If the email exists, an OTP has been sent.',
          email: resendOtpDto.email,
        };
      }
      if (user.is_verified) {
        throw new BadRequestException('Email is already verified');
      }
      try {
        this.logger.log(`Resending OTP for user ${user.id}`);
        const otpCode = await this.otpService.createEmailVerificationOtp(user.id);
        this.logger.log(`OTP generated: ${otpCode} for user ${user.email}`);
        await this.emailService.sendEmailVerificationOtp(user.email, user.first_name, otpCode);
        this.logger.log(`✅ Email verification OTP resent successfully to ${user.email}`);
      } catch (emailError) {
        this.logger.error(`❌ Failed to resend verification email to ${user.email}`);
        this.logger.error(
          `Error details: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
        );
        throw new InternalServerErrorException('Failed to send OTP email');
      }
      return {
        message: 'OTP has been sent to your email address.',
        email: user.email,
      };
    } catch (error) {
      this.logger.error(
        `Resend OTP failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred while resending OTP');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email: forgotPasswordDto.email,
        },
      });
      if (!user) {
        this.logger.warn(
          `Forgot password attempt for non-existent email: ${forgotPasswordDto.email}`,
        );
        return {
          message: 'If the email exists, a password reset OTP has been sent.',
          email: forgotPasswordDto.email,
        };
      }
      if (!user.is_active) {
        throw new UnauthorizedException('Account is inactive. Please contact support.');
      }

      try {
        this.logger.log(`Generating password reset OTP for user ${user.id}`);
        const otpCode = await this.otpService.createPasswordResetOtp(user.id);
        this.logger.log(`Password reset OTP generated: ${otpCode} for user ${user.email}`);

        await this.emailService.sendPasswordResetOtp(user.email, user.first_name, otpCode);
        this.logger.log(`✅ Password reset OTP sent successfully to ${user.email}`);
      } catch (emailError) {
        this.logger.error(`❌ Failed to send password reset email to ${user.email}`);
        this.logger.error(
          `Error details: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
        );
        throw new InternalServerErrorException('Failed to send password reset email');
      }

      return {
        message: 'Password reset OTP has been sent to your email address.',
        email: user.email,
      };
    } catch (error) {
      this.logger.error(
        `Forgot password failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred while processing password reset');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({
        where: {
          email: resetPasswordDto.email,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or OTP code');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Account is inactive. Please contact support.');
      }

      const isOtpValid = await this.otpService.verifyPasswordResetOtp(
        user.id,
        resetPasswordDto.otp_code,
      );
      if (!isOtpValid) {
        throw new UnauthorizedException('Invalid or expired OTP code');
      }
      const hashedPassword = await bcrypt.hash(resetPasswordDto.new_password, this.SALT_ROUNDS);
      user.password = hashedPassword;
      await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      this.logger.log(`Password reset successfully for user ${user.email}`);
      return {
        message: 'Password has been reset successfully.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Password reset failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred during password reset');
    } finally {
      await queryRunner.release();
    }
  }
}
