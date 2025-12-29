import { useCallback } from "react";
import { useAuthStore } from "../stores/auth.store";
import { useAuthModalStore } from "../stores/authModal.store";

/**
 * Hook that returns a wrapper function. Use it to guard actions that require auth.
 * Example:
 * const requireAuth = useRequireAuth();
 * const handleLike = requireAuth(() => apiToggleLike(postId));
 */
export const useRequireAuth = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);

  return useCallback(
    <T extends (...args: any[]) => any>(cb?: T, message?: string) => {
      return (...args: Parameters<T>) => {
        if (isAuthenticated) {
          return cb ? (cb as any)(...args) : undefined;
        }

        openAuthModal(message);
        return undefined;
      };
    },
    [isAuthenticated, openAuthModal]
  );
};
