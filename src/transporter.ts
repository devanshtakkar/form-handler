const nodemailer = require('nodemailer');
import { SMTP_SERVER, SMTP_SEND_EMAIL, SMTP_PORT, SMTP_LOGIN_EMAIL } from './CONSTANTS';

export function generateTransporter() {
    return nodemailer.createTransport({
        host: SMTP_SERVER,
        port: SMTP_PORT,
        secure: false,
        auth: {
            user: SMTP_LOGIN_EMAIL,
            pass: process.env.SMTP_WEBDEV_PASSWORD
        },
        tls: {
            rejectUnauthorized: true
        }
    })
}