import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT token operations
export const generateToken = (payload: string | object | Buffer, expiresIn: string = '24h'): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn } as any);
};

export const verifyToken = (token: string): any => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate unique IDs
export const generateId = (length: number = 21): string => {
  return nanoid(length);
};

export const generateSecureId = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Password generation for chat rooms
export const generateRoomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// File validation
export const getAllowedTypes = (): string[] => {
  return process.env.ALLOWED_FILE_TYPES?.split(',').map(t => t.trim().toLowerCase()) || [];
};

export const validateFileType = (fileName: string, mimeType: string, allowedTypes: string[]): boolean => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return allowedTypes.some(type => {
    type = type.trim().toLowerCase();
    if (type.includes('/')) {
      // MIME type match (supports wildcards like image/*)
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return mimeType.startsWith(baseType + '/');
      }
      return mimeType === type;
    }
    // Extension match
    return fileExtension === type;
  });
};

export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// IP address extraction
// export const getClientIP = (req: any): string => {
//   return req.headers['x-forwarded-for'] || 
//          req.connection.remoteAddress || 
//          req.socket.remoteAddress ||
//          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
//          '127.0.0.1';
// };

export const getClientIP = (req: any): string => {
  // Next.js API routes: req.headers.get for edge, req.headers for node
  if (typeof req.headers?.get === 'function') {
    // Edge API route (NextRequest)
    return req.headers.get('x-forwarded-for') || '127.0.0.1';
  }
  if (req.headers && typeof req.headers === 'object') {
    return req.headers['x-forwarded-for'] || '127.0.0.1';
  }
  return '127.0.0.1';
};

// Generate avatar URL
export const generateAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// Encryption/Decryption for sensitive data using secure AES-256-CBC
export const encrypt = (text: string): string => {
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key as unknown as Uint8Array, iv as unknown as Uint8Array);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  const [ivHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key as unknown as Uint8Array, iv as unknown as Uint8Array);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
