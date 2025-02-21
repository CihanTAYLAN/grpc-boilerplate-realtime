import {
  SafeIsMongoId,
  SafeIsNotEmpty,
} from '../../../../../common/decorators/globalValidation.decorator';

export class GetUserDto {
  @SafeIsNotEmpty()
  @SafeIsMongoId({
    message: 'Invalid user id',
  })
  id: string;
}
