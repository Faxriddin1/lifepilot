import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import type { ProfileUpdateData } from '@/types';

/**
 * Хук для аутентификации и управления профилем пользователя.
 * Объединяет состояние из authStore и запрос профиля через TanStack Query.
 * @returns Объект с данными пользователя, состоянием аутентификации и методами login/register/logout/updateProfile
 */
export function useAuth() {
  const store = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: store.isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
    meta: { skipGlobalError: true },
  });

  if (profileQuery.data && store.user?.id !== profileQuery.data.id) {
    store.setUser(profileQuery.data);
  }

  const updateProfile = async (data: ProfileUpdateData) => {
    const updated = await authApi.updateProfile(data);
    store.setUser(updated);
    return updated;
  };

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading || profileQuery.isLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateProfile,
    refetchProfile: profileQuery.refetch,
  };
}
