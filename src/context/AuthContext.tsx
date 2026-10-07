import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole, Classroom, ClassMember, UserMembership } from '../types';
import { localStore, PRESET_USERS } from '../services/dataStore';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { authAdapter, classAdapter } from '../services/adapters';

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
  loginAsDeveloper: (preset?: 'admin' | 'controller' | 'student' | 'developer') => Promise<void>;
  registerWithEmail: (email: string, pass: string, firstName: string, lastName: string, avatarId: string) => Promise<void>;
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

  // Load session & user data asynchronously
  const reloadUserData = useCallback(async (uid: string) => {
    // -------------------------------------------------------------
    // 1. PRIMARY: SUPABASE CLOUD BACKEND
    // -------------------------------------------------------------
    if (isSupabaseConfigured && supabase) {
      try {
        let user = await authAdapter.getProfile(uid);

        // If profile was just created by trigger, allow a brief moment to sync
        if (!user) {
          await new Promise((r) => setTimeout(r, 450));
          user = await authAdapter.getProfile(uid);
        }

        // If still not found in cloud, fall back to localStore
        if (!user) {
          user = localStore.getUser(uid);
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

        const memberships = await classAdapter.getUserMemberships(user.uid);
        setUserMemberships(memberships);

        const effectiveClassId = user.activeClassId || user.classId || memberships[0]?.classId;
        let activeClassObj: Classroom | null = null;
        let membersList: ClassMember[] = [];

        if (effectiveClassId) {
          activeClassObj = await classAdapter.getClass(effectiveClassId);
          membersList = await classAdapter.getMembersOfClass(effectiveClassId);
        }

        const currentMembership = memberships.find((m) => m.classId === effectiveClassId);
        const activeRole = currentMembership?.role || user.role || 'STUDENT';

        const enrichedProfile: UserProfile = {
          ...user,
          role: activeRole,
          classId: effectiveClassId || null,
          activeClassId: effectiveClassId || null,
          className: activeClassObj?.name || null
        };

        setProfile(enrichedProfile);
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: `${user.firstName} ${user.lastName}`
        });
        setCurrentClass(activeClassObj);
        setAllMembers(membersList);
        setLoading(false);
        return;
      } catch (err) {
        console.error('Errore durante reloadUserData con Supabase:', err);
      }
    }

    // -------------------------------------------------------------
    // 2. FALLBACK: LOCALSTORAGE (when Supabase is NOT configured)
    // -------------------------------------------------------------
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
    // 1. Supabase Auth Integration
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          reloadUserData(session.user.id);
        } else {
          const savedUid = localStorage.getItem(SESSION_KEY);
          if (savedUid) {
            reloadUserData(savedUid);
          } else {
            setLoading(false);
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          localStorage.setItem(SESSION_KEY, session.user.id);
          reloadUserData(session.user.id);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    // 2. Local Fallback
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

  // 1-Click Developer / Tester Instant Login
  const loginAsDeveloper = async (preset: 'admin' | 'controller' | 'student' | 'developer' = 'developer') => {
    let targetUid = 'developer-test-uid';
    if (preset === 'controller') targetUid = 'sofia-controller-uid';
    if (preset === 'student') targetUid = 'marco-student-uid';

    // Ensure preset user exists in localStore
    let user = localStore.getUser(targetUid);
    if (!user) {
      const presetUser = PRESET_USERS.find((u) => u.uid === targetUid) || PRESET_USERS[0];
      localStore.saveUser(presetUser);
      user = presetUser;
    }

    // Ensure class and memberships exist
    const cid = user.activeClassId || user.classId || 'cls-dev-test';
    const existingMems = localStore.getUserMemberships(user.uid);
    if (existingMems.length === 0) {
      const targetClass = localStore.getClass(cid);
      const defaultMem: UserMembership = {
        classId: cid,
        className: targetClass?.name || user.className || 'ClassHub — Developer Test',
        classCode: targetClass?.code || 'DEVTEST',
        role: user.role,
        joinedAt: user.createdAt
      };
      localStore.addUserMembership(user.uid, defaultMem);
    }

    localStorage.setItem(SESSION_KEY, user.uid);
    if (preset === 'controller') {
      setDeveloperSimulationRole('CONTROLLER');
    } else if (preset === 'student') {
      setDeveloperSimulationRole('STUDENT');
    } else {
      setDeveloperSimulationRole('ADMIN');
    }

    await reloadUserData(user.uid);
  };

  // Login
  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if this is a developer / preset test account
    const isDevPreset = 
      cleanEmail === 'developer.test@classhub.edu' ||
      cleanEmail === 'admin@classhub.edu' ||
      cleanEmail === 'admin@classhub.it' ||
      cleanEmail === 'developer@classhub.dev' ||
      cleanEmail === 'dev@classhub.edu' ||
      cleanEmail === 'sofia.bianchi@liceo.edu.it' ||
      cleanEmail === 'marco.rossi@liceo.edu.it' ||
      cleanEmail === 'matteo.ferrari@liceo.edu.it';

    // Supabase Auth Integration Point
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });

        if (error) {
          // If developer account is not present in remote Supabase, seamlessly fall back to local dev session
          if (isDevPreset) {
            console.warn('Account sviluppatore/test non presente su Supabase remoto, attivazione sessione locale di sviluppo.');
          } else {
            throw new Error(error.message);
          }
        } else if (data.user) {
          localStorage.setItem(SESSION_KEY, data.user.id);
          await reloadUserData(data.user.id);
          return;
        }
      } catch (err: any) {
        if (!isDevPreset) {
          throw err;
        }
      }
    }

    // Developer / Tester Account Fallbacks
    if (
      cleanEmail === 'developer.test@classhub.edu' ||
      cleanEmail === 'admin@classhub.edu' ||
      cleanEmail === 'admin@classhub.it' ||
      cleanEmail === 'developer@classhub.dev' ||
      cleanEmail === 'dev@classhub.edu'
    ) {
      await loginAsDeveloper('developer');
      return;
    }

    if (cleanEmail === 'sofia.bianchi@liceo.edu.it') {
      await loginAsDeveloper('controller');
      return;
    }

    if (cleanEmail === 'marco.rossi@liceo.edu.it') {
      await loginAsDeveloper('student');
      return;
    }

    // Existing User (Local Fallback)
    const existing = localStore.getAllUsers().find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      localStorage.setItem(SESSION_KEY, existing.uid);
      await reloadUserData(existing.uid);
      return;
    }

    // Auto-create local account for new email (Local Fallback)
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
    await reloadUserData(newUid);
  };

  // Register
  const registerWithEmail = async (
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    avatarId: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();

    // Supabase Auth Integration Point
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            avatar_id: avatarId || 'avatar-blue'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        localStorage.setItem(SESSION_KEY, data.user.id);
        await reloadUserData(data.user.id);
        return;
      }
    }

    // Local Fallback
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
    await reloadUserData(newUid);
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl
      });
      if (error) throw new Error(error.message);
      return;
    }

    return Promise.resolve();
  };

  // Logout
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }

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

    // REAL SUPABASE INTEGRATION VIA RPC
    if (isSupabaseConfigured && supabase) {
      const res = await classAdapter.joinClassByCode(cleanCode);
      await reloadUserData(profile.uid);
      return { success: true, className: res.className };
    }

    // Local Fallback
    let targetClass = localStore.getClassByCode(cleanCode);
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
    await reloadUserData(profile.uid);

    return { success: true, className: targetClass.name };
  };

  // Create Class
  const createClass = async (name: string, schoolName?: string, academicYear?: string) => {
    if (!profile) throw new Error('Utente non autenticato.');

    // REAL SUPABASE INTEGRATION VIA RPC
    if (isSupabaseConfigured && supabase) {
      const res = await classAdapter.createClass(name, schoolName, academicYear, true);
      await reloadUserData(profile.uid);
      return res;
    }

    // Local Fallback
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
    await reloadUserData(profile.uid);

    return { classId: newClassId, code, name };
  };

  // Switch Active Class
  const switchActiveClass = async (classId: string) => {
    if (!profile) return;

    if (isSupabaseConfigured && supabase) {
      await classAdapter.setActiveClass(classId);
      await reloadUserData(profile.uid);
      return;
    }

    // Local Fallback
    const targetClass = localStore.getClass(classId);
    if (!targetClass) return;

    const userMems = localStore.getUserMemberships(profile.uid);
    const mem = userMems.find((m) => m.classId === classId);

    const updatedProfile: UserProfile = {
      ...profile,
      activeClassId: classId,
      classId,
      className: targetClass.name,
      role: mem?.role || profile.role
    };

    localStore.saveUser(updatedProfile);
    await reloadUserData(profile.uid);
  };

  // Update User Role in Active Class
  const updateUserRole = async (targetUid: string, newRole: UserRole) => {
    if (!currentClass) return;

    if (isSupabaseConfigured && supabase) {
      await classAdapter.updateUserRole(currentClass.id, targetUid, newRole);
      await reloadUserData(profile?.uid || targetUid);
      return;
    }

    // Local Fallback
    localStore.updateUserRole(targetUid, newRole);
    if (profile && profile.uid === targetUid) {
      const updatedProfile: UserProfile = { ...profile, role: newRole };
      localStore.saveUser(updatedProfile);
    }
    await reloadUserData(profile?.uid || targetUid);
  };

  // Update Profile Avatar
  const updateProfileAvatar = async (avatarId: string) => {
    if (!profile) return;

    if (isSupabaseConfigured && supabase) {
      await authAdapter.updateProfileAvatar(profile.uid, avatarId);
      await reloadUserData(profile.uid);
      return;
    }

    // Local Fallback
    const updatedProfile: UserProfile = { ...profile, avatarId };
    localStore.saveUser(updatedProfile);
    await reloadUserData(profile.uid);
  };

  // Leave Class
  const leaveClass = async () => {
    if (!profile || !currentClass) return;

    if (isSupabaseConfigured && supabase) {
      await classAdapter.leaveClass(profile.uid, currentClass.id);
      await reloadUserData(profile.uid);
      return;
    }

    // Local Fallback
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
    await reloadUserData(profile.uid);
  };

  // Active Role Logic
  const isDeveloperUser = Boolean(
    profile?.email === 'developer.test@classhub.edu' ||
    profile?.uid === 'developer-test-uid' ||
    profile?.email === 'admin@classhub.edu' ||
    profile?.email === 'admin@classhub.it' ||
    profile?.email === 'developer@classhub.dev'
  );

  const effectiveRole: UserRole =
    isDeveloperUser
      ? developerSimulationRole
      : profile?.role || 'STUDENT';

  const isStudent = effectiveRole === 'STUDENT';
  const isController = effectiveRole === 'CONTROLLER' || effectiveRole === 'ADMIN';
  const isAdmin = effectiveRole === 'ADMIN';
  const activeClassId = currentClass?.id || profile?.activeClassId || profile?.classId || '';
  const isDeveloperModeActive = isDeveloperUser;

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
        loginAsDeveloper,
        registerWithEmail,
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
