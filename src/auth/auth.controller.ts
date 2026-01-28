import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, SignupResponseDto } from './dto/signup.dto';
import { VerifyEmailDto, VerifyEmailResponseDto } from './dto/verify-email.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User signup with company group creation',
    description:
      'Creates a new user account and company group in a single transaction. The user becomes the super admin of the created company group.',
  })
  @ApiBody({
    type: SignupDto,
    description: 'Signup request with user and company group information',
    examples: {
      example1: {
        summary: 'Complete signup example',
        value: {
          email: 'john.doe@example.com',
          phone: '+1234567890',
          first_name: 'John',
          last_name: 'Doe',
          password: 'SecurePassword123!',
          company_group: {
            name: 'Acme Corporation',
            code: 'ACME',
            description: 'Leading technology company',
          },
        },
      },
      example2: {
        summary: 'Minimal signup example',
        value: {
          email: 'jane@example.com',
          first_name: 'Jane',
          password: 'SecurePassword123!',
          company_group: {
            name: 'Tech Startup Inc',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User and company group created successfully',
    type: SignupResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict - Email or company group already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'User with this email already exists',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'An error occurred during signup',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async signup(@Body(ValidationPipe) signupDto: SignupDto): Promise<SignupResponseDto> {
    this.logger.log(`Signup attempt for email: ${signupDto.email}`);
    return this.authService.signup(signupDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP and get JWT token',
    description:
      'Verifies the user email using the OTP code received via email. Returns a JWT token upon successful verification.',
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Email and OTP code for verification',
    examples: {
      example1: {
        summary: 'Email verification example',
        value: {
          email: 'john.doe@example.com',
          otp_code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully, JWT token returned',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or email already verified',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Email is already verified',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or OTP code',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid or expired OTP code',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'An error occurred during email verification',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async verifyEmail(
    @Body(ValidationPipe) verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    this.logger.log(`Email verification attempt for: ${verifyEmailDto.email}`);
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with email and password',
    description:
      'Authenticates a user with email and password. Returns a JWT token upon successful authentication. User must be verified to login.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Email and password for authentication',
    examples: {
      example1: {
        summary: 'Login example',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, JWT token returned',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email must be an email', 'password should not be empty'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials, inactive account, or unverified email',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid email or password',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'An error occurred during login',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }
}
