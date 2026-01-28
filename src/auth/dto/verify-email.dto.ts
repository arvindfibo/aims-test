import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'OTP code received via email (6 digits)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  otp_code: string;
}

class UserDto {
  @ApiProperty({ description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  first_name: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  last_name?: string;

  @ApiProperty({ description: 'User active status', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'User verified status', example: true })
  is_verified: boolean;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  token_type: string;

  @ApiProperty({ description: 'User information', type: UserDto })
  user: UserDto;

  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully. You are now logged in.',
  })
  message: string;
}
