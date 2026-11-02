import { IsUUID } from 'class-validator';

export class AddCourseToTrailDto {
  @IsUUID('4')
  courseId!: string;
}
