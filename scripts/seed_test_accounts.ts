import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log('--- CONFIGURING SINGLE DEVELOPER TEST ENVIRONMENT ---');

  const testPassword = 'ClassHub2026!Test';
  const developerEmail = 'developer.test@classhub.edu';
  const developerUid = 'developer-test-uid';

  // 1. Create Real Test Classroom in Firestore
  const classId = 'cls-dev-test';
  const classCode = 'DEVTEST';
  const className = 'ClassHub — Developer Test';

  const classDocRef = doc(db, 'classes', classId);
  await setDoc(classDocRef, {
    id: classId,
    name: className,
    code: classCode,
    schoolName: 'Liceo Scientifico Leonardo da Vinci',
    academicYear: '2026/2027',
    createdBy: developerUid,
    createdAt: new Date().toISOString(),
    allowSelfJoin: true,
    lockVolunteersOnDeadline: false,
    controllerCanCreateNotices: true,
    adminEmail: developerEmail
  }, { merge: true });

  console.log(`✓ Classroom configured in Firestore: ${className} (Code: ${classCode}, ID: ${classId})`);

  // 2. Set up Developer Account & Membership
  const memberDocRef = doc(db, 'classes', classId, 'members', developerUid);
  await setDoc(memberDocRef, {
    userId: developerUid,
    classId: classId,
    firstName: 'ClassHub Developer',
    lastName: 'Test Account',
    email: developerEmail,
    role: 'ADMIN',
    avatarId: 'avatar-indigo',
    joinedAt: new Date().toISOString()
  }, { merge: true });

  const userDocRef = doc(db, 'users', developerUid);
  await setDoc(userDocRef, {
    uid: developerUid,
    firstName: 'ClassHub Developer',
    lastName: 'Test Account',
    email: developerEmail,
    role: 'ADMIN',
    avatarId: 'avatar-indigo',
    classId: classId,
    activeClassId: classId,
    className: className,
    createdAt: new Date().toISOString()
  }, { merge: true });

  const userMembershipRef = doc(db, 'users', developerUid, 'memberships', classId);
  await setDoc(userMembershipRef, {
    classId: classId,
    className: className,
    classCode: classCode,
    role: 'ADMIN',
    joinedAt: new Date().toISOString()
  }, { merge: true });

  console.log(`✓ Developer User & Membership configured: ${developerEmail}`);

  // 3. Add Simulated Classmates in the test class for realistic testing
  const dummyStudents = [
    { uid: 'dev-student-1', name: 'Giulia Ferrari', email: 'g.ferrari@liceo.edu.it', role: 'STUDENT', avatarId: 'avatar-rose' },
    { uid: 'dev-student-2', name: 'Lorenzo Moretti', email: 'l.moretti@liceo.edu.it', role: 'CONTROLLER', avatarId: 'avatar-emerald' },
    { uid: 'dev-student-3', name: 'Elena Colombo', email: 'e.colombo@liceo.edu.it', role: 'STUDENT', avatarId: 'avatar-teal' }
  ];

  for (const ds of dummyStudents) {
    const [firstName, lastName] = ds.name.split(' ');
    await setDoc(doc(db, 'classes', classId, 'members', ds.uid), {
      userId: ds.uid,
      classId: classId,
      firstName,
      lastName,
      email: ds.email,
      role: ds.role,
      avatarId: ds.avatarId,
      joinedAt: new Date().toISOString()
    }, { merge: true });
  }

  // 4. Seed Events, Interrogations, Notices in Test Class
  const todayStr = new Date().toISOString().split('T')[0];

  // Evento di classe (Verifica Matematica)
  const event1Ref = doc(db, 'classes', classId, 'events', 'ev-dev-1');
  await setDoc(event1Ref, {
    id: 'ev-dev-1',
    title: 'Verifica di Matematica: Limiti e Continuità',
    subject: 'Matematica',
    type: 'VERIFICA',
    date: todayStr,
    startTime: '09:00',
    endTime: '11:00',
    description: 'Verifica scritta su limiti notevoli, asintoti e teoremi di Weierstrass.',
    isPersonal: false,
    authorId: developerUid,
    authorName: 'ClassHub Developer (Admin)',
    classId: classId,
    createdAt: new Date().toISOString()
  }, { merge: true });

  // Evento personale privato dello studente
  const eventPersonalRef = doc(db, 'classes', classId, 'events', 'ev-dev-personal');
  await setDoc(eventPersonalRef, {
    id: 'ev-dev-personal',
    title: 'Ripasso privato per verifica (Personale)',
    subject: 'Personale',
    type: 'PERSONALE',
    date: todayStr,
    startTime: '16:00',
    endTime: '17:30',
    description: 'Esercizi su limiti notevoli a casa.',
    isPersonal: true,
    authorId: developerUid,
    authorName: 'ClassHub Developer',
    classId: classId,
    createdAt: new Date().toISOString()
  }, { merge: true });

  // Interrogazione con volontari
  const interRef = doc(db, 'classes', classId, 'interrogations', 'int-dev-1');
  await setDoc(interRef, {
    id: 'int-dev-1',
    title: 'Interrogazione Filosofia: Schopenhauer e Kant',
    subject: 'Filosofia',
    date: todayStr,
    startTime: '11:15',
    endTime: '13:00',
    maxVolunteers: 3,
    status: 'OPEN',
    notes: 'Velo di Maya, noumeno e volontà di vivere.',
    classId: classId,
    volunteers: [
      {
        userId: 'dev-student-1',
        userName: 'Giulia F.',
        userAvatar: 'avatar-rose',
        timestamp: new Date().toISOString()
      }
    ],
    volunteerIds: ['dev-student-1']
  }, { merge: true });

  // Avviso urgente
  const noticeRef = doc(db, 'classes', classId, 'notices', 'not-dev-1');
  await setDoc(noticeRef, {
    id: 'not-dev-1',
    title: 'Circolare n. 142: Modulo autorizzazione viaggio d\'istruzione',
    content: 'Tutti gli studenti devono consegnare entro venerdì il modulo firmato per la gita.',
    date: todayStr,
    priority: 'HIGH',
    authorName: 'ClassHub Developer (Admin)',
    classId: classId,
    createdAt: new Date().toISOString()
  }, { merge: true });

  console.log('✓ Seed events, interrogations, and notices written to Firestore successfully!');
  console.log('--- DEVELOPER TEST ENVIRONMENT READY ---');
}

seed().catch(err => {
  console.error('Seed notice:', err.message);
});
