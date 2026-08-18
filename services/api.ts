import AsyncStorage from "@react-native-async-storage/async-storage";

// Standard API Base URL, overridable via EXPO_PUBLIC_API_URL (e.g. .env).
const DEFAULT_API_BASE_URL = "http://13.63.249.214/api";

const getBaseUrl = () => {
  // const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  // if (fromEnv) {
  //   return fromEnv.replace(/\/+$/, "");
  // }
  return DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = getBaseUrl();

export interface ServiceImage {
  id: number;
  url: string;
  position: number;
}

export interface ServiceSubCategoryResponse {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  image_url?: string | null;
  is_active: boolean;
}

export interface ServiceItemResponse {
  id: number;
  provider: number;
  provider_email: string;
  provider_name: string;
  category: number;
  category_name: string;
  subcategory: number | null;
  subcategory_name: string | null;
  name: string;
  description: string;
  price: string;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
  images: ServiceImage[];
}

const STORAGE_KEY_TOKEN = "@homebase_os:access_token";
const STORAGE_KEY_REFRESH = "@homebase_os:refresh_token";
const STORAGE_KEY_USER = "@homebase_os:user";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async init() {
    try {
      this.accessToken = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
      this.refreshToken = await AsyncStorage.getItem(STORAGE_KEY_REFRESH);
    } catch (e) {
      console.error("Failed reading auth token cache:", e);
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
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const isGet = !options.method || options.method.toUpperCase() === "GET";
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Let fetch set the multipart boundary for FormData bodies.
    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration & automatic refresh
      if (
        response.status === 401 &&
        this.refreshToken &&
        !endpoint.includes("/auth/login")
      ) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            const err = await retryResponse
              .json()
              .catch(() => ({ message: "Request failed" }));
            throw new Error(
              err.detail ||
                err.error ||
                err.message ||
                `HTTP ${retryResponse.status}`,
            );
          }
          const retryData = await retryResponse.json();
          if (isGet) {
            await this.writeCache(endpoint, retryData);
          }
          return retryData;
        }
      }

      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          data.detail || data.error || data.message || JSON.stringify(data);
        throw new Error(
          errorMsg || `Request failed with status ${response.status}`,
        );
      }

      if (isGet) {
        await this.writeCache(endpoint, data);
      }

      return data as T;
    } catch (error: any) {
      // Offline-first: fall back to the last-known cached response for reads.
      if (isGet) {
        const cached = await this.readCache<T>(endpoint);
        if (cached !== null) {
          console.warn(`Offline fallback to cache [${endpoint}]`);
          return cached;
        }
      }
      console.warn(`API Request Error [${endpoint}]:`, error.message || error);
      throw error;
    }
  }

  private async readCache<T>(endpoint: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`@homebase_os:cache:${endpoint}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && "data" in parsed
        ? (parsed.data as T)
        : (parsed as T);
    } catch (e) {
      return null;
    }
  }

  private async writeCache(endpoint: string, data: unknown) {
    try {
      await AsyncStorage.setItem(
        `@homebase_os:cache:${endpoint}`,
        JSON.stringify({ data, ts: Date.now() }),
      );
    } catch (e) {
      console.warn(`Cache write failed [${endpoint}]:`, e);
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        await AsyncStorage.setItem(STORAGE_KEY_TOKEN, data.access);
        return true;
      }
    } catch (e) {
      console.error("Failed refreshing JWT token:", e);
    }
    await this.clearTokens();
    return false;
  }

  // ═══════════════════════════════════════════════════════════
  //  AUTH API ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async login(email: string, password: string) {
    const data = await this.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.tokens) {
      await this.setTokens(data.tokens.access, data.tokens.refresh);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    }
    return data;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string = "",
  ) {
    return this.request("/auth/register/", {
      method: "POST",
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
    return this.request("/users/me/");
  }

  async logout() {
    await this.clearTokens();
  }

  // ═══════════════════════════════════════════════════════════
  //  ASSET API ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getAssets() {
    return this.request("/assets/");
  }

  async getAssetById(id: string | number) {
    return this.request(`/assets/${id}/`);
  }

  async createAsset(payload: {
    name: string;
    asset_type: string;
    location?: string;
  }) {
    return this.request("/assets/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  MARKETPLACE ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getCategories() {
    return this.request("/categories/");
  }

  async getCategoryById(id: string | number) {
    return this.request(`/categories/${id}/`);
  }

  async getPros() {
    return this.request("/pros/");
  }

  async getBookings() {
    return this.request("/bookings/");
  }

  async createBooking(payload: {
    pro_id?: number;
    asset_id?: number;
    category_id?: number;
    scheduled_time?: string;
    price: number;
    description?: string;
  }) {
    return this.request("/bookings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  SERVICES (PROVIDED SERVICES) ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getServices(params?: {
    category?: number | string;
    provider?: string;
    subcategory?: number | string;
  }) {
    const query = new URLSearchParams();
    if (params?.category !== undefined) {
      query.set("category", String(params.category));
    }
    if (params?.provider !== undefined) {
      query.set("provider", params.provider);
    }
    if (params?.subcategory !== undefined) {
      query.set("subcategory", String(params.subcategory));
    }
    const qs = query.toString();
    return this.request(qs ? `/services/?${qs}` : "/services/");
  }

  async getSubcategories(params?: { category?: number | string }) {
    const query = new URLSearchParams();
    if (params?.category !== undefined) {
      query.set("category", String(params.category));
    }
    const qs = query.toString();
    return this.request(qs ? `/subcategories/?${qs}` : "/subcategories/");
  }

  async getServiceById(id: number | string) {
    return this.request(`/services/${id}/`);
  }

  async createService(
    payload: {
      name: string;
      category: number;
      subcategory?: number;
      price: number;
      description?: string;
      duration_minutes?: number;
      currency?: string;
      is_active?: boolean;
    },
    imageFiles: Array<{ uri: string; name: string; type: string }> = [],
  ) {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        body.append(key, String(value));
      }
    });
    imageFiles.forEach((file) => {
      body.append("image_files", file as any);
    });
    return this.request("/services/", {
      method: "POST",
      body,
    });
  }

  async updateService(
    id: number | string,
    payload: Record<string, unknown>,
    imageFiles: Array<{ uri: string; name: string; type: string }> = [],
  ) {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        body.append(key, String(value));
      }
    });
    imageFiles.forEach((file) => {
      body.append("image_files", file as any);
    });
    return this.request(`/services/${id}/`, {
      method: "PATCH",
      body,
    });
  }

  async deleteService(id: number | string) {
    return this.request(`/services/${id}/`, { method: "DELETE" });
  }

  async deleteServiceImage(imageId: number | string) {
    return this.request(`/service-images/${imageId}/`, { method: "DELETE" });
  }

  async createGroceryOrder(payload: {
    items: Array<{ name: string; quantity: number; price: number }>;
    mode?: "kadogo" | "bulk" | "pantry";
    delivery_address?: string;
  }) {
    return this.request("/grocery-orders/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getGroceryOrders() {
    return this.request("/grocery-orders/");
  }

  async cancelGroceryOrder(orderId: number | string) {
    return this.request(`/grocery-orders/${orderId}/cancel/`, {
      method: "POST",
    });
  }

  async getDomesticStaff() {
    return this.request("/staff/");
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
    return this.request("/staff/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAssetRoles() {
    return this.request("/roles/");
  }

  async createAssetRole(payload: {
    user: number;
    asset: number;
    role: string;
    permissions?: Record<string, boolean>;
  }) {
    return this.request("/roles/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  RENTALS & LEASES ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getLeases() {
    return this.request("/leases/");
  }

  async getActiveLeases() {
    return this.request("/leases/active/");
  }

  async createLease(payload: {
    asset: number;
    tenant: number;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    deposit_amount?: number;
    currency?: string;
    terms?: string;
    status?: string;
  }) {
    return this.request("/leases/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createLeaseByEmail(payload: {
    asset: number;
    tenant_email: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    deposit_amount?: number;
    currency?: string;
    terms?: string;
    activate?: boolean;
  }) {
    return this.request("/leases/create-by-email/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateLease(id: number, payload: Record<string, unknown>) {
    return this.request(`/leases/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async activateLease(id: number) {
    return this.request(`/leases/${id}/activate/`, {
      method: "POST",
    });
  }

  async terminateLease(id: number) {
    return this.request(`/leases/${id}/terminate/`, {
      method: "POST",
    });
  }

  async getRentPayments() {
    return this.request("/rent-payments/");
  }

  async createRentPayment(payload: {
    lease_id: number;
    amount: number;
    period_month: number;
    period_year: number;
  }) {
    return this.request("/rent-payments/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMaintenanceRequests() {
    return this.request("/maintenance/");
  }

  async getUtilityReadings() {
    return this.request("/utility-readings/");
  }

  async createUtilityReading(payload: {
    asset: number;
    utility_type: "yaka" | "nwsc";
    reading_value: number;
    reading_date: string;
    amount?: number;
    split_info?: any;
    evidence?: number;
  }) {
    return this.request("/utility-readings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createMaintenanceRequest(payload: {
    asset_id: number;
    title: string;
    description: string;
    priority?: "low" | "medium" | "high" | "emergency";
  }) {
    const { asset_id, ...rest } = payload;
    return this.request("/maintenance/", {
      method: "POST",
      body: JSON.stringify({ ...rest, asset: asset_id }),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  CONSTRUCTION APP ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getProjectPhases(siteId?: number) {
    const endpoint = siteId ? `/phases/?site_id=${siteId}` : "/phases/";
    return this.request(endpoint);
  }

  async getConstructionBudget(siteId: number | string) {
    return this.request(
      `/construction-sites/budget/?site_id=${siteId}`
    );
  }

  async createProjectPhase(payload: {
    site: number;
    name: string;
    phase_type: string;
    planned_cost: number;
  }) {
    return this.request("/phases/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async startProjectPhase(phaseId: number | string) {
    return this.request(`/phases/${phaseId}/start/`, { method: "POST" });
  }

  async reviewProjectPhase(phaseId: number | string) {
    return this.request(`/phases/${phaseId}/review/`, { method: "POST" });
  }

  async completeProjectPhase(phaseId: number | string) {
    return this.request(`/phases/${phaseId}/complete/`, { method: "POST" });
  }

  async getMaterialDeliveries(phaseId?: number) {
    const endpoint = phaseId
      ? `/deliveries/?phase_id=${phaseId}`
      : "/deliveries/";
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
    return this.request("/deliveries/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getSiteDiary(siteId?: number) {
    const endpoint = siteId ? `/diary/?site_id=${siteId}` : "/diary/";
    return this.request(endpoint);
  }

  async createSiteDiary(payload: {
    site: number;
    entry_date: string;
    notes: string;
    weather?: string;
    workers_count?: number;
  }) {
    return this.request("/diary/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getSiteCameras(siteId?: number) {
    const endpoint = siteId ? `/cameras/?site_id=${siteId}` : "/cameras/";
    return this.request(endpoint);
  }

  async getLaborAttendance(siteId?: number) {
    const endpoint = siteId ? `/attendance/?site_id=${siteId}` : "/attendance/";
    return this.request(endpoint);
  }

  async createLaborAttendance(payload: {
    site: number;
    check_in_time: string;
    status?: "present" | "absent" | "late" | "half_day";
    hours_worked?: number;
    daily_wage?: number;
  }) {
    return this.request("/attendance/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getChamaContributions(userId?: number) {
    const endpoint = userId ? `/chama/?user_id=${userId}` : "/chama/";
    return this.request(endpoint);
  }

  async createChamaContribution(payload: {
    user: number;
    amount: number;
    contribution_number: number;
    due_date: string;
    phase?: number;
    currency?: string;
    status?: "pending" | "confirmed" | "late" | "defaulted";
  }) {
    return this.request("/chama/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async confirmChamaContribution(contributionId: number | string) {
    return this.request(`/chama/${contributionId}/confirm/`, {
      method: "POST",
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  HEALTH ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async checkSymptoms(symptoms: string[]) {
    return this.request("/symptoms/check-symptoms/", {
      method: "POST",
      body: JSON.stringify({ symptoms }),
    });
  }

  async triageSymptoms(payload: {
    symptoms: string[];
    age?: number;
    duration_days?: number;
  }) {
    return this.request("/symptoms/triage/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getDoctors() {
    return this.request("/doctors/");
  }

  async getPharmacies() {
    return this.request("/pharmacies/");
  }

  async discoverPharmacies(location?: string) {
    const endpoint = location
      ? `/pharmacies/discover/?location=${encodeURIComponent(location)}`
      : "/pharmacies/discover/";
    return this.request(endpoint);
  }

  async getMedicines(pharmacyId?: number) {
    const endpoint = pharmacyId
      ? `/medicines/?pharmacy_id=${pharmacyId}`
      : "/medicines/";
    return this.request(endpoint);
  }

  async createHealthBooking(payload: {
    doctor?: number;
    pharmacy?: number;
    booking_type: "consultation" | "prescription" | "checkup" | "emergency";
    scheduled_time?: string;
    symptoms?: string;
    notes?: string;
  }) {
    return this.request("/health-bookings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getHealthBookings(patientId?: number) {
    const endpoint = patientId
      ? `/health-bookings/?patient_id=${patientId}`
      : "/health-bookings/";
    return this.request(endpoint);
  }

  async cancelHealthBooking(bookingId: number | string) {
    return this.request(`/health-bookings/${bookingId}/cancel/`, {
      method: "POST",
    });
  }

  async getPrescriptions(bookingId?: number) {
    const endpoint = bookingId
      ? `/prescriptions/?booking_id=${bookingId}`
      : "/prescriptions/";
    return this.request(endpoint);
  }

  async requestAmbulance(payload: {
    location: string;
    gps_coordinates?: string;
    notes?: string;
  }) {
    return this.request("/ambulance/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAmbulanceDispatches(patientId?: number) {
    const endpoint = patientId
      ? `/ambulance/?patient_id=${patientId}`
      : "/ambulance/";
    return this.request(endpoint);
  }

  // ═══════════════════════════════════════════════════════════
  //  TRANSACTIONS & LEDGER ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getTransactions() {
    return this.request("/transactions/");
  }

  async createTransaction(payload: {
    asset_id?: number;
    amount: number;
    type: string;
    description?: string;
  }) {
    return this.request("/transactions/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getTransactionSummary() {
    return this.request("/transactions/summary/");
  }

  async getLedgerBalance() {
    return this.request("/ledger/balance/");
  }

  async getLedgerByAsset(assetId: number | string) {
    return this.request(`/ledger/by-asset/?asset_id=${assetId}`);
  }

  async getEscrowConfig() {
    return this.request("/payments/escrow-config/");
  }

  // ═══════════════════════════════════════════════════════════
  //  TRUST & EVIDENCE CHAIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getEvidence(assetId?: number) {
    const endpoint = assetId ? `/evidence/?asset_id=${assetId}` : "/evidence/";
    return this.request(endpoint);
  }

  async checkEvidenceIntegrity(assetId?: number) {
    const endpoint = assetId
      ? `/evidence/integrity/?asset_id=${assetId}`
      : "/evidence/integrity/";
    return this.request(endpoint);
  }

  async getEvidenceById(evidenceId: number | string) {
    return this.request(`/evidence/${evidenceId}/`);
  }

  async verifyEvidence(evidenceId: number | string) {
    return this.request(`/evidence/${evidenceId}/verify/`, {
      method: "POST",
    });
  }

  async fileStrike(
    userId: number | string,
    reason: string,
    severity: "minor" | "moderate" | "severe",
  ) {
    return this.request(`/users/${userId}/strike/`, {
      method: "POST",
      body: JSON.stringify({ reason, severity }),
    });
  }

  async getUserStrikes(userId: number | string) {
    return this.request(`/users/${userId}/strikes/`);
  }

  async getTrustSummary(assetId?: number) {
    const endpoint = assetId
      ? `/trust-summary/?asset_id=${assetId}`
      : "/trust-summary/";
    return this.request(endpoint);
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
    transaction_type?: string;
  }) {
    return this.request("/payments/initialize/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async checkPaymentStatus(paymentId: number | string) {
    return this.request(`/payments/${paymentId}/status-check/`);
  }

  async verifyPayment(paymentId: number | string) {
    return this.request(`/payments/${paymentId}/verify/`, {
      method: "POST",
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  NOTIFICATIONS & REPORTS
  // ═══════════════════════════════════════════════════════════

  async getNotifications() {
    return this.request("/notifications/");
  }

  async getUnreadCount() {
    return this.request("/notifications/unread-count/");
  }

  async getReports() {
    return this.request("/reports/");
  }

  async createReport(payload: {
    asset_id?: number;
    report_type: string;
    title: string;
    parameters?: any;
  }) {
    const { asset_id, ...rest } = payload;
    return this.request("/reports/", {
      method: "POST",
      body: JSON.stringify({ ...rest, asset: asset_id }),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  QUOTATION & JOB LIFECYCLE ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getQuotations() {
    return this.request("/quotations/");
  }

  async getQuotationById(id: number | string) {
    return this.request(`/quotations/${id}/`);
  }

  async createQuotation(payload: {
    booking_id: number;
    notes?: string;
    items: Array<{
      item_type: 'labour' | 'material' | 'other';
      description: string;
      quantity?: number;
      unit?: string;
      unit_price: number;
      supplier?: string;
    }>;
  }) {
    return this.request("/quotations/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async submitQuotation(quotationId: number | string) {
    return this.request(`/quotations/${quotationId}/submit/`, {
      method: "POST",
    });
  }

  async approveQuotation(quotationId: number | string, notes?: string) {
    return this.request(`/quotations/${quotationId}/approve/`, {
      method: "POST",
      body: JSON.stringify({ notes: notes || '' }),
    });
  }

  async rejectQuotation(quotationId: number | string, notes?: string) {
    return this.request(`/quotations/${quotationId}/reject/`, {
      method: "POST",
      body: JSON.stringify({ notes: notes || '' }),
    });
  }

  async getJobSteps(bookingId?: number | string) {
    const endpoint = bookingId
      ? `/job-steps/?booking=${bookingId}`
      : '/job-steps/';
    return this.request(endpoint);
  }

  async startJobStep(stepId: number | string, notes?: string) {
    return this.request(`/job-steps/${stepId}/start-step/`, {
      method: "POST",
      body: JSON.stringify({ notes: notes || '' }),
    });
  }

  async completeJobStep(stepId: number | string, notes?: string) {
    return this.request(`/job-steps/${stepId}/complete-step/`, {
      method: "POST",
      body: JSON.stringify({ notes: notes || '' }),
    });
  }

  async advanceBookingStep(
    bookingId: number | string,
    action: 'confirm' | 'start' | 'complete' | 'cancel' | 'dispute',
  ) {
    return this.request(`/bookings/${bookingId}/${action}/`, {
      method: "POST",
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  WALLET ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getMyWallet() {
    return this.request("/wallets/my-wallet/");
  }

  async holdWalletFunds(
    walletId: number | string,
    amount: number,
    description?: string,
  ) {
    return this.request(`/wallets/${walletId}/hold/`, {
      method: "POST",
      body: JSON.stringify({ amount, description: description || "Escrow hold" }),
    });
  }

  async releaseWalletFunds(
    walletId: number | string,
    amount: number,
    description?: string,
  ) {
    return this.request(`/wallets/${walletId}/release/`, {
      method: "POST",
      body: JSON.stringify({ amount, description: description || "Escrow release" }),
    });
  }

  async getWalletTransactions(walletId: number | string) {
    return this.request(`/wallets/${walletId}/transactions/`);
  }

  // ═══════════════════════════════════════════════════════════
  //  DISPUTE ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getDisputes() {
    return this.request("/disputes/");
  }

  async getDisputeById(id: number | string) {
    return this.request(`/disputes/${id}/`);
  }

  async createDispute(payload: {
    transaction: number;
    booking?: number;
    against?: number;
    dispute_type: string;
    subject: string;
    description: string;
  }) {
    return this.request("/disputes/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async resolveDispute(
    disputeId: number | string,
    resolution: string,
    notes?: string,
    refundAmount?: number,
  ) {
    return this.request(`/disputes/${disputeId}/resolve/`, {
      method: "POST",
      body: JSON.stringify({
        resolution,
        notes: notes || "",
        refund_amount: refundAmount || 0,
      }),
    });
  }

  async addDisputeMessage(
    disputeId: number | string,
    message: string,
    evidenceUrls?: string[],
  ) {
    return this.request(`/disputes/${disputeId}/add-message/`, {
      method: "POST",
      body: JSON.stringify({ message, evidence_urls: evidenceUrls || [] }),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  SUPPLIER ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getSuppliers(params?: { q?: string; category?: number | string }) {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.category !== undefined) query.set("category", String(params.category));
    const qs = query.toString();
    return this.request(qs ? `/suppliers/search/?${qs}` : "/suppliers/");
  }

  async createSupplier(payload: {
    business_name: string;
    description?: string;
    phone_number?: string;
    location?: string;
    categories?: number[];
  }) {
    return this.request("/suppliers/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  MATERIAL VERIFICATION ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getMaterialVerifications() {
    return this.request("/material-verifications/");
  }

  async createMaterialVerification(payload: {
    delivery: number;
    status?: string;
    quantity_accepted?: number;
    quantity_rejected?: number;
    rejection_reason?: string;
    quality_notes?: string;
  }) {
    return this.request("/material-verifications/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async approveMaterialVerification(
    verificationId: number | string,
    quantityAccepted?: number,
    notes?: string,
  ) {
    return this.request(`/material-verifications/${verificationId}/approve/`, {
      method: "POST",
      body: JSON.stringify({
        quantity_accepted: quantityAccepted,
        notes: notes || "",
      }),
    });
  }

  async rejectMaterialVerification(
    verificationId: number | string,
    quantityRejected?: number,
    reason?: string,
    notes?: string,
  ) {
    return this.request(`/material-verifications/${verificationId}/reject/`, {
      method: "POST",
      body: JSON.stringify({
        quantity_rejected: quantityRejected,
        reason: reason || "",
        notes: notes || "",
      }),
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  BANK ACCOUNT & PAYOUT ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getBankAccounts() {
    return this.request("/bank-accounts/");
  }

  async createBankAccount(payload: {
    account_type: "bank" | "mobile_money";
    account_name: string;
    account_number: string;
    bank_code?: string;
    bank_name?: string;
    currency?: string;
  }) {
    return this.request("/bank-accounts/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async setDefaultBankAccount(accountId: number | string) {
    return this.request(`/bank-accounts/${accountId}/set-default/`, {
      method: "POST",
    });
  }

  async getPayouts() {
    return this.request("/payouts/");
  }

  // ═══════════════════════════════════════════════════════════
  //  COST COMPARISON (QUOTED VS ACTUAL) ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async getCostComparisons() {
    return this.request("/cost-comparisons/");
  }

  async recalculateCostComparison(comparisonId: number | string) {
    return this.request(`/cost-comparisons/${comparisonId}/recalculate/`, {
      method: "POST",
    });
  }
}

export const api = new ApiClient();
