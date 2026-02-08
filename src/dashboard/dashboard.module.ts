import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CompanyGroup } from '../entities/company-group.entity';
import { Company } from '../entities/company.entity';
import { Division } from '../entities/division.entity';
import { Department } from '../entities/department.entity';
import { UserRole } from '../entities/user-role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyGroup, Company, Division, Department, UserRole]),
    AuthModule, // Import AuthModule to get access to RolesGuard and its dependencies
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
