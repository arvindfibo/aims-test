import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

class UserDto {
  @ApiProperty({ description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  first_name: string;

  @ApiProperty({ description: 'User last name', example: 'Doe', required: false })
  last_name?: string;

  @ApiProperty({ description: 'User active status', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'User verified status', example: true })
  is_verified: boolean;
}

export class LoginResponseDto {
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
    example: 'Login successful.',
  })
  message: string;
}
