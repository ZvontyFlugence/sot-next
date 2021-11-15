import ForgotPassRequest from '@/models/ForgotPassRequest';
import User, { IUser } from '@/models/User';
import { connectToDB } from '@/util/mongo';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

interface IForgotPassBody {
    email: string;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case 'POST': {
            const { email } = JSON.parse(req.body) as IForgotPassBody;

            // Connect to DB
            await connectToDB();

            // Look for account with matching email
            let account: IUser = await User.findOne({ email }).exec();
            if (!account) {
                return res.status(400).json({ success: false, message: 'Email Not Found' });
            }

            try {
                // Generate forgot pass code
                let resetCode = (await import('crypto')).randomBytes(32).toString('hex');

                // Store code in DB table for given user
                let record = new ForgotPassRequest({
                    _id: new mongoose.Types.ObjectId(),
                    code: resetCode,
                    user: account.email,
                    expires: new Date(new Date(Date.now()).setUTCMinutes(30)),
                });

                await record.save();

                // Send email to given email account with link to reset password given a valid code
                const transporter = nodemailer.createTransport(smtpTransport({
                    host: process.env.EMAIL_HOST,
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_LOGIN,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                }));

                await transporter.sendMail({
                    from: 'noreply@state-of-turmoil.net',
                    to: email,
                    subject: 'Reset Password Link',
                    html: (
                        `<div>
                            <p>Someone requested to reset your password. If this was not you, please ignore it.</p>
                            <p>Click the link below to reset your password, it will expire in 30 minutes.</p>
                            <p>
                                <a href="${process.env.URI}/reset-pass?code=${resetCode}">Reset Password Link</a>
                            </p>
                        </div>`
                    ),
                });

                return res.status(200).json({ success: true, message: 'Email Sent!' });
            } catch (e) {
                console.log('Received Error:', e);
                return res.status(500).json({ success: false, error: 'Something Went Wrong' });
            }
        }
        default:
            return res.status(404).json({ error: 'Unhandled HTTP Method' });
    }
}