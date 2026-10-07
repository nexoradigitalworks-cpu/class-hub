import { interrogationsAdapter } from './adapters';

export async function toggleVolunteerReservation(
  _classId: string,
  interrogationId: string,
  user: { uid: string; name: string; avatarId: string }
): Promise<{ success: boolean; message: string }> {
  return interrogationsAdapter.toggleVolunteer(interrogationId, user);
}
