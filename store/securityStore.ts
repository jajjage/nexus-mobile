import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SecurityState {
  pinAttempts: number;
  isBlocked: boolean;
  blockExpireTime: number | null;
  addAttempt: () => void;
  resetAttempts: () => void;
  checkBlockStatus: () => boolean;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      pinAttempts: 0,
      isBlocked: false,
      blockExpireTime: null,

      addAttempt: () => {
        const { pinAttempts } = get();
        const newAttempts = pinAttempts + 1;

        if (newAttempts >= 5) {
          // Block for 5 minutes
          set({
            pinAttempts: newAttempts,
            isBlocked: true,
            blockExpireTime: Date.now() + 5 * 60 * 1000,
          });
        } else {
          set({ pinAttempts: newAttempts });
        }
      },

      resetAttempts: () => {
        set({
          pinAttempts: 0,
          isBlocked: false,
          blockExpireTime: null,
        });
      },

      checkBlockStatus: () => {
        const { isBlocked, blockExpireTime, resetAttempts } = get();
        if (isBlocked && blockExpireTime) {
          if (Date.now() > blockExpireTime) {
            resetAttempts();
            return false;
          }
          return true;
        }
        return false;
      },
    }),
    {
      name: 'nexus-security-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
