import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, BaseSchema } from './base.schema';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

export interface RegisterGhostsDocument extends BaseDocument {
  username: string;
  email: string;
  password: string;
  avatar: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({ timestamps: true, collection: 'register_ghosts' })
export class RegisterGhosts extends BaseSchema {
  @Prop({ required: true, index: true })
  username: string;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, index: true })
  verificationCode: string;

  @Prop({ index: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

export const RegisterGhostsSchema =
  SchemaFactory.createForClass(RegisterGhosts);

// Add comparePassword method to the schema
RegisterGhostsSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
RegisterGhostsSchema.pre('save', async function (next) {
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
RegisterGhostsSchema.pre('findOneAndUpdate', async function (next) {
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
