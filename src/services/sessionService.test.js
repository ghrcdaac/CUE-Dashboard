// Token refresh: parallel callers share one refresh call, and a rotated refresh token is kept.
import sessionService from './sessionService';
import apiClient from '../api/apiClient';

const KEY = 'CUE_USER_SESSION';

function saveSession(overrides = {}) {
    localStorage.setItem(KEY, JSON.stringify({
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        idToken: 'id',
        expiresAt: Date.now() + 60 * 1000, // inside apiClient's 3-minute refresh window
        status: 'registered',
        user: { name: 'T' },
        ...overrides,
    }));
}

function json(body, ok = true) {
    return { ok, status: ok ? 200 : 401, statusText: ok ? 'OK' : 'Unauthorized', headers: { get: () => 'application/json' }, json: async () => body };
}

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

beforeEach(() => localStorage.clear());

test('five parallel callers share one refresh call', async () => {
    saveSession();
    let release;
    global.fetch = jest.fn(() => new Promise((resolve) => { release = () => resolve(json({ access_token: 'new-access', expires_in: 300 })); }));

    const calls = Array.from({ length: 5 }, () => sessionService.refreshAccessToken());
    release();
    const tokens = await Promise.all(calls);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual(Array(5).fill('new-access'));
    expect(JSON.parse(localStorage.getItem(KEY)).accessToken).toBe('new-access');
});

test('a later refresh (after the first finished) makes a new call', async () => {
    saveSession();
    global.fetch = jest.fn(async () => json({ access_token: 'a1', expires_in: 300 }));
    await sessionService.refreshAccessToken();
    global.fetch = jest.fn(async () => json({ access_token: 'a2', expires_in: 300 }));
    expect(await sessionService.refreshAccessToken()).toBe('a2');
    expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('a rotated refresh token is stored; without one the old token is kept', async () => {
    saveSession();
    global.fetch = jest.fn(async () => json({ access_token: 'a', expires_in: 300, refresh_token: 'rotated-refresh' }));
    await sessionService.refreshAccessToken();
    expect(JSON.parse(localStorage.getItem(KEY)).refreshToken).toBe('rotated-refresh');

    global.fetch = jest.fn(async () => json({ access_token: 'b', expires_in: 300 }));
    await sessionService.refreshAccessToken();
    expect(JSON.parse(localStorage.getItem(KEY)).refreshToken).toBe('rotated-refresh');
});

test('a failed refresh gives every waiting caller null and clears the session', async () => {
    saveSession();
    global.fetch = jest.fn(async () => json({ detail: 'expired' }, false));
    const tokens = await Promise.all([sessionService.refreshAccessToken(), sessionService.refreshAccessToken()]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual([null, null]);
    expect(localStorage.getItem(KEY)).toBeNull();
});

test('apiClient: five parallel requests with an expiring token trigger one refresh, all use the new token', async () => {
    saveSession();
    const authHeaders = [];
    global.fetch = jest.fn(async (url, opts = {}) => {
        if (String(url).endsWith('/auth/refresh')) return json({ access_token: 'fresh', expires_in: 300 });
        authHeaders.push(opts.headers?.Authorization);
        return json({ ok: true });
    });

    await Promise.all(['/a', '/b', '/c', '/d', '/e'].map((p) => apiClient.get(p)));

    const refreshCalls = global.fetch.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(authHeaders).toEqual(Array(5).fill('Bearer fresh'));
});
