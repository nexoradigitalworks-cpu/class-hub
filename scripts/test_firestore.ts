import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testFirestore() {
  console.log('--- TESTING FIRESTORE CONNECTION & SEEDING TEST CLASS ---');
  
  const classId = 'cls-test-2026';
  const classCode = 'HUB942';
  const className = 'ClassHub — Classe Test';

  // Test creating class in Firestore
  const classDocRef = doc(db, 'classes', classId);
  await setDoc(classDocRef, {
    id: classId,
    name: className,
    code: classCode,
    schoolName: 'Liceo Scientifico Leonardo da Vinci',
    academicYear: '2026/2027',
    createdBy: 'admin-test-uid',
    createdAt: new Date().toISOString(),
    allowSelfJoin: true,
    lockVolunteersOnDeadline: false,
    controllerCanCreateNotices: true,
    adminEmail: 'admin.test@classhub.edu'
  });

  console.log(`✓ Test class saved in Firestore: ${className}`);

  // Test reading back
  const snap = await getDoc(classDocRef);
  console.log('✓ Class read from Firestore:', snap.exists() ? snap.data() : 'NOT FOUND');
}

testFirestore().catch(console.error);
