import ForgotPassRequest from '@/models/ForgotPassRequest';
import User, { IUser } from '@/models/User';
import { connectToDB } from '@/util/mongo';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

interface IResetPassBody {
    requestId: string;
    email: string;
    pass: string;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case 'POST': {
            const { requestId, email, pass } = JSON.parse(req.body) as IResetPassBody;

            // Connect to DB
            await connectToDB();

            // Find Forgot Pass Request
            let forgotPwReq = await ForgotPassRequest.findOne({ _id: requestId }).exec();
            if (!forgotPwReq) {
                return res.status(400).json({ success: false, error: 'Forgot Password Request Not Found' });
            } else if (new Date(forgotPwReq.expires) < new Date(Date.now())) {
                await forgotPwReq.updateOne({ $set: { active: false } }).exec();
                return res.status(400).json({ success: false, error: 'Forgot Password Request Is Expired' })
            }

            // Find Corresponding User
            let user = await User.findOne({ email }).exec();
            if (!user) {
                return res.status(400).json({ success: false, error: 'User Not Found' });
            }

            // Hash New Password
            let hashed_pw = await bcrypt.hash(pass, await bcrypt.genSalt());

            // Update User Password
            let updatedUser = await user.updateOne({ $set: { password: hashed_pw } }).exec();
            if (!updatedUser) {
                return res.status(500).json({ success: false, error: 'Something Went Wrong' });
            }

            // Close Forgot Pass Request
            let updatedReq = await forgotPwReq.updateOne({ $set: { active: false } }).exec();
            if (updatedReq) {
                return res.status(200).json({ success: true, message: 'Password Reset!' });
            }

            return res.status(500).json({ success: false, error: 'Something Went Wrong' });
        }
    }
}