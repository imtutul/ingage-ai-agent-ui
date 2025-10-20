import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap, switchMap, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthStatus, LoginResponse, User, QueryResponse } from '../models/chat.models';
import { MsalService } from './msal.service';

/**
 * FabricAuthService - Client-Side Authentication (v3.0.0)
 * 
 * Uses MSAL.js for client-side authentication instead of server-side browser.
 * 
 * Authentication Flow:
 * 1. User clicks login → MSAL opens popup
 * 2. User authenticates with Microsoft
 * 3. MSAL returns access token
 * 4. Send token to /auth/client-login
 * 5. Backend validates token and creates session
 * 6. Session cookie returned
 * 7. All subsequent requests use cookie
 * 
 * Benefits:
 * - Fast (no server-side browser)
 * - Works on any platform
 * - Standard OAuth2 flow
 * - Better user experience
 */
@Injectable({
  providedIn: 'root'
})
export class FabricAuthService {
  private readonly API_BASE_URL = environment.apiBaseUrl;
  
  // Authentication state
  private authStatusSubject = new BehaviorSubject<AuthStatus>({
    authenticated: false
  });
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  // Public observables
  public authStatus$ = this.authStatusSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private msalService: MsalService
  ) {
    console.log('🔐 FabricAuthService v3.0.0: Initialized (Client-Side Auth)');
    console.log('🌐 API Base URL:', this.API_BASE_URL);
    
    // Subscribe to MSAL authentication state
    this.msalService.isAuthenticated$.subscribe(isAuth => {
      console.log('📡 MSAL auth state changed:', isAuth);
    });
  }

  /**
   * Check authentication status
   * 
   * API: GET /auth/status
   * Returns: { authenticated: boolean, user?: User, message?: string }
   */
  checkAuthenticationStatus(): Observable<AuthStatus> {
    console.log('🔍 Checking authentication status...');
    
    return this.http.get<AuthStatus>(`${this.API_BASE_URL}/auth/status`, {
      withCredentials: true
    }).pipe(
      tap((response: AuthStatus) => {
        console.log('📡 Auth status:', response.authenticated ? '✅ Authenticated' : '❌ Not authenticated');
        
        this.authStatusSubject.next(response);
        
        if (response.authenticated && response.user) {
          this.currentUserSubject.next(response.user);
          console.log('👤 User:', response.user.email);
        } else {
          this.currentUserSubject.next(null);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Auth status check failed:', error);
        
        const authStatus: AuthStatus = {
          authenticated: false,
          message: 'Failed to check authentication status'
        };
        
        this.authStatusSubject.next(authStatus);
        this.currentUserSubject.next(null);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Login with Microsoft using client-side authentication
   * 
   * NEW: Uses MSAL for client-side authentication
   * 
   * Flow:
   * 1. MSAL opens popup for Microsoft login
   * 2. User authenticates
   * 3. Get Fabric API token from MSAL
   * 4. Send token to backend /auth/client-login
   * 5. Backend validates and creates session
   * 6. Session cookie returned
   * 
   * If login fails: Clears all cache and allows retry
   */
  login(): Observable<LoginResponse> {
    console.log('🔑 Starting client-side login flow...');
    console.log('🌐 MSAL popup will open...');
    
    // Get Fabric API token from MSAL (handles Graph auth + Fabric token)
    return this.msalService.loginPopup().pipe(
      // Send Fabric token to backend
      switchMap((accessToken: string) => {
        console.log('✅ Got Fabric API access token from MSAL');
        console.log('📤 Sending token to backend...');
        
        return this.clientLogin(accessToken);
      }),
      catchError((error) => {
        console.error('❌ Client-side login failed:', error);
        console.log('🧹 Clearing cache due to failure...');
        
        // Clear cache on failure to allow clean retry
        this.msalService.clearCache().catch(err => {
          console.error('❌ Cache clear failed:', err);
        });
        
        this.authStatusSubject.next({
          authenticated: false,
          message: 'Login failed. Please try again.'
        });
        
        this.currentUserSubject.next(null);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all client-side authentication data
   * 
   * Clears:
   * - MSAL tokens and cache
   * - localStorage
   * - sessionStorage
   * - Authentication state
   * 
   * Use this for a complete reset.
   */
  clearAllAuthData(): void {
    console.log('💣 Clearing all authentication data...');
    
    this.msalService.clearAllStorage();
    
    // Reset auth state
    this.authStatusSubject.next({
      authenticated: false,
      message: 'Authentication data cleared'
    });
    
    this.currentUserSubject.next(null);
    
    console.log('✅ All auth data cleared. Ready for fresh login.');
  }

  /**
   * Send access token to backend for session creation
   * 
   * API: POST /auth/client-login
   * Body: { access_token: string }
   * Returns: { success: boolean, user: User, session_id: string }
   */
  private clientLogin(accessToken: string): Observable<LoginResponse> {
    console.log('📤 POST /auth/client-login');
    
    return this.http.post<LoginResponse>(
      `${this.API_BASE_URL}/auth/client-login`,
      { access_token: accessToken },
      { withCredentials: true }
    ).pipe(
      tap((response: LoginResponse) => {
        if (response.success) {
          console.log('✅ Backend login successful!');
          console.log('👤 User:', response.user.email);
          console.log('🍪 Session cookie set');
          
          // Update authentication state
          this.authStatusSubject.next({
            authenticated: true,
            user: response.user,
            message: response.message
          });
          
          this.currentUserSubject.next(response.user);
        } else {
          console.error('❌ Backend login failed:', response.message);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Backend login error:', error);
        
        this.authStatusSubject.next({
          authenticated: false,
          message: error.error?.detail || 'Backend login failed'
        });
        
        this.currentUserSubject.next(null);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Get detailed current user information
   * 
   * API: GET /auth/user
   * Returns: User object with detailed profile info
   * Requires: Authentication
   */
  getCurrentUser(): Observable<User> {
    console.log('👤 Fetching current user details...');
    
    return this.http.get<User>(`${this.API_BASE_URL}/auth/user`, {
      withCredentials: true
    }).pipe(
      tap((user: User) => {
        console.log('✅ User details retrieved:', user.email);
        this.currentUserSubject.next(user);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to get user details:', error);
        
        if (error.status === 401) {
          console.warn('🔐 User not authenticated');
          this.authStatusSubject.next({ authenticated: false });
          this.currentUserSubject.next(null);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Send query to Fabric Data Agent
   * 
   * API: POST /query
   * Body: { query: string }
   * Returns: QueryResponse
   * Requires: Authentication
   */
  sendQuery(query: string): Observable<QueryResponse> {
    console.log('📤 Sending query v3:', query.substring(0, 50) + '...');
    
    return this.http.post<QueryResponse>(`${this.API_BASE_URL}/query`, {
      query
    }, {
      withCredentials: true
    }).pipe(
      tap((response: QueryResponse) => {
        if (response.success) {
          console.log('✅ Query successful');
          if (response.sqlQuery) {
            console.log('📊 SQL:', response.sqlQuery.substring(0, 100) + '...');
          }
        } else {
          console.warn('⚠️ Query returned with error:', response.error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Query failed:', error);
        
        if (error.status === 401) {
          console.warn('🔐 Authentication required');
          this.authStatusSubject.next({ authenticated: false });
          this.currentUserSubject.next(null);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Send detailed query to Fabric Data Agent
   * 
   * API: POST /query/detailed
   * Body: { query: string }
   * Returns: QueryResponse with additional details
   * Requires: Authentication
   */
  sendDetailedQuery(query: string): Observable<QueryResponse> {
    console.log('📤 Sending detailed query v3:', query.substring(0, 50) + '...');
    
    return this.http.post<QueryResponse>(`${this.API_BASE_URL}/query/detailed`, {
      query
    }, {
      withCredentials: true
    }).pipe(
      tap((response: QueryResponse) => {
        if (response.success) {
          console.log('✅ Detailed query successful');
          console.log('📊 Steps:', response.stepsCount);
          console.log('📋 Status:', response.runStatus);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Detailed query failed:', error);
        
        if (error.status === 401) {
          this.authStatusSubject.next({ authenticated: false });
          this.currentUserSubject.next(null);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout current user
   * 
   * Logs out from both MSAL and backend.
   * 
   * Flow:
   * 1. Logout from backend (clears session cookie)
   * 2. Logout from MSAL (clears tokens)
   */
  logout(): Observable<any> {
    console.log('🚪 Logging out...');
    
    // First logout from backend
    return this.http.post(`${this.API_BASE_URL}/auth/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        console.log('✅ Backend logout successful');
        
        // Clear authentication state
        this.authStatusSubject.next({ authenticated: false });
        this.currentUserSubject.next(null);
      }),
      // Then logout from MSAL
      switchMap(() => {
        console.log('🔑 Logging out from MSAL...');
        return this.msalService.logout();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Logout failed:', error);
        
        // Clear state anyway since user intended to logout
        this.authStatusSubject.next({ authenticated: false });
        this.currentUserSubject.next(null);
        
        // Still try to logout from MSAL
        this.msalService.logout().subscribe();
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current authentication state (synchronous)
   */
  isAuthenticated(): boolean {
    return this.authStatusSubject.value.authenticated;
  }

  /**
   * Get current user (synchronous)
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Handle 401 Unauthorized responses
   * 
   * Call this from HTTP interceptor or error handling
   */
  handleUnauthorized(): void {
    console.warn('🔐 Unauthorized access detected - clearing auth state');
    this.authStatusSubject.next({ authenticated: false });
    this.currentUserSubject.next(null);
  }
}
