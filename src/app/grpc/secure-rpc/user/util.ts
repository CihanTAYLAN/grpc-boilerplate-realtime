import { UserDocument } from '../../../../schemas/user.schema';

export const mapUserToResponse = (user: UserDocument) => {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    password: '',
    avatar: '',
    createdAtHuman: user.createdAt.toISOString(),
    updatedAtHuman: user.updatedAt.toISOString(),
    createdAt: {
      seconds: user.createdAt.getTime(),
      nanos: 0,
    },
    updatedAt: {
      seconds: user.updatedAt.getTime(),
      nanos: 0,
    },
  };
};
