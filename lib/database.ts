import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set');
}

// Supabase client instance
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// User interface for TypeScript
export interface User {
  id: number;
  google_id: string;
  email: string;
  name?: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
  last_login: Date;
  login_count: number;
}

// Database functions for user management
export class UserDatabase {
  // Create or update user on login
  static async upsertUser(userData: {
    google_id: string;
    email: string;
    name?: string;
    image?: string;
  }): Promise<User> {
    // NOTE: Supabase upsert does not support increment directly, will rely on RLS/Triggers for proper increment
    // We will fetch the existing user to get the current login_count
    const existingUser = await this.getUserByGoogleId(userData.google_id);
    const newLoginCount = existingUser ? existingUser.login_count + 1 : 1;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        google_id: userData.google_id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        login_count: newLoginCount,
      }, { onConflict: 'google_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      throw new Error(error.message);
    }

    return data as User;
  }

  // Get all users for admin dashboard
  static async getAllUsers(limit: number = 100, offset: number = 0): Promise<{
    users: User[];
    total: number;
  }> {
    const { data: users, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting all users:', error);
      throw new Error(error.message);
    }

    return {
      users: users as User[],
      total: count || 0,
    };
  }

  // Get user by Google ID
  static async getUserByGoogleId(googleId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error getting user by Google ID:', error);
      throw new Error(error.message);
    }

    return data ? (data as User) : null;
  }

  // Get user by Email
  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error getting user by Email:', error);
      throw new Error(error.message);
    }

    return data ? (data as User) : null;
  }

  // Get user statistics for admin dashboard
  static async getUserStats(): Promise<{
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }> {
    // NOTE: Supabase client does not easily support complex SQL functions like COUNT(CASE...)
    // We will use the RPC feature for this, assuming the user has a function named 'get_user_stats'
    // If this fails, we will fall back to simple count and warn the user.
    try {
      const { data, error } = await supabase.rpc('get_user_stats');

      if (error) {
        console.warn('Could not use RPC get_user_stats. Falling back to simple count.', error);
        // Fallback: simple total count
        const { count: totalUsers, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        return {
          totalUsers: totalUsers || 0,
          newUsersToday: 0, // Cannot calculate without complex query/RPC
          newUsersThisWeek: 0,
          newUsersThisMonth: 0,
        };
      }

      // Assuming RPC returns an object like { total_users, new_today, new_week, new_month }
      const row = data[0];

      return {
        totalUsers: parseInt(row.total_users),
        newUsersToday: parseInt(row.new_today),
        newUsersThisWeek: parseInt(row.new_week),
        newUsersThisMonth: parseInt(row.new_month)
      };
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      throw new Error(error.message);
    }
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      console.log('Testing database connection...');
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('SUPABASE_URL or SUPABASE_ANON_KEY environment variable is not set');
        return false;
      }

      // Simple select to test connection
      const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' });

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('Database connection test successful');
      return true;
    } catch (error: any) {
      console.error('Database connection test failed (exception):', error);
      return false;
    }
  }
}

// Export the supabase client for direct queries if needed
export { supabase };

// Export database classes
export { ProjectDatabase } from './db/projects';
export { GenerationDatabase } from './db/generations';
