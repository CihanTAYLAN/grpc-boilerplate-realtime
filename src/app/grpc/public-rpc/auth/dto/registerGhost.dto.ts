import {
  SafeIsEmail,
  SafeIsNotEmpty,
  SafeIsString,
  SafeMinLength,
} from '../../../../../common/decorators/globalValidation.decorator';

export class RegisterGhostsDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  @SafeMinLength(2)
  username: string;

  @SafeIsEmail()
  @SafeIsNotEmpty()
  email: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  @SafeMinLength(6)
  password: string;
}
