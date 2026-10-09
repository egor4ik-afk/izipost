// src/lib/storage-access.ts
//
// Кто что видит в бакете. Файлы пользователя RelaxDev лежат в двух папках:
//   users/<id>/      — проекты, созданные после перехода на папки без почты (relaxdev:
//                      Project.storageFolder = id создателя);
//   users/<почта>/   — проекты, созданные раньше: их ссылки не менялись.
// id и почта — из общей с relaxdev таблицы User, вход здесь — тот же аккаунт.
// Суперадмин видит весь бакет. Все роуты и server actions с файлами спрашивают отсюда:
// раньше API и actions не проверяли вход вовсе — любой мог смотреть, загружать и
// удалять файлы всех пользователей.

import { auth } from '@/auth';

/** Как emailToFolder в relaxdev (src/lib/storage-paths.ts) */
export function emailToFolder(email: string): string {
  if (!email) return 'unknown';
  return email.trim().toLowerCase().replace(/[^a-z0-9@.-]/g, '_');
}

export interface StorageUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  /** Папка новых проектов: users/<id>/ */
  idRoot: string;
  /** Папка старых проектов: users/<почта>/ */
  emailRoot: string;
}

export async function storageUser(): Promise<StorageUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email) return null;
  return {
    id: u.id,
    email: u.email,
    isSuperAdmin: !!u.isSuperAdmin,
    idRoot: `users/${u.id.toLowerCase()}/`,
    emailRoot: `users/${emailToFolder(u.email)}/`,
  };
}

/** Можно ли пользователю путь (ключ или префикс папки) */
export function canAccess(u: StorageUser | null, key: string | null | undefined): boolean {
  if (!u) return false;
  if (u.isSuperAdmin) return true;
  const k = String(key ?? '');
  return k.startsWith(u.idRoot) || k.startsWith(u.emailRoot);
}

/** Для server actions и роутов: нет входа или чужой путь — ошибка */
export async function requireAccess(...keys: (string | null | undefined)[]): Promise<StorageUser> {
  const u = await storageUser();
  if (!u) throw new Error('Unauthorized');
  for (const k of keys) if (!canAccess(u, k)) throw new Error('Forbidden');
  return u;
}
