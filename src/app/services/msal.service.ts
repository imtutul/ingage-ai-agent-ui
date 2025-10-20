import { Injectable } from '@angular/core';
import { PublicClientApplication, AccountInfo, AuthenticationResult, InteractionRequiredAuthError, SilentRequest, PopupRequest } from '@azure/msal-browser';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * MSAL Service for Client-Side Authentication
 * 
 * Handles Microsoft authentication using MSAL.js library.
 * This replaces server-side authentication with browser-based login.
 * 
 * Features:
 * - Login with Microsoft (popup)
 * - Silent token acquisition
 * - Token caching
 * - Logout
 */
@Injectable({
  providedIn: 'root'
})
export class MsalService {
  private msalInstance: PublicClientApplication;
  private accountSubject = new BehaviorSubject<AccountInfo | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public account$ = this.accountSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    console.log('🔐 MSAL Service: Initializing...');
    
    // Initialize MSAL instance
    this.msalInstance = new PublicClientApplication(environment.msalConfig);
    
    // Initialize MSAL and check for existing session
    this.initializeMsal();
  }

  /**
   * Initialize MSAL and check for existing accounts
   */
  private async initializeMsal(): Promise<void> {
    try {
      await this.msalInstance.initialize();
      console.log('✅ MSAL initialized');
      // Check if user is already logged in
      const accounts = this.msalInstance.getAllAccounts();
      
      if (accounts.length > 0) {
        console.log('✅ Found existing account:', accounts[0].username);
        this.setActiveAccount(accounts[0]);
      } else {
        console.log('❌ No existing accounts found');
      }
    } catch (error) {
      console.error('❌ MSAL initialization failed:', error);
    }
  }

  /**
   * Login with Microsoft using popup
   * 
   * Opens a popup window for Microsoft authentication.
   * Returns a Fabric API access token (not Graph token).
   * 
   * Process:
   * 1. Login with Graph scopes (User.Read)
   * 2. Acquire Fabric API token
   * 3. Return Fabric token for backend
   */
  loginPopup(): Observable<string> {
    console.log('🔑 Step 1: Starting popup login (Graph authentication)...');
    
    const loginRequest: PopupRequest = {
      scopes: environment.apiScopes.graph,
      prompt: 'select_account' // Force account selection to avoid cached state issues
    };

    return from(this.msalInstance.loginPopup(loginRequest)).pipe(
      tap((response: AuthenticationResult) => {
        console.log('✅ Graph authentication successful!');
        console.log('👤 User:', response.account.username);
        this.setActiveAccount(response.account);
      }),
      // Step 2: Get Fabric API token
      switchMap((graphResponse: AuthenticationResult) => {
        console.log('🔑 Step 2: Acquiring Fabric API token...');
        
        return this.acquireFabricToken(graphResponse.account);
      }),
      catchError((error) => {
        console.error('❌ Login failed:', error);
        console.error('Error details:', error.errorCode, error.errorMessage);
        this.isAuthenticatedSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Acquire Fabric API token specifically
   * 
   * This token is required for calling Fabric Data Agent API.
   * Tries silent acquisition first, falls back to popup if needed.
   */
  private acquireFabricToken(account: AccountInfo): Observable<string> {
    const fabricRequest: SilentRequest = {
      account: account,
      scopes: environment.apiScopes.fabric
    };

    return from(this.msalInstance.acquireTokenSilent(fabricRequest)).pipe(
      tap((response: AuthenticationResult) => {
        console.log('✅ Fabric token acquired silently');
        console.log('🎟️ Token audience:', response.account?.username);
        console.log('🔑 Token scopes requested:', environment.apiScopes.fabric);
        this.logTokenDetails(response.accessToken);
      }),
      map((response: AuthenticationResult) => response.accessToken),
      catchError((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          console.warn('⚠️ Interaction required, using popup for Fabric token...');
          
          const fabricPopupRequest: PopupRequest = {
            scopes: environment.apiScopes.fabric,
            account: account
          };
          
          return from(this.msalInstance.acquireTokenPopup(fabricPopupRequest)).pipe(
            tap((response: AuthenticationResult) => {
              console.log('✅ Fabric token acquired via popup');
              console.log('🔑 Token scopes requested:', environment.apiScopes.fabric);
              this.logTokenDetails(response.accessToken);
            }),
            map((response: AuthenticationResult) => response.accessToken)
          );
        }
        console.error('❌ Fabric token acquisition failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Acquire token silently (without user interaction)
   * 
   * Attempts to get a valid Fabric API token from cache or refresh it silently.
   * Falls back to interactive login if silent acquisition fails.
   */
  acquireTokenSilent(): Observable<string> {
    const account = this.msalInstance.getAllAccounts()[0];
    
    if (!account) {
      console.warn('⚠️ No account found, redirecting to login');
      return this.loginPopup();
    }

    const silentRequest: SilentRequest = {
      account: account,
      scopes: environment.apiScopes.fabric // Use Fabric scopes
    };

    return from(this.msalInstance.acquireTokenSilent(silentRequest)).pipe(
      tap(() => console.log('✅ Fabric token acquired silently')),
      map((response: AuthenticationResult) => response.accessToken),
      catchError((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          console.warn('⚠️ Interaction required, falling back to popup');
          return this.loginPopup();
        }
        console.error('❌ Token acquisition failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current access token
   * 
   * Attempts to get token silently, falls back to interactive login if needed.
   */
  getAccessToken(): Observable<string> {
    return this.acquireTokenSilent();
  }

  /**
   * Logout current user
   * 
   * Clears all tokens and redirects to logout page.
   */
  logout(): Observable<void> {
    console.log('🚪 Logging out...');
    
    const account = this.msalInstance.getAllAccounts()[0];
    
    return from(
      this.msalInstance.logoutPopup({
        account: account
      })
    ).pipe(
      tap(() => {
        console.log('✅ Logout successful');
        this.accountSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }),
      map(() => void 0),
      catchError((error) => {
        console.error('❌ Logout error:', error);
        // Clear state anyway
        this.accountSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set active account
   */
  private setActiveAccount(account: AccountInfo): void {
    this.msalInstance.setActiveAccount(account);
    this.accountSubject.next(account);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Get current account (synchronous)
   */
  getCurrentAccount(): AccountInfo | null {
    return this.accountSubject.value;
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): AccountInfo[] {
    return this.msalInstance.getAllAccounts();
  }

  /**
   * Clear all cached data
   * 
   * Clears all MSAL tokens, accounts, and cache.
   * Use this when login fails to reset to clean state.
   */
  async clearCache(): Promise<void> {
    console.log('🧹 Clearing MSAL cache...');
    
    try {
      // Get all accounts
      const accounts = this.msalInstance.getAllAccounts();
      
      // Remove all accounts
      for (const account of accounts) {
        await this.msalInstance.clearCache();
      }
      
      // Clear local state
      this.accountSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      
      // Clear localStorage items related to MSAL
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('msal.') || key.startsWith('microsoft.'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Removed:', key);
      });
      
      console.log('✅ MSAL cache cleared');
    } catch (error) {
      console.error('❌ Error clearing MSAL cache:', error);
      throw error;
    }
  }

  /**
   * Clear all client-side storage
   * 
   * Nuclear option - clears everything.
   * Use when you need a completely fresh start.
   */
  clearAllStorage(): void {
    console.log('💣 Clearing ALL client-side storage...');
    
    try {
      // Clear localStorage
      localStorage.clear();
      console.log('✅ localStorage cleared');
      
      // Clear sessionStorage
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
      
      // Clear MSAL state
      this.accountSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      
      console.log('✅ All client-side storage cleared');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  }

  /**
   * Decode and log token details for debugging
   * 
   * Helps verify token audience, scopes, and expiration
   */
  private logTokenDetails(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Invalid token format');
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      
      console.log('🔍 Token Details:');
      console.log('  📍 Audience (aud):', payload.aud);
      console.log('  🔑 Scopes (scp):', payload.scp || 'N/A');
      console.log('  👤 Roles:', payload.roles || 'N/A');
      console.log('  ⏰ Expires:', new Date(payload.exp * 1000).toLocaleString());
      console.log('  🆔 App ID (appid):', payload.appid || 'N/A');
      
      // Check if token has the correct audience
      if (payload.aud && payload.aud.includes('fabric.microsoft.com')) {
        console.log('✅ Token audience is correct (Fabric API)');
      } else {
        console.warn('⚠️ Token audience might be incorrect:', payload.aud);
      }

      // Check if token has scopes
      if (payload.scp) {
        console.log('✅ Token has scopes:', payload.scp);
      } else if (payload.roles) {
        console.log('✅ Token has roles:', payload.roles);
      } else {
        console.warn('⚠️ Token has no scopes or roles!');
      }
    } catch (error) {
      console.error('❌ Error decoding token:', error);
    }
  }
}
