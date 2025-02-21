import {
  SafeIsEmail,
  SafeIsNotEmpty,
  SafeIsString,
  SafeMinLength,
} from '../../../../../common/decorators/globalValidation.decorator';

export class CreateUserDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  @SafeMinLength(2)
  username: string;

  @SafeIsNotEmpty()
  @SafeIsEmail()
  email: string;

  @SafeIsString()
  @SafeIsNotEmpty()
  @SafeMinLength(6)
  password: string;
}
