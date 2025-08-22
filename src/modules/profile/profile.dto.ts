import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(0, 160)
  status?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  about?: string;

  // YYYY-MM-DD
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthdate?: string;
}
