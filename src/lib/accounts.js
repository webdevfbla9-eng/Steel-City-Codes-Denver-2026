import { supabase } from './supabase.js';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function throwIfError(error) {
  if (error) throw new Error(error.message);
}

function isMissingRpc(error) {
  return /could not find the function|schema cache/i.test(error?.message || '');
}

const PROFILE_COLUMNS = 'id, email, full_name, role, approval_status, created_at';

export async function seedKnownProfiles() {
  const client = requireClient();
  const { data, error } = await client.rpc('seed_known_profiles');
  if (!error) return data || [];
  if (isMissingRpc(error)) return [];
  throw new Error(error.message);
}

export async function listProfilesForAdmin() {
  const client = requireClient();
  const { data, error } = await client.rpc('list_profiles_for_admin');
  if (!error) return data || [];
  if (!isMissingRpc(error)) throw new Error(error.message);

  const { data: rows, error: queryError } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false });
  throwIfError(queryError);
  return rows || [];
}

export async function setProfileApproval(id, status) {
  const client = requireClient();
  const { data, error } = await client.rpc('set_profile_approval', { p_id: id, p_status: status });
  if (!error && data) return Array.isArray(data) ? data[0] : data;
  if (error && !isMissingRpc(error)) throw new Error(error.message);

  const { data: row, error: updateError } = await client
    .from('profiles')
    .update({ approval_status: status })
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single();
  throwIfError(updateError);
  return row;
}

export async function setProfileRole(id, role) {
  const client = requireClient();
  const { data, error } = await client.rpc('set_profile_role', { p_id: id, p_role: role });
  if (!error && data) return Array.isArray(data) ? data[0] : data;
  if (error && !isMissingRpc(error)) throw new Error(error.message);

  const { data: row, error: updateError } = await client
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single();
  throwIfError(updateError);
  return row;
}
