import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, API_BASE_URL } from "../services/api";

describe("api client — offline-first cache & auth", () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const mockFetchResponse = (body: unknown, ok = true, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    } as any);
  };

  test("attaches Bearer token and writes GET responses to cache", async () => {
    await api.setTokens("access-123", "refresh-456");
    mockFetchResponse([{ id: 1, name: "Ntinda Unit 1" }]);

    const data = await (api as any).request("/assets/");

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/assets/`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-123",
        }),
      }),
    );
    expect(data).toEqual([{ id: 1, name: "Ntinda Unit 1" }]);

    const cacheKey = `@homebase_os:cache:/assets/`;
    const raw = await AsyncStorage.getItem(cacheKey);
    const cached = JSON.parse(raw as string);
    expect(cached.data).toEqual([{ id: 1, name: "Ntinda Unit 1" }]);
    expect(cached.ts).toBeGreaterThan(0);
  });

  test("falls back to the cached response when the network fails", async () => {
    await AsyncStorage.setItem(
      "@homebase_os:cache:/leases/",
      JSON.stringify({
        data: [{ id: 9, status: "active" }],
        ts: Date.now(),
      }),
    );
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"));

    const data = await (api as any).request("/leases/");
    expect(data).toEqual([{ id: 9, status: "active" }]);
  });

  test("throws the error when offline and no cache exists", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"));

    await expect((api as any).request("/assets/")).rejects.toThrow(
      "Network down",
    );
  });

  test("surfaces a readable backend error message", async () => {
    mockFetchResponse({ detail: "Tenant not found." }, false, 404);

    await expect((api as any).request("/leases/create-by-email/", {
      method: "POST",
      body: "{}",
    })).rejects.toThrow("Tenant not found.");
  });

  test("refreshes the token and retries once on 401", async () => {
    await api.setTokens("stale-token", "refresh-456");

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: "Unauthorized" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ access: "fresh-token" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1 }),
      } as any);

    const data = await (api as any).request("/assets/1/");

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenLastCalledWith(
      `${API_BASE_URL}/assets/1/`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fresh-token",
        }),
      }),
    );
    expect(data).toEqual({ id: 1 });
    expect(api.getAccessToken()).toBe("fresh-token");
  });

  test("clears tokens when the refresh attempt fails", async () => {
    await api.setTokens("stale-token", "refresh-456");

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: "Unauthorized" }),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: "Refresh token invalid" }),
      } as any);

    await expect((api as any).request("/assets/")).rejects.toThrow();
    expect(api.getAccessToken()).toBeNull();
  });
});
