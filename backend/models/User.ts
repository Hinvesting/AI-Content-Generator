import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export interface IUser extends mongoose.Document {
  email: string;
  passwordHash: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  stripeCustomerId: { type: String },
  subscriptionStatus: { type: String, default: 'inactive' },
  createdAt: { type: Date, default: () => new Date() }
});

const User = model<IUser>('User', UserSchema);

export default User;
