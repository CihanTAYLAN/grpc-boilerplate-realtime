import {
  SafeIsString,
  SafeIsNotEmpty,
} from '../../../../../common/decorators/globalValidation.decorator';

export class RefreshTokenDto {
  @SafeIsString()
  @SafeIsNotEmpty()
  refreshToken: string;
}
