import { Request, Response, NextFunction } from 'express';

// Decode the simulated JWT (same format as server.ts generateJWT)
export function decodeJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const jsonStr = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Extract user from cookie or Authorization header
export function extractUserFromRequest(req: Request): any | null {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === 'auth_token') {
        token = decodeURIComponent(val);
        break;
      }
    }
  }
  if (!token) return null;
  return decodeJWT(token);
}

// Middleware: require authenticated user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = extractUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  (req as any).user = user;
  next();
}

// Middleware factory: require specific roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = extractUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userRole = (user.role || '').toLowerCase();
    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      return res.status(403).json({
        error: `Access Denied: This action requires one of [${roles.join(', ')}] roles. Your role is '${userRole}'.`,
      });
    }
    (req as any).user = user;
    next();
  };
}

// Officer roles that can make decisions
const OFFICER_ROLES = ['minister', 'admin', 'district', 'nodal_officer', 'mp', 'analyst', 'state_nodal'];

export function requireOfficer(req: Request, res: Response, next: NextFunction) {
  return requireRole(...OFFICER_ROLES)(req, res, next);
}

export function requireMinister(req: Request, res: Response, next: NextFunction) {
  return requireRole('minister', 'admin')(req, res, next);
}
