import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, UserRole, Classroom, ClassMember, UserMembership } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  currentClass: Classroom | null;
  allMembers: ClassMember[];
  userMemberships: UserMembership[];
  loading: boolean;
  isStudent: boolean;
  isController: boolean;
  isAdmin: boolean;
  activeClassId: string;
  isDeveloperModeActive: boolean;
  developerSimulationRole: UserRole;
  setDeveloperSimulationRole: (role: UserRole) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, firstName: string, lastName: string, avatarId: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  joinClass: (code: string) => Promise<{ success: boolean; className: string }>;
  createClass: (name: string, schoolName?: string, academicYear?: string) => Promise<{ classId: string; code: string; name: string }>;
  switchActiveClass: (classId: string) => Promise<void>;
  updateUserRole: (targetUid: string, newRole: UserRole) => Promise<void>;
  updateProfileAvatar: (avatarId: string) => Promise<void>;
  leaveClass: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const DEV_TEST_MEMBERS: ClassMember[] = [
  {
    userId: 'developer-test-uid',
    classId: 'cls-dev-test',
    firstName: 'ClassHub',
    lastName: 'Developer',
    email: 'developer.test@classhub.edu',
    role: 'ADMIN',
    avatarId: 'avatar-indigo',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'sofia-controller-uid',
    classId: 'cls-dev-test',
    firstName: 'Sofia',
    lastName: 'Bianchi',
    email: 'sofia.bianchi@liceo.edu.it',
    role: 'CONTROLLER',
    avatarId: 'avatar-emerald',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'matteo-controller-uid',
    classId: 'cls-dev-test',
    firstName: 'Matteo',
    lastName: 'Ferrari',
    email: 'matteo.ferrari@liceo.edu.it',
    role: 'CONTROLLER',
    avatarId: 'avatar-amber',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'marco-student-uid',
    classId: 'cls-dev-test',
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'marco.rossi@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-blue',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'giulia-student-uid',
    classId: 'cls-dev-test',
    firstName: 'Giulia',
    lastName: 'Romano',
    email: 'giulia.romano@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-purple',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'alessandro-student-uid',
    classId: 'cls-dev-test',
    firstName: 'Alessandro',
    lastName: 'Russo',
    email: 'alessandro.russo@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-teal',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'chiara-student-uid',
    classId: 'cls-dev-test',
    firstName: 'Chiara',
    lastName: 'Colombo',
    email: 'chiara.colombo@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-rose',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'lorenzo-student-uid',
    classId: 'cls-dev-test',
    firstName: 'Lorenzo',
    lastName: 'Ricci',
    email: 'lorenzo.ricci@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-cyan',
    joinedAt: new Date().toISOString()
  },
  {
    userId: 'elena-student-uid',
    classId: 'cls-dev-test',
    firstName: 'Elena',
    lastName: 'Marino',
    email: 'elena.marino@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-violet',
    joinedAt: new Date().toISOString()
  }
];

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentClass, setCurrentClass] = useState<Classroom | null>(null);
  const [allMembers, setAllMembers] = useState<ClassMember[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);

  // Developer Testing Switch (Only active for developer.test@classhub.edu on ClassHub — Developer Test)
  const [developerSimulationRole, setDeveloperSimulationRole] = useState<UserRole>('ADMIN');

  // Sync profile, memberships & active class state from Firestore
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setProfile(null);
        setCurrentClass(null);
        setAllMembers([]);
        setUserMemberships([]);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Listen to User Multi-Class Memberships
        const membershipsColRef = collection(db, 'users', user.uid, 'memberships');
        const unsubscribeMemberships = onSnapshot(membershipsColRef, (snap) => {
          const list: UserMembership[] = [];
          snap.forEach(d => list.push(d.data() as UserMembership));
          setUserMemberships(list);
        }, (err) => {
          console.warn('Memberships listen warning:', err);
        });

        // Listen to User Profile
        const unsubscribeUser = onSnapshot(userDocRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setProfile(data);

            const effectiveClassId = data.activeClassId || data.classId;

            if (effectiveClassId) {
              // Listen to Active Class document
              const classDocRef = doc(db, 'classes', effectiveClassId);
              const unsubscribeClass = onSnapshot(classDocRef, (classSnap) => {
                if (classSnap.exists()) {
                  setCurrentClass(classSnap.data() as Classroom);
                } else {
                  setCurrentClass(null);
                }
              }, (err) => {
                console.warn('Class listen warning:', err);
              });

              // Listen to Class Members
              const membersColRef = collection(db, 'classes', effectiveClassId, 'members');
              const unsubscribeMembers = onSnapshot(membersColRef, (membersSnap) => {
                const membersList: ClassMember[] = [];
                membersSnap.forEach(d => membersList.push(d.data() as ClassMember));
                if (membersList.length === 0 && effectiveClassId === 'cls-dev-test') {
                  setAllMembers(DEV_TEST_MEMBERS);
                } else {
                  setAllMembers(membersList);
                }
              }, (err) => {
                console.warn('Members listen warning:', err);
                if (effectiveClassId === 'cls-dev-test') {
                  setAllMembers(DEV_TEST_MEMBERS);
                }
              });

              setLoading(false);
              return () => {
                unsubscribeClass();
                unsubscribeMembers();
              };
            } else {
              setCurrentClass(null);
              setAllMembers([]);
              setLoading(false);
            }
          } else {
            // Profile document does not exist yet
            const nameParts = (user.displayName || '').split(' ');
            const firstName = nameParts[0] || 'Studente';
            const lastName = nameParts.slice(1).join(' ') || '';
            const newProfile: UserProfile = {
              uid: user.uid,
              firstName,
              lastName,
              email: user.email || '',
              role: 'STUDENT',
              avatarId: 'avatar-blue',
              classId: null,
              activeClassId: null,
              className: null,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            } catch (err) {
              console.error('Error creating default profile:', err);
            }
            setLoading(false);
          }
        }, (err) => {
          console.error('User snapshot error:', err);
          setLoading(false);
        });

        return () => {
          unsubscribeUser();
          unsubscribeMemberships();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth non inizializzato.');
    const cleanEmail = email.trim().toLowerCase();

    // Block any old test accounts explicitly
    if (
      cleanEmail === 'student.test@classhub.edu' || 
      cleanEmail === 'controller.test@classhub.edu' || 
      cleanEmail === 'admin.test@classhub.edu'
    ) {
      throw new Error('Questi account di test sono stati dismessi. Usa l\'account dedicato developer.test@classhub.edu.');
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        // Dedicated single developer test account
        if (cleanEmail === 'developer.test@classhub.edu' && pass === 'ClassHub2026!Test') {
          const testProfile: UserProfile = {
            uid: 'developer-test-uid',
            firstName: 'ClassHub Developer',
            lastName: 'Test Account',
            email: 'developer.test@classhub.edu',
            role: 'ADMIN',
            avatarId: 'avatar-indigo',
            classId: 'cls-dev-test',
            activeClassId: 'cls-dev-test',
            className: 'ClassHub — Developer Test',
            createdAt: new Date().toISOString()
          };
          const testClass: Classroom = {
            id: 'cls-dev-test',
            name: 'ClassHub — Developer Test',
            code: 'DEVTEST',
            schoolName: 'Liceo Scientifico Leonardo da Vinci',
            academicYear: '2026/2027',
            createdBy: 'developer-test-uid',
            createdAt: new Date().toISOString(),
            allowSelfJoin: true,
            lockVolunteersOnDeadline: false,
            controllerCanCreateNotices: true,
            adminEmail: 'developer.test@classhub.edu'
          };
          setCurrentUser({ uid: 'developer-test-uid', email: 'developer.test@classhub.edu' } as any);
          setProfile(testProfile);
          setCurrentClass(testClass);
          setAllMembers(DEV_TEST_MEMBERS);
          setUserMemberships([{
            classId: 'cls-dev-test',
            className: 'ClassHub — Developer Test',
            classCode: 'DEVTEST',
            role: 'ADMIN',
            joinedAt: new Date().toISOString()
          }]);
          setDeveloperSimulationRole('ADMIN');
          return;
        }
        throw new Error('Il provider Email/Password deve essere abilitato nella Console Firebase, oppure accedi con Google.');
      }
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string, 
    pass: string, 
    firstName: string, 
    lastName: string, 
    avatarId: string
  ) => {
    if (!auth) throw new Error('Firebase Auth non inizializzato.');
    
    // Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;

    // Update display name in Firebase Auth
    await updateFirebaseProfile(user, {
      displayName: `${firstName.trim()} ${lastName.trim()}`
    });

    // Save profile document in Firestore
    const newProfile: UserProfile = {
      uid: user.uid,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      role: 'STUDENT', // Strictly default role
      avatarId: avatarId || 'avatar-blue',
      classId: null,
      activeClassId: null,
      className: null,
      createdAt: new Date().toISOString()
    };

    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth non inizializzato.');
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile already exists
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      const nameParts = (user.displayName || '').split(' ');
      const firstName = nameParts[0] || 'Studente';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const newProfile: UserProfile = {
        uid: user.uid,
        firstName,
        lastName,
        email: user.email || '',
        role: 'STUDENT',
        avatarId: 'avatar-blue',
        classId: null,
        activeClassId: null,
        className: null,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase Auth non inizializzato.');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setProfile(null);
    setCurrentClass(null);
    setAllMembers([]);
    setUserMemberships([]);
    setDeveloperSimulationRole('ADMIN');
  };

  // Join a class using its unique invite code
  const joinClass = async (rawCode: string): Promise<{ success: boolean; className: string }> => {
    if (!currentUser || !profile) {
      throw new Error('Devi essere autenticato per unirti a una classe.');
    }

    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('Inserisci un codice classe valido.');
    }

    // Special developer test class match
    if (cleanCode === 'DEVTEST') {
      const testClassData: Classroom = {
        id: 'cls-dev-test',
        name: 'ClassHub — Developer Test',
        code: 'DEVTEST',
        schoolName: 'Liceo Scientifico Leonardo da Vinci',
        academicYear: '2026/2027',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        allowSelfJoin: true,
        lockVolunteersOnDeadline: false,
        controllerCanCreateNotices: true,
        adminEmail: currentUser.email || 'developer.test@classhub.edu'
      };

      const updatedProfileUpdates = {
        classId: 'cls-dev-test',
        activeClassId: 'cls-dev-test',
        className: testClassData.name,
        role: (currentUser.email === 'developer.test@classhub.edu' ? 'ADMIN' : 'STUDENT') as UserRole
      };

      setProfile(prev => prev ? ({ ...prev, ...updatedProfileUpdates }) : null);
      setCurrentClass(testClassData);
      return { success: true, className: testClassData.name };
    }

    // Search class with matching code in Firestore
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('code', '==', cleanCode));
    
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'classes');
    }

    if (!querySnapshot || querySnapshot.empty) {
      throw new Error('Codice classe non valido. Controlla il codice e riprova.');
    }

    const classDoc = querySnapshot.docs[0];
    const classData = classDoc.data() as Classroom;
    const classId = classDoc.id;

    // Check if user is already enrolled in this class
    const memberDocRef = doc(db, 'classes', classId, 'members', currentUser.uid);
    const memberSnap = await getDoc(memberDocRef);

    const userRole: UserRole = memberSnap.exists() ? (memberSnap.data() as ClassMember).role : 'STUDENT';

    // 1. Create/update class membership in class
    const memberData: ClassMember = {
      userId: currentUser.uid,
      classId: classId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: userRole,
      avatarId: profile.avatarId || 'avatar-blue',
      joinedAt: new Date().toISOString()
    };

    try {
      await setDoc(memberDocRef, memberData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${classId}/members/${currentUser.uid}`);
    }

    // 2. Save membership in user's multi-class subcollection
    const userMembershipRef = doc(db, 'users', currentUser.uid, 'memberships', classId);
    const membershipData: UserMembership = {
      classId,
      className: classData.name,
      classCode: classData.code,
      role: userRole,
      joinedAt: new Date().toISOString()
    };

    try {
      await setDoc(userMembershipRef, membershipData);
    } catch (err) {
      console.warn('Membership subcollection save warning:', err);
    }

    // 3. Update user active class
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updatedProfileUpdates = {
      classId: classId,
      activeClassId: classId,
      className: classData.name,
      role: userRole
    };

    try {
      await updateDoc(userDocRef, updatedProfileUpdates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }

    setProfile(prev => prev ? ({ ...prev, ...updatedProfileUpdates }) : null);
    setCurrentClass(classData);

    return { success: true, className: classData.name };
  };

  // Create a new class (Creator becomes ADMIN)
  const createClass = async (
    name: string, 
    schoolName?: string, 
    academicYear?: string
  ): Promise<{ classId: string; code: string; name: string }> => {
    if (!currentUser || !profile) {
      throw new Error('Devi essere autenticato per creare una classe.');
    }

    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error('Inserisci un nome per la classe.');
    }

    const classId = 'cls-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    
    // Ensure generated code is unique
    let generatedCode = generateClassCode();
    try {
      const q = query(collection(db, 'classes'), where('code', '==', generatedCode));
      const existing = await getDocs(q);
      if (!existing.empty) {
        generatedCode = generateClassCode() + 'X';
      }
    } catch {
      // Proceed
    }

    const newClassData: Classroom = {
      id: classId,
      name: cleanName,
      code: generatedCode,
      schoolName: schoolName?.trim() || 'Scuola Superiore',
      academicYear: academicYear?.trim() || '2026/2027',
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      allowSelfJoin: true,
      lockVolunteersOnDeadline: false,
      controllerCanCreateNotices: true,
      adminEmail: profile.email
    };

    // 1. Create Class document
    const classDocRef = doc(db, 'classes', classId);
    try {
      await setDoc(classDocRef, newClassData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `classes/${classId}`);
    }

    // 2. Create Membership with ADMIN role for creator in class
    const memberDocRef = doc(db, 'classes', classId, 'members', currentUser.uid);
    const memberData: ClassMember = {
      userId: currentUser.uid,
      classId: classId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: 'ADMIN',
      avatarId: profile.avatarId || 'avatar-blue',
      joinedAt: new Date().toISOString()
    };

    try {
      await setDoc(memberDocRef, memberData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${classId}/members/${currentUser.uid}`);
    }

    // 3. Save membership in user's multi-class subcollection
    const userMembershipRef = doc(db, 'users', currentUser.uid, 'memberships', classId);
    const membershipData: UserMembership = {
      classId,
      className: cleanName,
      classCode: generatedCode,
      role: 'ADMIN',
      joinedAt: new Date().toISOString()
    };

    try {
      await setDoc(userMembershipRef, membershipData);
    } catch (err) {
      console.warn('Membership subcollection save warning:', err);
    }

    // 4. Update user active class
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userUpdates = {
      classId: classId,
      activeClassId: classId,
      className: cleanName,
      role: 'ADMIN' as UserRole
    };

    try {
      await updateDoc(userDocRef, userUpdates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }

    setProfile(prev => prev ? ({ ...prev, ...userUpdates }) : null);
    setCurrentClass(newClassData);

    return { classId, code: generatedCode, name: cleanName };
  };

  // Switch active classroom seamlessly without losing other classes
  const switchActiveClass = async (targetClassId: string) => {
    if (!currentUser || !profile) return;

    // Fetch class details
    const classDocRef = doc(db, 'classes', targetClassId);
    const classSnap = await getDoc(classDocRef);
    if (!classSnap.exists()) {
      throw new Error('Classe non trovata');
    }
    const classData = classSnap.data() as Classroom;

    // Fetch member role in target class
    const memberDocRef = doc(db, 'classes', targetClassId, 'members', currentUser.uid);
    const memberSnap = await getDoc(memberDocRef);
    const newRole: UserRole = memberSnap.exists() ? (memberSnap.data() as ClassMember).role : 'STUDENT';

    const updates = {
      activeClassId: targetClassId,
      classId: targetClassId,
      className: classData.name,
      role: newRole
    };

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, updates);

    setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
    setCurrentClass(classData);
  };

  // Update a student or member's role (Authorized Admin only)
  const updateUserRole = async (targetUid: string, newRole: UserRole) => {
    const activeCid = profile?.activeClassId || profile?.classId;
    if (!activeCid) return;

    // Check if current user is Admin
    if (profile.role !== 'ADMIN') {
      throw new Error('Solo un Admin può modificare i ruoli dei membri della classe.');
    }

    // Update in members subcollection
    const memberRef = doc(db, 'classes', activeCid, 'members', targetUid);
    try {
      await updateDoc(memberRef, { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${activeCid}/members/${targetUid}`);
    }

    // Update in target user's membership subcollection
    try {
      const targetUserMembershipRef = doc(db, 'users', targetUid, 'memberships', activeCid);
      await updateDoc(targetUserMembershipRef, { role: newRole });
    } catch {
      // Proceed
    }

    // Update in user profile document if target user is currently in this class
    try {
      const targetUserRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetUserRef);
      if (targetSnap.exists() && (targetSnap.data() as UserProfile).classId === activeCid) {
        await updateDoc(targetUserRef, { role: newRole });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  const updateProfileAvatar = async (avatarId: string) => {
    if (!currentUser || !profile) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { avatarId });

    const activeCid = profile.activeClassId || profile.classId;
    if (activeCid) {
      const memberDocRef = doc(db, 'classes', activeCid, 'members', currentUser.uid);
      await updateDoc(memberDocRef, { avatarId });
    }

    setProfile(prev => prev ? { ...prev, avatarId } : null);
  };

  const leaveClass = async () => {
    if (!currentUser || !profile) return;

    const activeCid = profile.activeClassId || profile.classId;
    if (!activeCid) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { classId: null, activeClassId: null, className: null, role: 'STUDENT' });

    setProfile(prev => prev ? { ...prev, classId: null, activeClassId: null, className: null, role: 'STUDENT' } : null);
    setCurrentClass(null);
    setAllMembers([]);
  };

  // Check if Developer Mode is eligible: ONLY developer.test@classhub.edu on ClassHub — Developer Test
  const isDeveloperModeActive = Boolean(
    currentUser?.email === 'developer.test@classhub.edu' &&
    (currentClass?.code === 'DEVTEST' || profile?.activeClassId === 'cls-dev-test' || profile?.classId === 'cls-dev-test' || currentClass?.id === 'cls-dev-test')
  );

  // Compute effective role: if developer testing mode is active, use developerSimulationRole (ADMIN, CONTROLLER, or STUDENT)
  const effectiveRole: UserRole = (isDeveloperModeActive && developerSimulationRole)
    ? developerSimulationRole
    : (profile?.role || 'STUDENT');

  const isStudent = effectiveRole === 'STUDENT';
  const isController = effectiveRole === 'CONTROLLER' || effectiveRole === 'ADMIN';
  const isAdmin = effectiveRole === 'ADMIN';
  const activeClassId = profile?.activeClassId || profile?.classId || '';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        currentClass,
        allMembers,
        userMemberships,
        loading,
        isStudent,
        isController,
        isAdmin,
        activeClassId,
        isDeveloperModeActive,
        developerSimulationRole,
        setDeveloperSimulationRole,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
        joinClass,
        createClass,
        switchActiveClass,
        updateUserRole,
        updateProfileAvatar,
        leaveClass
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
