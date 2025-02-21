import {
  SafeIsString,
  SafeIsNotEmpty,
} from '../../../../../common/decorators/globalValidation.decorator';

export class LogoutDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  accessToken: string;
}
