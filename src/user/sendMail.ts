const nodemailer = require('nodemailer');
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

export const sendEmail = (
  configService: ConfigService,
  to: string,
  url: string,
  txt: string
) => {
  const mailingServiceClientId = configService.get('mailingServiceClientId');
  const mailingServiceClientSecret = configService.get(
    'mailingServiceClientSecret'
  );
  const mailingServiceRefreshToken = configService.get(
    'mailingServiceRefreshToken'
  );
  const oAuthPlaygroundUrl = configService.get('oAuthPlaygroundUrl');
  const senderEmailAddress = configService.get('senderEmailAddress');

  const oauth2Client = new OAuth2(
    mailingServiceClientId,
    mailingServiceClientSecret,
    mailingServiceRefreshToken,
    oAuthPlaygroundUrl
  );

  oauth2Client.setCredentials({
    refresh_token: mailingServiceRefreshToken
  });

  const accessToken: string = oauth2Client.getAccessToken();
  const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: senderEmailAddress,
      clientId: mailingServiceClientId,
      clientSecret: mailingServiceClientSecret,
      refreshToken: mailingServiceRefreshToken,
      accessToken
    }
  });

  const mailOptions = {
    from: `Lang School <${senderEmailAddress}>`,
    to,
    subject: txt,
    html: `
      <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
      <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Lang School.</h2>
      <p>Congratulations! You're almost set to start using Lang Schoole.
          Just click the button below to validate your email address.
      </p>
      
      <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${txt}</a>

      <p>If the button doesn't work for any reason, you can also click on the link below:</p>

      <div>${url}</div>
      </div>
    `
  };

  smtpTransport.sendMail(mailOptions, (err, info) => {
    if (err) {
      throw new HttpException(
        'Error sending email',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
    return info;
  });
};
