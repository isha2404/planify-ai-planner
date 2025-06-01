import { jwtVerify, SignJWT } from 'jose'

export interface JWTPayload {
  id: string
  email: string
  name: string
  iat?: number
  exp?: number
}

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long'
const key = new TextEncoder().encode(SECRET_KEY)

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key)
    // Verify that the payload has the required fields
    if (
      typeof payload.id === 'string' && 
      typeof payload.email === 'string' && 
      typeof payload.name === 'string'
    ) {
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        iat: payload.iat,
        exp: payload.exp
      }
    }
    return null
  } catch (error) {
    return null
  }
}

export function getTokenFromHeader(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null
  }
  return authorization.split(' ')[1]
}
