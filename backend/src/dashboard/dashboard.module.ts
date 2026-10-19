import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../auth/user.entity';
import { Curso } from '../cursos/curso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Curso])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
