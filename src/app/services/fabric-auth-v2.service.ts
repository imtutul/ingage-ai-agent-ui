import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap, interval, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthStatus, LoginResponse, User, QueryResponse } from '../models/chat.models';

/**
 * FabricAuthService - API v2.0.0 Alignment
 * 
 * Simplified authentication service using user delegation with cookie-based sessions.
 * 
 * Key Changes from v1.0:
 * - Removed /auth/establish endpoint (no longer needed)
 * - Removed session ID query parameters (cookies only)
 * - Added auto-retry authentication polling (5s interval)
 * - Added /auth/user for detailed user info
 * - Simplified to 4 core methods: checkStatus, login, getCurrentUser, logout
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

  // Polling configuration
  private readonly POLLING_INTERVAL = 5000; // 5 seconds
  private readonly POLLING_TIMEOUT = 300000; // 5 minutes (300 seconds)
  private pollingSubscription: Subscription | null = null;
  private pollingStartTime: number | null = null;

  constructor(private http: HttpClient) {
    console.log('🔐 FabricAuthService v2.0.0: Initialized');
    console.log('🌐 API Base URL:', this.API_BASE_URL);
  }

  /**
   * Check authentication status
   * 
   * API: GET /auth/status
   * Returns: { authenticated: boolean, user?: User, message?: string }
   * 
   * This is the first call when user visits the app.
   * Cookies are automatically included with withCredentials: true
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
   * Login user with Microsoft authentication
   * 
   * API: POST /auth/login
   * Returns: { success: boolean, message: string, user: User, session_expires_at?: string }
   * 
   * This triggers InteractiveBrowserCredential which opens a browser window.
   * User signs in with Microsoft account, and session cookie is set automatically.
   * 
   * IMPORTANT: This endpoint handles the entire browser authentication flow.
   * - Opens browser window for Microsoft login
   * - Waits for user to complete authentication
   * - Sets session cookie on success
   * 
   * Do NOT poll /auth/status after calling this - the login endpoint handles everything.
   * Only call this when the user explicitly clicks "Sign In".
   */
  login(): Observable<LoginResponse> {
    console.log('🔑 Starting login flow...');
    console.log('🌐 Browser authentication will open...');
    
    return this.http.post<LoginResponse>(`${this.API_BASE_URL}/auth/login`, {}, {
      withCredentials: true
    }).pipe(
      tap((response: LoginResponse) => {
        if (response.success) {
          console.log('✅ Login successful!');
          console.log('👤 User:', response.user.email);
          
          // Update authentication state
          this.authStatusSubject.next({
            authenticated: true,
            user: response.user,
            message: response.message
          });
          
          this.currentUserSubject.next(response.user);
        } else {
          console.error('❌ Login failed:', response.message);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Login error:', error);
        
        this.authStatusSubject.next({
          authenticated: false,
          message: error.error?.detail || 'Login failed'
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
   * 
   * Fetches fresh user data from Microsoft Graph API.
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
   * 
   * Session cookie is automatically included with withCredentials: true
   */
  sendQuery(query: string): Observable<QueryResponse> {
    console.log('📤 Sending query v2:', query.substring(0, 50) + '...');
    
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
    console.log('📤 Sending detailed  v2:', query.substring(0, 50) + '...');
    
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
   * API: POST /auth/logout
   * Returns: { success: boolean, message: string }
   * 
   * Destroys session and clears cookie on server side.
   */
  logout(): Observable<any> {
    console.log('🚪 Logging out...');
    
    return this.http.post(`${this.API_BASE_URL}/auth/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        console.log('✅ Logout successful');
        
        // Clear authentication state
        this.authStatusSubject.next({ authenticated: false });
        this.currentUserSubject.next(null);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Logout failed:', error);
        
        // Clear state anyway since user intended to logout
        this.authStatusSubject.next({ authenticated: false });
        this.currentUserSubject.next(null);
        
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

  /**
   * Start auto-retry authentication polling
   * 
   * Polls /auth/status every 5 seconds until:
   * - User is authenticated
   * - 5 minutes timeout is reached
   * - Manual stop is called
   * 
   * This is useful for:
   * - Waiting for browser authentication window completion
   * - Auto-detecting authentication after manual login
   * - Session recovery
   */
  startAuthenticationPolling(): void {
    // Prevent multiple polling instances
    if (this.pollingSubscription) {
      console.warn('⚠️ Polling already running');
      return;
    }

    console.log('🔄 Starting authentication polling (5s interval, 5min timeout)');
    this.pollingStartTime = Date.now();
    
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      const elapsedTime = Date.now() - (this.pollingStartTime || 0);
      
      // Check for timeout (5 minutes)
      if (elapsedTime >= this.POLLING_TIMEOUT) {
        console.warn('⏱️ Polling timeout reached (5 minutes) - stopping');
        this.stopAuthenticationPolling();
        return;
      }
      
      // Check authentication status
      this.checkAuthenticationStatus().subscribe({
        next: (status) => {
          if (status.authenticated) {
            console.log('✅ Polling successful - user authenticated');
            this.stopAuthenticationPolling();
          } else {
            const remainingSeconds = Math.floor((this.POLLING_TIMEOUT - elapsedTime) / 1000);
            console.log(`🔄 Polling... (${remainingSeconds}s remaining)`);
          }
        },
        error: (error) => {
          console.error('❌ Polling check failed:', error);
          // Continue polling even on error
        }
      });
    });
  }

  /**
   * Stop authentication polling
   */
  stopAuthenticationPolling(): void {
    if (this.pollingSubscription) {
      console.log('🛑 Stopping authentication polling');
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
      this.pollingStartTime = null;
    }
  }

  /**
   * Check if polling is currently active
   */
  isPolling(): boolean {
    return this.pollingSubscription !== null;
  }
}
