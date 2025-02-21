import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidationOptions,
} from 'class-validator';

// Safe decorators with type assertions
export const SafeIsString = () => IsString();
export const SafeIsNotEmpty = () => IsNotEmpty();
export const SafeIsEmail = () => IsEmail();
export const SafeMinLength = (min: number) => MinLength(min);
export const SafeMaxLength = (max: number) => MaxLength(max);
export const SafeIsMongoId = (options?: ValidationOptions) =>
  IsMongoId(options);
export const SafeIsOptional = () => IsOptional();
export const SafeIsNumber = () => IsNumber();
export const SafeMin = (min: number) => Min(min);
export const SafeMax = (max: number) => Max(max);
export const SafeIsBoolean = () => IsBoolean();
export const SafeValidateIf = (
  condition: (object: any, value: any) => boolean,
) => ValidateIf(condition);
