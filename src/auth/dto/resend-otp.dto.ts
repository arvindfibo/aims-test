import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResendOtpResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP has been sent to your email address.',
  })
  message: string;

  @ApiProperty({
    description: 'Email address where OTP was sent',
    example: 'john.doe@example.com',
  })
  email: string;
}
