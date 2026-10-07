import { localStore } from './dataStore';

export async function toggleVolunteerReservation(
  _classId: string,
  interrogationId: string,
  user: { uid: string; name: string; avatarId: string }
): Promise<{ success: boolean; message: string }> {
  return localStore.toggleVolunteer(interrogationId, user);
}
