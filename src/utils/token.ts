import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { AppError } from '@model/index';

const generateJWT = function (payload: object = {}, expiresIn: string = '6h'): string {
  const privateKey: string = config.jwtSettings.jwtSecret;
  const defaultOptions: object = {
    expiresIn,
  };

  return jwt.sign(payload, privateKey, defaultOptions);
};

const verifyAccessToken = (accessToken: string): Promise<jwt.JwtPayload> => {
  const secretKey = config.jwtSettings.jwtSecret;
  return new Promise((resolve, reject) => {
    jwt.verify(accessToken, secretKey, (err, payload) => {
      if (err) return reject(err);
      resolve(payload as jwt.JwtPayload);
    });
  });
};

// VALIDATE FORGOT PASSWORD ACCESS TOKEN
const validateForgotPasswordJWT = function (password: string, token: string): Object {
  try {
    const publicKey: any = config.jwtSettings.jwtSecret + password;
    return jwt.verify(token, publicKey);
  } catch (e) {
    throw new AppError({
      id: 'invalid_token',
      message: 'Password reset link was expired',
      statusCode: 400,
    });
  }
};

// USED TO GENERATE JWT WITH PAYLOAD AND OPTIONS AS PARAMETERS.
const extractToken = function (token: string): string | null {
  if (token?.startsWith('Bearer ')) {
    return token.slice(7, token.length);
  }
  return null;
};

// EXPORT
export { generateJWT, verifyAccessToken, validateForgotPasswordJWT, extractToken };
