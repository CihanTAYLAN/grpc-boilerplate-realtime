import {
  SafeIsNotEmpty,
  SafeIsString,
} from '../../../../../common/decorators/globalValidation.decorator';

export class ResetPasswordDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  verificationToken: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  password: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  confirmPassword: string;
}
