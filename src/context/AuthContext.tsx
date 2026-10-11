import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection, sanitizeForFirestore } from '../lib/firebase';
import { Business, UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  businesses: Business[];
  currentBusiness: Business | null;
  currentRole: UserRole;
  loading: boolean;
  switchBusiness: (businessId: string) => void;
  refreshBusinesses: () => Promise<void>;
  updateBusinessProfile: (data: Partial<Business>) => Promise<void>;
  createNewBusiness: (data: Omit<Business, 'id' | 'createdAt' | 'ownerId'>) => Promise<string>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  permissions: {
    canManageSettings: boolean;
    canManageEmployees: boolean;
    canManageFinance: boolean;
    canManageInventory: boolean;
    canCreateSales: boolean;
    canCreatePurchases: boolean;
    canDeleteRecords: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize browser persistence
  useEffect(() => {
    testConnection();
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Failed to set auth persistence:', err);
    });
  }, []);

  const fetchBusinessesForUser = async (currentUser: User) => {
    try {
      const bList: Business[] = [];
      
      // 1. Fetch businesses where user is owner
      const ownedQ = query(
        collection(db, 'businesses'),
        where('ownerId', '==', currentUser.uid)
      );
      const ownedSnap = await getDocs(ownedQ);
      ownedSnap.forEach((d) => {
        bList.push({ id: d.id, ...d.data() } as Business);
      });

      setBusinesses(bList);

      // Select active business
      const savedBusinessId = localStorage.getItem('dms_active_business_id');
      const found = bList.find((b) => b.id === savedBusinessId) || bList[0] || null;
      setCurrentBusiness(found);

      if (found) {
        if (found.ownerId === currentUser.uid) {
          setCurrentRole('owner');
        }
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync user profile
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Business User',
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, sanitizeForFirestore(newProfile));
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("User profile sync error:", error);
        }

        await fetchBusinessesForUser(firebaseUser);
      } else {
        setUserProfile(null);
        setBusinesses([]);
        setCurrentBusiness(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const switchBusiness = (businessId: string) => {
    const b = businesses.find((item) => item.id === businessId);
    if (b) {
      setCurrentBusiness(b);
      localStorage.setItem('dms_active_business_id', b.id);
      if (user && b.ownerId === user.uid) {
        setCurrentRole('owner');
      }
    }
  };

  const refreshBusinesses = async () => {
    if (user) {
      await fetchBusinessesForUser(user);
    }
  };

  const createNewBusiness = async (
    data: Omit<Business, 'id' | 'createdAt' | 'ownerId'>
  ): Promise<string> => {
    if (!user) throw new Error('Must be logged in to create a business');
    const businessId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newBiz: Business = {
      ...data,
      id: businessId,
      ownerId: user.uid,
      ownerName: data.ownerName || userProfile?.displayName || user.displayName || 'Owner',
      createdAt: now,
      updatedAt: now,
    };

    try {
      // 1. Create business record
      await setDoc(doc(db, 'businesses', businessId), sanitizeForFirestore(newBiz));

      // 2. Pre-create default accounts (Cash in hand, Bank account, MFS)
      const defaultAccounts = [
        {
          id: 'acc_cash_' + Date.now(),
          businessId,
          name: 'Cash in Hand',
          type: 'cash' as const,
          balance: 0,
          isDefault: true,
          createdAt: now,
        },
        {
          id: 'acc_bank_' + Date.now(),
          businessId,
          name: 'Main Bank Account',
          type: 'bank' as const,
          bankName: 'City Bank',
          accountNumber: '110-12345678',
          balance: 0,
          isDefault: false,
          createdAt: now,
        },
        {
          id: 'acc_mfs_' + Date.now(),
          businessId,
          name: 'bKash Merchant / Personal',
          type: 'mfs' as const,
          accountNumber: '01789637029',
          balance: 0,
          isDefault: false,
          createdAt: now,
        },
      ];

      for (const acc of defaultAccounts) {
        await setDoc(doc(db, 'businesses', businessId, 'accounts', acc.id), sanitizeForFirestore(acc));
      }

      // 3. Create initial audit log
      const auditLog = {
        id: 'log_' + Date.now(),
        businessId,
        actorUid: user.uid,
        actorName: userProfile?.displayName || user.displayName || user.email || 'Owner',
        actorEmail: user.email || undefined,
        action: 'CREATED_BUSINESS',
        module: 'Settings',
        details: `Created new business: ${newBiz.name}`,
        createdAt: now,
      };
      await setDoc(doc(db, 'businesses', businessId, 'auditLogs', auditLog.id), sanitizeForFirestore(auditLog));

      // 4. Update local state
      setBusinesses((prev) => [...prev, newBiz]);
      setCurrentBusiness(newBiz);
      setCurrentRole('owner');
      localStorage.setItem('dms_active_business_id', businessId);

      return businessId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `businesses/${businessId}`);
    }
  };

  const updateBusinessProfile = async (data: Partial<Business>) => {
    if (!currentBusiness) throw new Error('No active business');
    try {
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'businesses', currentBusiness.id), sanitizeForFirestore(updated));
      
      const newBiz = { ...currentBusiness, ...updated };
      setCurrentBusiness(newBiz);
      setBusinesses((prev) => prev.map((b) => (b.id === newBiz.id ? newBiz : b)));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `businesses/${currentBusiness.id}`);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name && name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOutUser = async () => {
    await signOut(auth);
    localStorage.removeItem('dms_active_business_id');
    setUser(null);
    setUserProfile(null);
    setBusinesses([]);
    setCurrentBusiness(null);
  };

  const permissions = useMemo(() => {
    const isOwnerOrAdmin = currentRole === 'owner' || currentRole === 'admin';
    const isManager = isOwnerOrAdmin || currentRole === 'manager';
    return {
      canManageSettings: isOwnerOrAdmin,
      canManageEmployees: isOwnerOrAdmin,
      canManageFinance: isOwnerOrAdmin || currentRole === 'accountant' || currentRole === 'manager',
      canManageInventory: isOwnerOrAdmin || currentRole === 'inventory_manager' || currentRole === 'manager',
      canCreateSales: isManager || currentRole === 'salesperson',
      canCreatePurchases: isManager || currentRole === 'inventory_manager',
      canDeleteRecords: isOwnerOrAdmin,
    };
  }, [currentRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        businesses,
        currentBusiness,
        currentRole,
        loading,
        switchBusiness,
        refreshBusinesses,
        updateBusinessProfile,
        createNewBusiness,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        signOutUser,
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
