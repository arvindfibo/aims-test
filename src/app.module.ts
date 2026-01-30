import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { RolesModule } from './roles/roles.module';
import { UserInvitesModule } from './user-invites/user-invites.module';
import { CompanyGroupsModule } from './company-groups/company-groups.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CompaniesModule,
    RolesModule,
    UserInvitesModule,
    CompanyGroupsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
