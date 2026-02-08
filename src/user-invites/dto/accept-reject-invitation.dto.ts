import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token received via email (64-character hexadecimal string)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'Invitation token must be a string' })
  @IsNotEmpty({ message: 'Invitation token is required' })
  @Length(64, 64, { message: 'Invitation token must be exactly 64 characters' })
  invite_token: string;
}

export class AcceptInvitationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Invitation accepted successfully. You can now login with your credentials.',
  })
  message: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'JWT access token for immediate login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;
}

export class RejectInvitationDto {
  @ApiProperty({
    description: 'Invitation token received via email (64-character hexadecimal string)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'Invitation token must be a string' })
  @IsNotEmpty({ message: 'Invitation token is required' })
  @Length(64, 64, { message: 'Invitation token must be exactly 64 characters' })
  invite_token: string;
}

export class RejectInvitationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Invitation rejected successfully',
  })
  message: string;
}
