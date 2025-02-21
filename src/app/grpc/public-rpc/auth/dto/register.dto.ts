import {
  SafeIsNotEmpty,
  SafeIsString,
  SafeMaxLength,
  SafeMinLength,
} from '../../../../../common/decorators/globalValidation.decorator';

export class RegisterDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  registerToken: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  @SafeMinLength(6)
  @SafeMaxLength(6)
  verificationCode: string;
}
