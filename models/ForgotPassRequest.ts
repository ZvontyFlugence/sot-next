import mongoose, { Schema, Document, Model, ObjectId, isValidObjectId } from 'mongoose';

export interface IForgotPassRequest extends Document {
    _id: mongoose.Types.ObjectId;
    code: string;
    user: string;
    expires: Date;
    active: boolean;
}

const ForgotPassRequestSchema = new Schema({
    _id: { type: mongoose.Types.ObjectId, required: true },
    code: { type: String, required: true },
    user: { type: String, required: true },
    expires: { type: Date, required: true },
    active: { type: Boolean, default: true },
});

let ForgotPassRequest: Model<IForgotPassRequest> | null;
try {
    ForgotPassRequest = mongoose.model('ForgotPassRequest');
} catch (e) {
    ForgotPassRequest = mongoose.model('ForgotPassRequest', ForgotPassRequestSchema, 'forgotPassReqs');
}

export default ForgotPassRequest;