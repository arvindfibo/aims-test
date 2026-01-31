import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from '../entities/company.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, CompanyGroup, Role, UserRole]),
    AuthModule, // Import AuthModule to get access to RolesGuard and its dependencies
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
