import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Initialize the admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request to get the email
    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Attempting to delete user with email: ${email}`);

    // First, try to get the user by email
    const { data: users, error: getUserError } =
      await supabase.auth.admin.listUsers({
        filter: { email: email },
        page: 1,
        perPage: 1,
      });

    if (getUserError) {
      console.error('Error finding user:', getUserError);
      throw new Error(`Failed to find user: ${getUserError.message}`);
    }

    if (!users || users.users.length === 0) {
      console.log('No user found with that email');
      return new Response(
        JSON.stringify({ success: true, message: 'No user found to delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = users.users[0].id;
    console.log(`Found user with ID: ${userId}`);

    // Delete the user using the admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log(`Successfully deleted user with email: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User with email ${email} has been deleted`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-auth-user function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
