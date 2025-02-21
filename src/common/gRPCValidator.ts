import * as grpc from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';

const formatValidationErrors = (errors: ValidationError[]) => {
  return errors
    .map((error) => Object.values(error.constraints || {}).join(', '))
    .filter(Boolean)
    .join(', ');
};

const validateDto = async (
  dtoClass: new () => any,
  data: Record<string, any>,
) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const object = plainToInstance(dtoClass, cleanData);
  const validationOptions: ValidatorOptions = {
    whitelist: true,
  };

  const errors = await validate(object as object, validationOptions);

  if (errors.length > 0) {
    throw new RpcException({
      code: grpc.status.INVALID_ARGUMENT,
      message: formatValidationErrors(errors),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return object;
};

export function ValidateGrpcInput(dtoClass: new () => any) {
  return function (
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [data] = args;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await validateDto(dtoClass, data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return originalMethod.apply(this, args);
    };
  };
}
