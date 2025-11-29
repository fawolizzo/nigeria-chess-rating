import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { UserStatus } from '../hooks/useAuth';

export interface ApproveOrganizerRequest {
  userId: string;
  status: 'active' | 'rejected';
  approvedBy: string;
}

export interface ApproveOrganizerResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    status: UserStatus;
  };
}

/**
 * Approve or reject a Tournament Organizer account
 * This function should only be called by Rating Officers
 */
export async function approveOrganizer({
  userId,
  status,
  approvedBy,
}: ApproveOrganizerRequest): Promise<ApproveOrganizerResponse> {
  try {
    // Verify the approver is a Rating Officer
    const { data: approver, error: approverError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', approvedBy)
      .single();

    if (approverError || !approver || approver.role !== 'RO') {
      return {
        success: false,
        error: 'Only Rating Officers can approve organizer accounts',
      };
    }

    // Get the user to be approved
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if user is a Tournament Organizer
    if (user.role !== 'TO') {
      return {
        success: false,
        error: 'Only Tournament Organizer accounts can be approved',
      };
    }

    // Update user status
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Failed to update user status: ${updateError.message}`,
      };
    }

    // Create audit log entry
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: approvedBy,
      action_type:
        status === 'active' ? 'approve_organizer' : 'reject_organizer',
      entity_type: 'users',
      entity_id: userId,
      meta_json: {
        previous_status: user.status,
        new_status: status,
        user_email: user.email,
        user_role: user.role,
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status as UserStatus,
      },
    };
  } catch (error) {
    console.error('Error in approveOrganizer:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get all pending Tournament Organizer accounts
 * This function should only be called by Rating Officers
 */
export async function getPendingOrganizers(requesterId: string) {
  try {
    // Verify the requester is a Rating Officer
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requester || requester.role !== 'RO') {
      return {
        success: false,
        error: 'Only Rating Officers can view pending organizers',
        data: [],
      };
    }

    // Get all pending Tournament Organizers
    const { data: pendingOrganizers, error } = await supabaseAdmin
      .from('users')
      .select('id, email, state, status, created_at')
      .eq('role', 'TO')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return {
        success: false,
        error: `Failed to fetch pending organizers: ${error.message}`,
        data: [],
      };
    }

    return {
      success: true,
      data: pendingOrganizers || [],
    };
  } catch (error) {
    console.error('Error in getPendingOrganizers:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      data: [],
    };
  }
}
