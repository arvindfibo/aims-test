import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyGroupsController } from './company-groups.controller';
import { CompanyGroupsService } from './company-groups.service';
import { CompanyGroup } from '../entities/company-group.entity';
import { Company } from '../entities/company.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserInvite } from '../entities/user-invite.entity';
import { Role } from '../entities/role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyGroup, Company, Role, UserRole, UserInvite]),
    AuthModule, // Import AuthModule to get access to JwtAuthGuard
  ],
  controllers: [CompanyGroupsController],
  providers: [CompanyGroupsService],
  exports: [CompanyGroupsService],
})
export class CompanyGroupsModule {}
