import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole, Classroom, ClassMember, UserMembership } from '../types';
import { localStore, PRESET_USERS } from '../services/dataStore';

interface AuthContextType {
  currentUser: { uid: string; email: string; displayName?: string } | null;
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

const SESSION_KEY = 'classhub_auth_session';

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CLS-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentClass, setCurrentClass] = useState<Classroom | null>(null);
  const [allMembers, setAllMembers] = useState<ClassMember[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);

  // Developer Simulation Switch
  const [developerSimulationRole, setDeveloperSimulationRole] = useState<UserRole>('ADMIN');

  // Load session & user data from localStore
  const reloadUserData = useCallback((uid: string) => {
    let user = localStore.getUser(uid);

    // Fallback for developer test account
    if (!user && uid === 'developer-test-uid') {
      user = {
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
      localStore.saveUser(user);
    }

    if (!user) {
      setCurrentUser(null);
      setProfile(null);
      setCurrentClass(null);
      setAllMembers([]);
      setUserMemberships([]);
      localStorage.removeItem(SESSION_KEY);
      setLoading(false);
      return;
    }

    setProfile(user);
    setCurrentUser({
      uid: user.uid,
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`
    });

    // Memberships
    let memberships = localStore.getUserMemberships(user.uid);
    if (memberships.length === 0 && (user.classId || user.activeClassId)) {
      const cid = user.activeClassId || user.classId || 'cls-dev-test';
      const targetClass = localStore.getClass(cid);
      const defaultMem: UserMembership = {
        classId: cid,
        className: targetClass?.name || user.className || 'ClassHub — Developer Test',
        classCode: targetClass?.code || 'DEVTEST',
        role: user.role,
        joinedAt: user.createdAt
      };
      localStore.addUserMembership(user.uid, defaultMem);
      memberships = [defaultMem];
    }
    setUserMemberships(memberships);

    // Active class
    const effectiveClassId = user.activeClassId || user.classId || memberships[0]?.classId;
    if (effectiveClassId) {
      const activeClassObj = localStore.getClass(effectiveClassId);
      setCurrentClass(activeClassObj);

      const membersList = localStore.getMembersOfClass(effectiveClassId);
      setAllMembers(membersList);
    } else {
      setCurrentClass(null);
      setAllMembers([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const savedUid = localStorage.getItem(SESSION_KEY);
    if (savedUid) {
      reloadUserData(savedUid);
    } else {
      setLoading(false);
    }

    const unsub = localStore.subscribe(() => {
      const activeUid = localStorage.getItem(SESSION_KEY);
      if (activeUid) {
        reloadUserData(activeUid);
      }
    });

    return () => unsub();
  }, [reloadUserData]);

  // Login
  const loginWithEmail = async (email: string, _pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Developer Test Account
    if (cleanEmail === 'developer.test@classhub.edu') {
      const devUid = 'developer-test-uid';
      localStorage.setItem(SESSION_KEY, devUid);
      reloadUserData(devUid);
      return;
    }

    // Existing User
    const existing = localStore.getAllUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      localStorage.setItem(SESSION_KEY, existing.uid);
      reloadUserData(existing.uid);
      return;
    }

    // Auto-create local account for new email
    const nameParts = cleanEmail.split('@')[0].split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Studente';
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'ClassHub';
    const newUid = 'usr-' + Date.now();

    const newProfile: UserProfile = {
      uid: newUid,
      firstName,
      lastName,
      email: cleanEmail,
      role: 'STUDENT',
      avatarId: 'avatar-blue',
      classId: null,
      activeClassId: null,
      className: null,
      createdAt: new Date().toISOString()
    };

    localStore.saveUser(newProfile);
    localStorage.setItem(SESSION_KEY, newUid);
    reloadUserData(newUid);
  };

  // Register
  const registerWithEmail = async (
    email: string,
    _pass: string,
    firstName: string,
    lastName: string,
    avatarId: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const newUid = 'usr-' + Date.now();

    const newProfile: UserProfile = {
      uid: newUid,
      firstName,
      lastName,
      email: cleanEmail,
      role: 'STUDENT',
      avatarId: avatarId || 'avatar-blue',
      classId: null,
      activeClassId: null,
      className: null,
      createdAt: new Date().toISOString()
    };

    localStore.saveUser(newProfile);
    localStorage.setItem(SESSION_KEY, newUid);
    reloadUserData(newUid);
  };

  // Google Login Simulation
  const loginWithGoogle = async () => {
    const googleUid = 'google-usr-' + Date.now();
    const googleProfile: UserProfile = {
      uid: googleUid,
      firstName: 'Studente',
      lastName: 'Google',
      email: 'studente.google@classhub.edu',
      role: 'STUDENT',
      avatarId: 'avatar-cyan',
      classId: null,
      activeClassId: null,
      className: null,
      createdAt: new Date().toISOString()
    };

    localStore.saveUser(googleProfile);
    localStorage.setItem(SESSION_KEY, googleUid);
    reloadUserData(googleUid);
  };

  const resetPassword = async (_email: string) => {
    return Promise.resolve();
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setProfile(null);
    setCurrentClass(null);
    setAllMembers([]);
    setUserMemberships([]);
  };

  // Join Class
  const joinClass = async (code: string) => {
    if (!profile) throw new Error('Utente non autenticato.');
    const cleanCode = code.trim().toUpperCase();

    let targetClass = localStore.getClassByCode(cleanCode);

    // Fallback for DEVTEST
    if (!targetClass && (cleanCode === 'DEVTEST' || cleanCode === 'DEV-TEST')) {
      targetClass = localStore.getClass('cls-dev-test');
    }

    if (!targetClass) {
      throw new Error('Codice classe non valido o classe inesistente. Verificalo e riprova.');
    }

    const membership: UserMembership = {
      classId: targetClass.id,
      className: targetClass.name,
      classCode: targetClass.code,
      role: profile.uid === targetClass.createdBy ? 'ADMIN' : 'STUDENT',
      joinedAt: new Date().toISOString()
    };

    localStore.addUserMembership(profile.uid, membership);

    const updatedProfile: UserProfile = {
      ...profile,
      classId: targetClass.id,
      activeClassId: targetClass.id,
      className: targetClass.name,
      role: membership.role
    };

    localStore.saveUser(updatedProfile);
    reloadUserData(profile.uid);

    return { success: true, className: targetClass.name };
  };

  // Create Class
  const createClass = async (name: string, schoolName?: string, academicYear?: string) => {
    if (!profile) throw new Error('Utente non autenticato.');

    const newClassId = 'cls-' + Date.now();
    const code = generateClassCode();

    const newClass: Classroom = {
      id: newClassId,
      name,
      code,
      schoolName: schoolName || 'Liceo / Istituto',
      academicYear: academicYear || '2026/2027',
      createdBy: profile.uid,
      createdAt: new Date().toISOString(),
      allowSelfJoin: true,
      lockVolunteersOnDeadline: false,
      controllerCanCreateNotices: true,
      adminEmail: profile.email
    };

    localStore.createClass(newClass);

    const membership: UserMembership = {
      classId: newClassId,
      className: name,
      classCode: code,
      role: 'ADMIN',
      joinedAt: new Date().toISOString()
    };

    localStore.addUserMembership(profile.uid, membership);

    const updatedProfile: UserProfile = {
      ...profile,
      classId: newClassId,
      activeClassId: newClassId,
      className: name,
      role: 'ADMIN'
    };

    localStore.saveUser(updatedProfile);
    reloadUserData(profile.uid);

    return { classId: newClassId, code, name };
  };

  // Switch Active Class
  const switchActiveClass = async (classId: string) => {
    if (!profile) return;
    const targetClass = localStore.getClass(classId);
    if (!targetClass) return;

    const userMems = localStore.getUserMemberships(profile.uid);
    const mem = userMems.find(m => m.classId === classId);

    const updatedProfile: UserProfile = {
      ...profile,
      activeClassId: classId,
      classId,
      className: targetClass.name,
      role: mem?.role || profile.role
    };

    localStore.saveUser(updatedProfile);
    reloadUserData(profile.uid);
  };

  // Update User Role in Active Class
  const updateUserRole = async (targetUid: string, newRole: UserRole) => {
    if (!currentClass) return;
    localStore.updateUserRole(targetUid, newRole);

    if (profile && profile.uid === targetUid) {
      const updatedProfile: UserProfile = { ...profile, role: newRole };
      localStore.saveUser(updatedProfile);
    }

    reloadUserData(profile?.uid || targetUid);
  };

  // Update Profile Avatar
  const updateProfileAvatar = async (avatarId: string) => {
    if (!profile) return;
    const updatedProfile: UserProfile = { ...profile, avatarId };
    localStore.saveUser(updatedProfile);
    reloadUserData(profile.uid);
  };

  // Leave Class
  const leaveClass = async () => {
    if (!profile || !currentClass) return;
    localStore.removeUserMembership(profile.uid, currentClass.id);

    const remainingMems = localStore.getUserMemberships(profile.uid);
    const nextClassId = remainingMems[0]?.classId || null;
    const nextClassName = remainingMems[0]?.className || null;

    const updatedProfile: UserProfile = {
      ...profile,
      classId: nextClassId,
      activeClassId: nextClassId,
      className: nextClassName
    };

    localStore.saveUser(updatedProfile);
    reloadUserData(profile.uid);
  };

  // Active Role Logic
  const effectiveRole: UserRole = profile?.email === 'developer.test@classhub.edu' && currentClass?.id === 'cls-dev-test'
    ? developerSimulationRole
    : profile?.role || 'STUDENT';

  const isStudent = effectiveRole === 'STUDENT';
  const isController = effectiveRole === 'CONTROLLER' || effectiveRole === 'ADMIN';
  const isAdmin = effectiveRole === 'ADMIN';
  const activeClassId = currentClass?.id || profile?.activeClassId || profile?.classId || '';
  const isDeveloperModeActive = profile?.email === 'developer.test@classhub.edu' && currentClass?.id === 'cls-dev-test';

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
