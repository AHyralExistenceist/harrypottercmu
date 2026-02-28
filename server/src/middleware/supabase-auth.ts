import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';

export interface SupabaseAuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticateSupabase = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (error || !userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userRole = userData.role;
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

