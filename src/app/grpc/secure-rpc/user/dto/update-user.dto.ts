import {
  SafeIsEmail,
  SafeIsMongoId,
  SafeIsNotEmpty,
  SafeIsString,
  SafeMinLength,
  SafeValidateIf,
} from '../../../../../common/decorators/globalValidation.decorator';

export class UpdateUserDto {
  @SafeIsNotEmpty()
  @SafeIsMongoId()
  id: string;

  @SafeIsString()
  @SafeMinLength(2)
  @SafeValidateIf((request: UpdateUserDto) => {
    return (
      request.username !== undefined &&
      request.username !== null &&
      request.username !== ''
    );
  })
  username?: string;

  @SafeIsString()
  @SafeIsEmail()
  @SafeValidateIf((request: UpdateUserDto) => {
    return (
      request.email !== undefined &&
      request.email !== null &&
      request.email !== ''
    );
  })
  email?: string;

  @SafeIsString()
  @SafeMinLength(6)
  @SafeValidateIf((request: UpdateUserDto) => {
    return (
      request.password !== undefined &&
      request.password !== null &&
      request.password !== ''
    );
  })
  password?: string;
}
