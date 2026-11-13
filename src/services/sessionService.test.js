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

// --- Sign-in service outage (e.g. IDFS blocking the backend): keep the session, don't sign out ---

function status(code) {
    return { ok: false, status: code, statusText: 'Bad Gateway', headers: { get: () => 'application/json' }, json: async () => ({ detail: 'unavailable' }) };
}

test('a 502 from /auth/refresh keeps the session and rejects with AUTH_UNAVAILABLE', async () => {
    saveSession();
    global.fetch = jest.fn(async () => status(502));
    await expect(sessionService.refreshAccessToken()).rejects.toMatchObject({ code: 'AUTH_UNAVAILABLE' });
    expect(JSON.parse(localStorage.getItem(KEY)).refreshToken).toBe('old-refresh');
});

test('a network error during refresh keeps the session', async () => {
    saveSession();
    global.fetch = jest.fn(async () => { throw new TypeError('Failed to fetch'); });
    await expect(sessionService.refreshAccessToken()).rejects.toMatchObject({ code: 'AUTH_UNAVAILABLE' });
    expect(localStorage.getItem(KEY)).not.toBeNull();
});

test('a 400 from /auth/refresh still signs out', async () => {
    saveSession();
    global.fetch = jest.fn(async () => status(400));
    expect(await sessionService.refreshAccessToken()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
});

test('apiClient: outage while the token is still valid keeps using the current token', async () => {
    saveSession(); // expires in 60 s: inside the refresh window but still valid
    const authHeaders = [];
    global.fetch = jest.fn(async (url, opts = {}) => {
        if (String(url).endsWith('/auth/refresh')) return status(502);
        authHeaders.push(opts.headers?.Authorization);
        return json({ ok: true });
    });
    await apiClient.get('/a');
    expect(authHeaders).toEqual(['Bearer old-access']);
    expect(localStorage.getItem(KEY)).not.toBeNull();
});

test('apiClient: outage after the token expired shows the error without signing out', async () => {
    saveSession({ expiresAt: Date.now() - 1000 });
    global.fetch = jest.fn(async (url) => (String(url).endsWith('/auth/refresh') ? status(502) : json({ ok: true })));
    await expect(apiClient.get('/a')).rejects.toMatchObject({
        code: 'AUTH_UNAVAILABLE',
        response: { detail: "The sign-in service isn't available right now. Please try again later." },
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(KEY)).not.toBeNull();
});
