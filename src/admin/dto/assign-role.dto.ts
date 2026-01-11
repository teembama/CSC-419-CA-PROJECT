import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @IsInt()
  @IsNotEmpty()
  roleId: number;
}