import jwt from 'jsonwebtoken';

const TOKEN_EXPIRY = '7d';

export const createToken = ({ userId, role }) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
