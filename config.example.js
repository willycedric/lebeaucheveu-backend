'use strict';

exports.hostname = process.env.hostname || 'https://lebeaucheveu-api.herokuapp.com';
exports.port = process.env.PORT || 3000;
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || '{{MONGO_URI}}'
};
exports.companyName = 'LeBeauCheveu';
exports.projectName = 'lebeaucheveu';
exports.systemEmail = '{{ADMIN_EMAIL}}';
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
    address: process.env.SMTP_FROM_ADDRESS || '{{ADMIN_EMAIL}}'
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
exports.front={
  url:"https://lebeaucheveu.herokuapp.com"
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
