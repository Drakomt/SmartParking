import nodemailer from 'nodemailer';
import { getSmtpConfig } from '../config/smtp.js';

export const createMailService = ({
  createTransport = nodemailer.createTransport,
  configProvider = getSmtpConfig,
} = {}) => {
  let transporter;
  let config;

  const getTransport = () => {
    if (!transporter) {
      config = configProvider();
      transporter = createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
    }
    return transporter;
  };

  const sendMail = async ({ to, subject, text, html }) => {
    const transport = getTransport();
    return await transport.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });
  };

  return { sendMail };
};

export default createMailService();
