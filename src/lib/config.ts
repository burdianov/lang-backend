export const config = () => {
  return {
    clientUrl: process.env.CLIENT_URL,
    oAuthPlaygroundUrl: process.env.OAUTH_PLAYGROUND_URL,
    activationTokenSecret: process.env.ACTIVATION_TOKEN_SECRET,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    mailingServiceClientId: process.env.MAILING_SERVICE_CLIENT_ID,
    mailingServiceClientSecret: process.env.MAILING_SERVICE_CLIENT_SECRET,
    mailingServiceRefreshToken: process.env.MAILING_SERVICE_REFRESH_TOKEN,
    senderEmailAddress: process.env.SENDER_EMAIL_ADDRESS
  };
};
