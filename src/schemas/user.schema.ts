import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, BaseSchema } from './base.schema';
import * as bcrypt from 'bcrypt';

export interface UserDocument extends BaseDocument {
  username: string;
  email: string;
  password: string;
  avatar: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false })
  avatar: string;

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add comparePassword method to the schema
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    next(error);
  }
});

// Hash password before update
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as { password?: string };

  // Only hash password if it's being modified
  if (!update?.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
    next();
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    next(error);
  }
});
