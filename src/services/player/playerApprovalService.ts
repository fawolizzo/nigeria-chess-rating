import { updatePlayerInSupabase } from './playerCoreService';

export const approvePlayerInSupabase = async (id: string): Promise<boolean> => {
  try {
    const result = await updatePlayerInSupabase(id, { status: 'approved' });
    return result !== null;
  } catch (error) {
    console.error('Error approving player:', error);
    return false;
  }
};

export const rejectPlayerInSupabase = async (id: string): Promise<boolean> => {
  try {
    const result = await updatePlayerInSupabase(id, { status: 'rejected' });
    return result !== null;
  } catch (error) {
    console.error('Error rejecting player:', error);
    return false;
  }
};
