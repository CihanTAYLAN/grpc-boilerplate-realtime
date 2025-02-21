import {
  SafeIsNotEmpty,
  SafeIsString,
} from '../../../../../common/decorators/globalValidation.decorator';

export class ForgotPasswordVerifyDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  verificationToken: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  code: string;
}
