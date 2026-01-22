/**
 * Утилиты для работы с пользователями
 */

export interface UserDisplayData {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Получить отображаемое имя пользователя
 * Приоритет: firstName + lastName > firstName > username
 */
export function getDisplayName(user: UserDisplayData | null | undefined): string {
  if (!user) return 'User';
  
  if (user.firstName) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
  
  return user.username || 'User';
}
