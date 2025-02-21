import {
  SafeIsNotEmpty,
  SafeIsString,
} from '../../../../../common/decorators/globalValidation.decorator';

export class EmailVerifyFinishDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  verificationToken: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  code: string;
}
