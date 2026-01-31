import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserInvitesController } from './user-invites.controller';
import { UserInvitesService } from './user-invites.service';
import { UserInvite } from '../entities/user-invite.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { Division } from '../entities/division.entity';
import { Department } from '../entities/department.entity';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInvite, User, Company, Role, UserRole, Division, Department]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: '7d',
      },
    }),
    AuthModule, // Import AuthModule to get access to RolesGuard and its dependencies
    EmailModule, // Import EmailModule to send invitation emails
  ],
  controllers: [UserInvitesController],
  providers: [UserInvitesService],
  exports: [UserInvitesService],
})
export class UserInvitesModule {}
