import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Base interface that all document interfaces will extend
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Base schema class that all schema classes will extend
@Schema({ timestamps: true })
export class BaseSchema {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}
