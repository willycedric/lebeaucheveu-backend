'use strict';

exports.hostname = process.env.hostname || 'https://lebeaucheveu-api.herokuapp.com';
exports.port = process.env.PORT || 3000;
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://heroku_qlb97506:revb8a0g8nj70fvsiki639lah0@ds049496.mlab.com:49496/heroku_qlb97506'
};
exports.companyName = 'LeBeauCheveu';
exports.projectName = 'lebeaucheveu';
exports.systemEmail = 'lebeaucheveu.dev@gmail.com';
exports.cryptoKey = 'k3yb0ardc4t';
exports.loginAttempts = {
  forIp: 50,
  forIpAndUser: 7,
  logExpiration: '20m'
};
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
    address: process.env.SMTP_FROM_ADDRESS || 'lebeaucheveu.dev@gmail.com'
  },
  credentials: {
    user: process.env.SMTP_USERNAME || '{{SMTP_EMAIL}}',
    password: process.env.SMTP_PASSWORD || '{{SMTP_PASSWORD}}',
    host: process.env.SMTP_HOST || '{{SMTP_HOST}}',
    ssl: true
  }
};
exports.webToken = {
  // 10 days in minutes
  expireTime: 24 * 60 * 10,
  secrets: {
    jwt: process.env.JWT || 'M54H8YFGUI0QS4BSHBDJTC3RJ6LS4ZC30V7P1KKFC3EZBRK1T5DGQB20MQT8RVFZIQG5XL6YVWQBASNP2OZ8ICT4D3ZB25NYMRY9'
  }
};
exports.oauth = {
  twitter: {
    // Not yet implemented
    key: process.env.TWITTER_OAUTH_KEY || '',
    secret: process.env.TWITTER_OAUTH_SECRET || ''
  },
  facebook: {
    key: process.env.FACEBOOK_OAUTH_KEY || '',
    secret: process.env.FACEBOOK_OAUTH_SECRET || ''
  },
  github: {
    // Not yet implemented
    key: process.env.GITHUB_OAUTH_KEY || '',
    secret: process.env.GITHUB_OAUTH_SECRET || ''
  },
  google: {
    key: process.env.GOOGLE_OAUTH_KEY || '',
    secret: process.env.GOOGLE_OAUTH_SECRET || ''
  },
  tumblr: {
    // Not yet implemented
    key: process.env.TUMBLR_OAUTH_KEY || '',
    secret: process.env.TUMBLR_OAUTH_SECRET || ''
  }
};