import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { Tender } from '../entities/tender.entity';
import { Company } from '../entities/company.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Tender, Company, CompanyGroup, Role, UserRole]),
    AuthModule, // Import AuthModule to get access to RolesGuard and its dependencies
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
