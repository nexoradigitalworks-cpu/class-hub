import { db, isFirebaseConfigured } from './firebase';
import { runTransaction, doc } from 'firebase/firestore';
import { localStore } from './dataStore';
import { Interrogation, VolunteerSlot } from '../types';

export async function toggleVolunteerReservation(
  classId: string,
  interrogationId: string,
  user: { uid: string; name: string; avatarId: string }
): Promise<{ success: boolean; message: string }> {
  // If Firebase is active and connected, use Firestore atomic transaction
  if (isFirebaseConfigured && db) {
    const ref = doc(db, 'classes', classId, 'interrogations', interrogationId);

    return runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        throw new Error('Interrogazione non trovata.');
      }

      const data = snap.data() as Interrogation;
      const isAlreadyBooked = data.volunteerIds?.includes(user.uid);

      if (isAlreadyBooked) {
        // Ritiro prenotazione
        const updatedVolunteers = (data.volunteers || []).filter(v => v.userId !== user.uid);
        const updatedIds = (data.volunteerIds || []).filter(id => id !== user.uid);
        const newStatus = updatedVolunteers.length >= data.maxVolunteers ? 'FULL' : 'OPEN';

        transaction.update(ref, {
          volunteers: updatedVolunteers,
          volunteerIds: updatedIds,
          status: newStatus
        });

        return { success: true, message: 'Prenotazione ritirata con successo.' };
      } else {
        // Nuova prenotazione
        if (data.status === 'CLOSED') {
          throw new Error('Le iscrizioni per questa interrogazione sono chiuse dal docente/controller.');
        }
        if ((data.volunteers || []).length >= data.maxVolunteers) {
          throw new Error('Tutti i posti disponibili per i volontari sono esauriti.');
        }

        const newSlot: VolunteerSlot = {
          userId: user.uid,
          userName: user.name,
          userAvatar: user.avatarId,
          timestamp: new Date().toISOString()
        };

        const updatedVolunteers = [...(data.volunteers || []), newSlot];
        const updatedIds = [...(data.volunteerIds || []), user.uid];
        const newStatus = updatedVolunteers.length >= data.maxVolunteers ? 'FULL' : 'OPEN';

        transaction.update(ref, {
          volunteers: updatedVolunteers,
          volunteerIds: updatedIds,
          status: newStatus
        });

        return { success: true, message: 'Prenotazione registrata! Sei nella lista volontari.' };
      }
    });
  }

  // Fallback to reactive local atomic transaction engine
  return localStore.toggleVolunteer(interrogationId, user);
}
