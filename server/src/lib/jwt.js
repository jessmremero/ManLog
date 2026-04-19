import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signToken(userId) {
  const uid = Number(userId);
  return jwt.sign({ userId: uid }, config.jwt.secret, {
    expiresIn: config.jwt.expiresInSec
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
