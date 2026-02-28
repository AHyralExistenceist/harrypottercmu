import express from 'express';
import { supabaseAdmin } from '../utils/supabase.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email || `${username}@temp.com`,
      password,
      email_confirm: true,
      user_metadata: {
        username
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        role: 'guest'
      })
      .select()
      .single();

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email || `${username}@temp.com`
    });

    const { data: { session }, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: email || `${username}@temp.com`,
      password
    });

    if (signInError || !session) {
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.status(201).json({
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        createdAt: userData.created_at
      },
      token: session.access_token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.email || `${username}@temp.com`,
      password
    });

    if (authError || !authData.session) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { data: characterData } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    res.json({
      user: {
        ...userData,
        character: characterData || null
      },
      token: authData.session.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, characters(*)')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: userData.id,
      username: userData.username,
      role: userData.role,
      createdAt: userData.created_at,
      character: userData.characters?.[0] || null
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

