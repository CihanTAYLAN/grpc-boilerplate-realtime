import {
  SafeIsMongoId,
  SafeIsNotEmpty,
} from '../../../../../common/decorators/globalValidation.decorator';

export class DeleteUserDto {
  @SafeIsNotEmpty()
  @SafeIsMongoId()
  id: string;
}
