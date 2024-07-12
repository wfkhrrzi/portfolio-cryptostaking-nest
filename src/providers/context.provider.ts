import { UserEntity } from '@/modules/user-v2/user.entity';
import { ClsServiceManager } from 'nestjs-cls';

export class ContextProvider {
  private static readonly nameSpace = 'request';

  private static readonly authUserKey = 'user_key';

  private static get<T>(key: string) {
    const store = ClsServiceManager.getClsService();

    return store.get<T>(ContextProvider.getKeyWithNamespace(key));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static set(key: string, value: any): void {
    const store = ClsServiceManager.getClsService();

    store.set(ContextProvider.getKeyWithNamespace(key), value);
  }

  private static getKeyWithNamespace(key: string): string {
    return `${ContextProvider.nameSpace}.${key}`;
  }

  static setAuthUser(user: UserEntity): void {
    ContextProvider.set(ContextProvider.authUserKey, user);
  }

  static getAuthUser(): UserEntity | undefined {
    return ContextProvider.get<UserEntity>(ContextProvider.authUserKey);
  }
}
