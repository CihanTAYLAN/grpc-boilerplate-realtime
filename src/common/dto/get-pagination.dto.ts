import {
  SafeIsNotEmpty,
  SafeIsNumber,
  SafeMax,
  SafeMin,
} from '../decorators/globalValidation.decorator';

export class GetPaginationDto {
  @SafeIsNotEmpty()
  @SafeIsNumber()
  @SafeMin(1)
  page: number;

  @SafeIsNotEmpty()
  @SafeIsNumber()
  @SafeMin(1)
  @SafeMax(1000)
  itemsPerPage: number;
}
