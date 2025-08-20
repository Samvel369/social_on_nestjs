import { IsBooleanString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CleanupTimeDto {
  @IsInt() @Min(1) @Max(120)
  minutes!: number;
}

export class CancelFriendDto {
  // аналог request.form.get('subscribe')
  @IsOptional() @IsBooleanString()
  subscribe?: string; // '1' | 'true' | 'on' ...
}
