module.exports.JWT_OPTIONS = {
  MEMBER_AUDIENCE: ['SHOW_FAVORITE', 'LOGIN', 'SHOW_BOOKS'],
  ADMIN_AUDIENCE: ['SHOW_FAVORITE', 'LOGIN', 'SHOW_BOOKS', 'ADD_BOOK', 'SHOW_USERS'],
};

module.exports.ADD_BOOK = 'ADD_BOOK';
module.exports.SHOW_USERS = 'SHOW_USERS';
module.exports.SECRET = ')x2f-l-opsnd)w!!z2m7ykvony99pt@6@6m+=q2uk3%w8*7$ow';
module.exports.ALGORITHM = 'HS256';
module.exports.ISSUER = 'BOOKIE_ORG';
module.exports.EXPIRY = '1h';
