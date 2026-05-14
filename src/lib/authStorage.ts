const TOKEN_KEY = 'siades_token';
const ROLE_KEY = 'siades_role';
const NAME_KEY = 'siades_name';
const MUST_UPDATE_KEY = 'siades_must_update_credentials';

export const authStorage = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  getRole(): string | null {
    return sessionStorage.getItem(ROLE_KEY);
  },
  getName(): string | null {
    return sessionStorage.getItem(NAME_KEY);
  },
  getMustUpdateCredentials(): boolean {
    return sessionStorage.getItem(MUST_UPDATE_KEY) === '1';
  },
  setSession(token: string, role: string, name: string, mustUpdateCredentials = false): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, role);
    sessionStorage.setItem(NAME_KEY, name);
    sessionStorage.setItem(MUST_UPDATE_KEY, mustUpdateCredentials ? '1' : '0');
  },
  setRole(role: string): void {
    sessionStorage.setItem(ROLE_KEY, role);
  },
  setName(name: string): void {
    sessionStorage.setItem(NAME_KEY, name);
  },
  setMustUpdateCredentials(mustUpdateCredentials: boolean): void {
    sessionStorage.setItem(MUST_UPDATE_KEY, mustUpdateCredentials ? '1' : '0');
  },
  clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(NAME_KEY);
    sessionStorage.removeItem(MUST_UPDATE_KEY);
  },
};
