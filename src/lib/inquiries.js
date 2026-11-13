import { supabase } from './supabase.js';

export const INQUIRY_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'answered', label: 'Answered' },
  { id: 'closed', label: 'Closed' },
];

export function inquiryStatusLabel(status) {
  return INQUIRY_STATUSES.find((item) => item.id === status)?.label || status || 'Pending';
}

export function formatInquiryTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function throwIfError(error) {
  if (error) throw new Error(mapInquiryError(error.message));
}

function isMissingRpc(error) {
  return /could not find the function|schema cache/i.test(error?.message || '');
}

function mapInquiryError(message) {
  if (/foreign key constraint|parent_inquiries_user_id_fkey/i.test(message || '')) {
    return 'This question could not be saved because your parent account is missing a profile. Sign out, sign back in, and try again.';
  }
  if (/row-level security|violates row-level|permission denied/i.test(message || '')) {
    return 'This question could not be saved. Sign out, sign back in as the approved parent or admin, and try again.';
  }
  return message || 'This question could not be saved.';
}

function canSubmitParentQuestion(profile, authUser) {
  const role = String(profile?.role || authUser?.user_metadata?.role || '').toLowerCase();
  const status = profile?.approval_status;
  return role === 'parent' && status !== 'rejected';
}

export async function submitParentInquiry({ name, email, question }, profile) {
  const client = requireClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  throwIfError(authError);
  const authUser = authData.user;
  if (!authUser?.id) throw new Error('Please sign in to send a question.');
  if (!canSubmitParentQuestion(profile, authUser)) {
    throw new Error('Only parent accounts can send a question.');
  }
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();
  const trimmedQuestion = String(question || '').trim();
  if (!trimmedName || !trimmedEmail || !trimmedQuestion) {
    throw new Error('Please complete your name, email, and question.');
  }

  try {
    await client.rpc('ensure_own_profile');
  } catch {
    // Profile helper may not exist until SQL is applied.
  }

  const { data: rpcId, error: rpcError } = await client.rpc('submit_parent_inquiry', {
    p_name: trimmedName,
    p_email: trimmedEmail,
    p_question: trimmedQuestion,
  });
  if (!rpcError && rpcId) return rpcId;

  const { data, error } = await client
    .from('parent_inquiries')
    .insert({
      user_id: authUser.id,
      name: trimmedName,
      email: trimmedEmail,
      question: trimmedQuestion,
      status: 'pending',
    })
    .select('id')
    .single();
  if (!error && data?.id) return data.id;
  throw new Error(mapInquiryError(rpcError?.message || error?.message));
}

export async function listParentInquiries(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from('parent_inquiries')
    .select('id, user_id, name, email, question, status, admin_response, responded_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return data || [];
}

export async function listAllInquiries() {
  const client = requireClient();
  const { data, error } = await client.rpc('list_parent_inquiries_for_admin');
  if (!error) return data || [];
  if (!isMissingRpc(error)) throw new Error(mapInquiryError(error.message));

  const { data: rows, error: queryError } = await client
    .from('parent_inquiries')
    .select('id, user_id, name, email, question, status, admin_response, responded_at, created_at, updated_at')
    .order('created_at', { ascending: false });
  throwIfError(queryError);
  return rows || [];
}

export async function updateInquiry(id, changes) {
  const client = requireClient();
  if (changes.status && Object.keys(changes).length === 1) {
    const { data, error } = await client.rpc('update_parent_inquiry_status', {
      p_id: id,
      p_status: changes.status,
    });
    if (!error && data) return Array.isArray(data) ? data[0] : data;
    if (error && !isMissingRpc(error)) throw new Error(mapInquiryError(error.message));
  }
  const { data, error } = await client
    .from('parent_inquiries')
    .update(changes)
    .eq('id', id)
    .select('id, user_id, name, email, question, status, admin_response, responded_at, created_at, updated_at')
    .single();
  throwIfError(error);
  return data;
}

export async function respondToInquiry(id, response) {
  const trimmed = String(response || '').trim();
  if (!trimmed) throw new Error('Write a response first.');
  const client = requireClient();
  const { data, error } = await client.rpc('respond_to_parent_inquiry', {
    p_id: id,
    p_response: trimmed,
  });
  if (!error && data) return Array.isArray(data) ? data[0] : data;
  if (error && !isMissingRpc(error)) throw new Error(mapInquiryError(error.message));
  return updateInquiry(id, {
    admin_response: trimmed,
    responded_at: new Date().toISOString(),
    status: 'answered',
  });
}
