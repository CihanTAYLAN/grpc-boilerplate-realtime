import {
  SafeIsNotEmpty,
  SafeIsString,
} from '../../../../../common/decorators/globalValidation.decorator';

export class LoginDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  emailOrUsername: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  password: string;
}
