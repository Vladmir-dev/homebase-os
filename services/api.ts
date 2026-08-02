import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Standard API Base URL with fallback for Android emulator / local dev / web
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'https://claimless-cerated-robert.ngrok-free.dev/api';
  }
  return 'https://claimless-cerated-robert.ngrok-free.dev/api';
};

export const API_BASE_URL = getBaseUrl();

const STORAGE_KEY_TOKEN = '@homebase_os:access_token';
const STORAGE_KEY_REFRESH = '@homebase_os:refresh_token';
const STORAGE_KEY_USER = '@homebase_os:user';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async init() {
    try {
      this.accessToken = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
      this.refreshToken = await AsyncStorage.getItem(STORAGE_KEY_REFRESH);
    } catch (e) {
      console.error('Failed reading auth token cache:', e);
    }
  }

  async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, access);
    await AsyncStorage.setItem(STORAGE_KEY_REFRESH, refresh);
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEY_REFRESH);
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration & automatic refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login')) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            const err = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(err.detail || err.error || err.message || `HTTP ${retryResponse.status}`);
          }
          return await retryResponse.json();
        }
      }

      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.detail || data.error || data.message || JSON.stringify(data);
        throw new Error(errorMsg || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (error: any) {
      console.warn(`API Request Error [${endpoint}]:`, error.message || error);
      throw error;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        await AsyncStorage.setItem(STORAGE_KEY_TOKEN, data.access);
        return true;
      }
    } catch (e) {
      console.error('Failed refreshing JWT token:', e);
    }
    await this.clearTokens();
    return false;
  }

  // ═══════════════════════════════════════════════════════════
  //  AUTH API ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async login(email: string, password: string) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.tokens) {
      await this.setTokens(data.tokens.access, data.tokens.refresh);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    }
    return data;
  }

  async register(email: string, password: string, firstName: string, lastName: string = '') {
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        password_confirm: password,
        first_name: firstName,
        last_name: lastName,
      }),
    });
  }

  async getProfile() {
    return this.request('/users/me/');
  }

  async logout() {
    await this.clearTokens();
  }

  // ═══════════════════════════════════════════════════════════
  //  ASSET API ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getAssets() {
    return this.request('/assets/');
  }

  async getAssetById(id: string | number) {
    return this.request(`/assets/${id}/`);
  }

  async createAsset(payload: { name: string; asset_type: string; location?: string }) {
    return this.request('/assets/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  MARKETPLACE ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getCategories() {
    return this.request('/categories/');
  }

  async getCategoryById(id: string | number) {
    return this.request(`/categories/${id}/`);
  }

  async getPros() {
    return this.request('/pros/');
  }

  async getBookings() {
    return this.request('/bookings/');
  }

  async createBooking(payload: {
    pro_id?: number;
    asset_id?: number;
    category_id?: number;
    scheduled_time?: string;
    price: number;
    description?: string;
  }) {
    return this.request('/bookings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createGroceryOrder(payload: {
    items: Array<{ name: string; quantity: number; price: number }>;
    mode?: 'kadogo' | 'bulk' | 'pantry';
    delivery_address?: string;
  }) {
    return this.request('/grocery-orders/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDomesticStaff() {
    return this.request('/staff/');
  }

  async createDomesticStaff(payload: {
    asset: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    role: string;
    salary: number;
    advances?: number;
    nssf_number?: string;
    nssf_contribution?: number;
    permissions?: Record<string, boolean>;
  }) {
    return this.request('/staff/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAssetRoles() {
    return this.request('/roles/');
  }

  async createAssetRole(payload: {
    user: number;
    asset: number;
    role: string;
    permissions?: Record<string, boolean>;
  }) {
    return this.request('/roles/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  RENTALS & LEASES ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getLeases() {
    return this.request('/leases/');
  }

  async getActiveLeases() {
    return this.request('/leases/active/');
  }

  async getRentPayments() {
    return this.request('/rent-payments/');
  }

  async createRentPayment(payload: { lease_id: number; amount: number; period_month: number; period_year: number }) {
    return this.request('/rent-payments/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMaintenanceRequests() {
    return this.request('/maintenance/');
  }

  async getUtilityReadings() {
    return this.request('/utility-readings/');
  }

  async createUtilityReading(payload: {
    asset: number;
    utility_type: 'yaka' | 'nwsc';
    reading_value: number;
    reading_date: string;
    amount?: number;
    split_info?: any;
    evidence?: number;
  }) {
    return this.request('/utility-readings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createMaintenanceRequest(payload: {
    asset_id: number;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'emergency';
  }) {
    return this.request('/maintenance/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  CONSTRUCTION APP ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getProjectPhases(siteId?: number) {
    const endpoint = siteId ? `/phases/?site_id=${siteId}` : '/phases/';
    return this.request(endpoint);
  }

  async createProjectPhase(payload: { site: number; name: string; phase_type: string; planned_cost: number }) {
    return this.request('/phases/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async startProjectPhase(phaseId: number | string) {
    return this.request(`/phases/${phaseId}/start/`, { method: 'POST' });
  }

  async reviewProjectPhase(phaseId: number | string) {
    return this.request(`/phases/${phaseId}/review/`, { method: 'POST' });
  }

  async completeProjectPhase(phaseId: number | string) {
    return this.request(`/phases/${phaseId}/complete/`, { method: 'POST' });
  }

  async getMaterialDeliveries(phaseId?: number) {
    const endpoint = phaseId ? `/deliveries/?phase_id=${phaseId}` : '/deliveries/';
    return this.request(endpoint);
  }

  async createMaterialDelivery(payload: {
    phase: number;
    item: string;
    quantity: number;
    unit: string;
    supplier: string;
    unit_cost: number;
    qr_code?: string;
    gps_coordinates?: string;
    boq_match?: boolean;
  }) {
    return this.request('/deliveries/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSiteDiary(siteId?: number) {
    const endpoint = siteId ? `/diary/?site_id=${siteId}` : '/diary/';
    return this.request(endpoint);
  }

  async createSiteDiary(payload: { site: number; entry_date: string; notes: string; weather?: string; workers_count?: number }) {
    return this.request('/diary/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSiteCameras(siteId?: number) {
    const endpoint = siteId ? `/cameras/?site_id=${siteId}` : '/cameras/';
    return this.request(endpoint);
  }

  async getLaborAttendance(siteId?: number) {
    const endpoint = siteId ? `/attendance/?site_id=${siteId}` : '/attendance/';
    return this.request(endpoint);
  }

  async createLaborAttendance(payload: {
    site: number;
    check_in_time: string;
    status?: 'present' | 'absent' | 'late' | 'half_day';
    hours_worked?: number;
    daily_wage?: number;
  }) {
    return this.request('/attendance/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getChamaContributions(userId?: number) {
    const endpoint = userId ? `/chama/?user_id=${userId}` : '/chama/';
    return this.request(endpoint);
  }

  async createChamaContribution(payload: {
    user: number;
    amount: number;
    contribution_number: number;
    due_date: string;
    phase?: number;
    currency?: string;
    status?: 'pending' | 'confirmed' | 'late' | 'defaulted';
  }) {
    return this.request('/chama/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async confirmChamaContribution(contributionId: number | string) {
    return this.request(`/chama/${contributionId}/confirm/`, {
      method: 'POST',
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  HEALTH ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async checkSymptoms(symptoms: string[]) {
    return this.request('/symptoms/check-symptoms/', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });
  }

  async getDoctors() {
    return this.request('/doctors/');
  }

  async getPharmacies() {
    return this.request('/pharmacies/');
  }

  async getMedicines(pharmacyId?: number) {
    const endpoint = pharmacyId ? `/medicines/?pharmacy_id=${pharmacyId}` : '/medicines/';
    return this.request(endpoint);
  }

  async createHealthBooking(payload: {
    doctor?: number;
    pharmacy?: number;
    booking_type: 'consultation' | 'prescription' | 'checkup' | 'emergency';
    scheduled_time?: string;
    symptoms?: string;
    notes?: string;
  }) {
    return this.request('/health-bookings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getHealthBookings(patientId?: number) {
    const endpoint = patientId ? `/health-bookings/?patient_id=${patientId}` : '/health-bookings/';
    return this.request(endpoint);
  }

  async requestAmbulance(payload: {
    location: string;
    gps_coordinates?: string;
    notes?: string;
  }) {
    return this.request('/ambulance/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  TRANSACTIONS & LEDGER ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getTransactions() {
    return this.request('/transactions/');
  }

  async createTransaction(payload: {
    asset_id?: number;
    amount: number;
    type: string;
    description?: string;
  }) {
    return this.request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTransactionSummary() {
    return this.request('/transactions/summary/');
  }

  async getLedgerBalance() {
    return this.request('/ledger/balance/');
  }

  // ═══════════════════════════════════════════════════════════
  //  TRUST & EVIDENCE CHAIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getEvidence(assetId?: number) {
    const endpoint = assetId ? `/evidence/?asset_id=${assetId}` : '/evidence/';
    return this.request(endpoint);
  }

  async getEvidenceById(evidenceId: number | string) {
    return this.request(`/evidence/${evidenceId}/`);
  }

  async verifyEvidence(evidenceId: number | string) {
    return this.request(`/evidence/${evidenceId}/verify/`, {
      method: 'POST',
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  PAYMENTS (FLUTTERWAVE V4) ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async initializePayment(payload: {
    amount: number;
    currency?: string;
    payment_method?: string;
    phone_number?: string;
    description?: string;
    asset_id?: number;
  }) {
    return this.request('/payments/initialize/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async checkPaymentStatus(paymentId: number | string) {
    return this.request(`/payments/${paymentId}/status-check/`);
  }

  async verifyPayment(paymentId: number | string) {
    return this.request(`/payments/${paymentId}/verify/`, {
      method: 'POST',
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  NOTIFICATIONS & REPORTS
  // ═══════════════════════════════════════════════════════════

  async getNotifications() {
    return this.request('/notifications/');
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count/');
  }

  async getReports() {
    return this.request('/reports/');
  }

  async createReport(payload: { asset_id?: number; report_type: string; title: string; parameters?: any }) {
    const { asset_id, ...rest } = payload;
    return this.request('/reports/', {
      method: 'POST',
      body: JSON.stringify({ ...rest, asset: asset_id }),
    });
  }
}

export const api = new ApiClient();
