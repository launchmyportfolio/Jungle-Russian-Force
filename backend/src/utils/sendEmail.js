import { Resend } from 'resend';
import { ApiError } from './apiError.js';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, 'Email OTP service is not configured. Please set RESEND_API_KEY.');
  }
  return new Resend(apiKey);
};

export const sendOtpEmail = async ({
  to,
  subject,
  otp,
  expiryMinutes,
}) => {
  if (!to) {
    throw new ApiError(400, 'Recipient email is not configured');
  }

  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const minutes = Number(expiryMinutes) > 0 ? Number(expiryMinutes) : 5;

  const text = [
    `Your OTP is ${otp}.`,
    `It expires in ${minutes} minutes.`,
    'Do not share this OTP with anyone.',
  ].join(' ');

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
    });

    if (error) {
      throw new ApiError(502, 'Failed to send OTP email');
    }
  } catch (_error) {
    throw new ApiError(502, 'Failed to send OTP email');
  }
};
