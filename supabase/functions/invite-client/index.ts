import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface InviteClientRequest {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  phone?: string;
  instagram?: string;
  website?: string;
  offer: 'one_shot' | '45_jours' | 'vip';
  status: 'prospect' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  internal_notes?: string;
  tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the requesting user is an admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: InviteClientRequest = await req.json();
    console.log('Creating client account:', body.email);

    // Validate required fields
    if (!body.email || !body.password || !body.full_name || !body.offer || !body.status) {
      return new Response(
        JSON.stringify({ error: 'Champs requis manquants: email, password, full_name, offer, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === body.email);
    
    if (existingUser) {
      // Check if already has a client record
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('user_id', existingUser.id)
        .maybeSingle();
      
      if (existingClient) {
        return new Response(
          JSON.stringify({ error: 'Un client existe déjà avec cet email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let userId: string;

    if (existingUser) {
      // Use existing user
      userId = existingUser.id;
      console.log('Using existing user:', userId);
      
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: body.password
      });
      if (updateError) {
        console.error('Error updating password:', updateError);
      }
    } else {
      // Create new user in auth.users
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name
        }
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return new Response(
          JSON.stringify({ error: `Erreur lors de la création du compte: ${createUserError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log('Created new user:', userId);
    }

    // The trigger should have created the profile, but update it with the full name
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: body.full_name
      });

    if (profileError) {
      console.error('Error upserting profile:', profileError);
    }

    // Ensure user_roles has client role (trigger should have done this)
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'client' });
    }

    // Create the client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        user_id: userId,
        offer: body.offer,
        status: body.status,
        company: body.company || null,
        phone: body.phone || null,
        instagram: body.instagram || null,
        website: body.website || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        internal_notes: body.internal_notes || null,
        tags: body.tags || null
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return new Response(
        JSON.stringify({ error: `Erreur lors de la création du client: ${clientError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Client created successfully:', client.id);

    return new Response(
      JSON.stringify({
        success: true,
        client_id: client.id,
        user_id: userId,
        email: body.email,
        message: 'Compte client créé avec succès'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inattendue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
