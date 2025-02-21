import {
  SafeIsEmail,
  SafeIsNotEmpty,
} from '../../../../../common/decorators/globalValidation.decorator';

export class EmailVerifyStartDto {
  @SafeIsEmail()
  @SafeIsNotEmpty()
  email: string;
}
