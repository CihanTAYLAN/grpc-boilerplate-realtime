import {
  SafeIsNotEmpty,
  SafeIsString,
} from '../../../../../common/decorators/globalValidation.decorator';

export class ForgotPasswordDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  emailOrUsername: string;
}
