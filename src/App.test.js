// Route protection (plan 24 §2.4 R-5) and an automated accessibility scan (axe) of each page.
// The API is mocked: every request returns an empty, successful JSON response.
import { render, screen, cleanup, fireEvent, within, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import axe from 'axe-core';
import App from './App';
import store from './app/store';
import { logoutSuccess, setLoading } from './app/reducers/authSlice';
import { resetCache } from './app/reducers/dataCacheSlice';

const ALL_PRIVILEGES = [
    'collection:page', 'collection:read', 'collection:create', 'collection:update', 'collection:delete',
    'provider:read', 'provider:create', 'provider:update', 'provider:delete',
    'metrics:read', 'user:page', 'user:read', 'user:assign_role', 'user:delete',
    'egress:read', 'egress:create', 'egress:update', 'egress:delete',
    'application:read', 'application:approve', 'api-key:read', 'api-key:create', 'api-key:update', 'api-key:delete',
];

function registeredSession(privileges = ALL_PRIVILEGES) {
    return {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 60 * 60 * 1000,
        status: 'registered',
        authProvider: 'launchpad',
        user: {
            id: 'u1', name: 'Test User', username: 'tester', email: 'tester@example.com',
            privileges, roles: [], ngroups: [{ id: 'g1', short_name: 'GHRC' }], providers: [],
        },
        active_ngroup_id: 'g1',
    };
}

function tokenOnlySession(status) {
    return { ...registeredSession(), status, user: null, active_ngroup_id: null };
}

const emptyJson = {
    items: [], total: 0, page: 1, page_size: 50, providers: [], users: [], collections: [], egresses: [],
    applications: [], keys: [], api_keys: [], results: [], daily_cost: [], status_counts: [],
};

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

beforeEach(() => {
    localStorage.clear();
    store.dispatch(logoutSuccess());
    store.dispatch(resetCache());
    // Like a fresh page load: auth is "loading" until App's initializeAuth reads the saved session.
    store.dispatch(setLoading(true));
    sessionStorage.clear();
    global.fetch = jest.fn(async (url) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'application/json' },
        // Roles and user applications come back as plain arrays; everything else is a paginated object.
        json: async () => (/\/roles\/?$|user[-_]application/.test(String(url)) ? [] : emptyJson),
    }));
    global.ResizeObserver = global.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
});

afterEach(cleanup);

/** Renders the whole app at `path` with a fresh store and the given saved session. */
function renderAt(path, session) {
    if (session) localStorage.setItem('CUE_USER_SESSION', JSON.stringify(session));
    window.history.pushState({}, '', path);
    return render(<Provider store={store}><App /></Provider>);
}

describe('route protection', () => {
    test.each(['/', '/collections', '/files-by-status', '/files-by-cost', '/users', '/profile', '/sitemap'])(
        'signed-out visitor to %s is sent to the login page', async (path) => {
            renderAt(path, null);
            expect(await screen.findByRole('heading', { level: 1, name: 'Sign In' })).toBeInTheDocument();
            expect(window.location.pathname).toBe('/login');
        });

    test('pending applicant is sent to the pending-approval page', async () => {
        renderAt('/collections', tokenOnlySession('pending_approval'));
        expect(await screen.findByRole('heading', { level: 1, name: 'Application Submitted' })).toBeInTheDocument();
        expect(window.location.pathname).toBe('/pending-approval');
    });

    test('signed-in but unregistered user is sent to the signup page', async () => {
        renderAt('/metrics', tokenOnlySession('unregistered'));
        expect(await screen.findByRole('heading', { level: 1, name: /New User Application/ })).toBeInTheDocument();
        expect(window.location.pathname).toBe('/signup');
    });

    test('registered user without the privilege sees the no-access view', async () => {
        renderAt('/files-by-status', registeredSession(['collection:page']));
        expect(await screen.findByRole('heading', { name: "You don't have access to this page" })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Files by Status' })).not.toBeInTheDocument();
    });

    test('registered user with the privilege sees the page', async () => {
        renderAt('/files-by-status', registeredSession());
        expect(await screen.findByRole('heading', { level: 2, name: 'Files by Status' })).toBeInTheDocument();
    });

    test('a saved registered session without a status field still works', async () => {
        const old = registeredSession();
        delete old.status;
        renderAt('/collections', old);
        expect(await screen.findByRole('heading', { level: 2, name: 'Collections' })).toBeInTheDocument();
    });

    test('Home only shows cards for pages the user may open', async () => {
        renderAt('/', registeredSession(['collection:page', 'metrics:read']));
        expect(await screen.findByRole('heading', { name: 'Collections' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Egress' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Providers' })).not.toBeInTheDocument();
    });
});

describe('site map (WCAG 2.4.5 Multiple Ways)', () => {
    test('the footer links to the site map', async () => {
        renderAt('/', registeredSession());
        await screen.findByRole('heading', { level: 1, name: 'Home' });
        expect(screen.getByRole('link', { name: 'Site map' })).toHaveAttribute('href', '/sitemap');
    });

    test('only pages the user has the privilege for are listed', async () => {
        renderAt('/sitemap', registeredSession(['collection:page', 'metrics:read']));
        await screen.findByRole('heading', { level: 1, name: 'Site map' });
        expect(screen.getByRole('link', { name: 'Collections list' })).toHaveAttribute('href', '/collections');
        expect(screen.getByRole('link', { name: 'Files by status' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Egress paths' })).not.toBeInTheDocument();
        expect(document.title).toBe('CUE - Site map');
    });
});

describe('accessibility scan (axe)', () => {
    // color-contrast needs real layout, so it is checked in the browser instead.
    const axeOptions = { rules: { 'color-contrast': { enabled: false } } };
    const pages = [
        ['/login', null, 'Sign In'],
        ['/', registeredSession(), 'Home'],
        ['/collections', registeredSession(), 'Collections'],
        ['/providers', registeredSession(), 'Providers'],
        ['/users', registeredSession(), 'Users'],
        ['/users/pending-requests', registeredSession(), 'Users'],
        ['/users/spam-requests', registeredSession(), 'Users'],
        ['/daac', registeredSession(), 'DAAC'],
        ['/metrics', registeredSession(), 'Metrics'],
        ['/files-by-status', registeredSession(), 'Metrics'],
        ['/files-by-cost', registeredSession(), 'Metrics'],
        ['/profile', registeredSession(), 'Profile'],
        ['/profile/api-keys', registeredSession(), 'Profile'],
        ['/sitemap', registeredSession(), 'Site map'],
        ['/pending-approval', tokenOnlySession('pending_approval'), 'Application Submitted'],
    ];

    test.each(pages)('%s has no axe violations', async (path, session, h1) => {
        const { container } = renderAt(path, session);
        await screen.findByRole('heading', { level: 1, name: h1 });
        // let pending effects (data loads) settle
        await new Promise((r) => setTimeout(r, 50));
const results = await axe.run(container, axeOptions);
        const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.html.slice(0, 160)).join('\n   ')}`);
        expect(summary).toEqual([]);
    });
});

describe('Collections table with rows', () => {
    test('rows keep table semantics, checkboxes are named, the +N providers are reachable, and axe passes', async () => {
        const collectionsPage = {
            collections: [{
                id: 'c1', short_name: 'goesr_glm_l2', active: true,
                provider: { id: 'p1', name: 'GHRC_PROV' }, egress: { id: 'e1', path: 'ghrc/glm' },
                providers: [
                    { provider_id: 'p1', short_name: 'GHRC_PROV', is_primary: true },
                    { provider_id: 'p2', short_name: 'MSFC_PROV', is_primary: false },
                ],
            }],
            page: 1, page_size: 50, total: 1,
        };
        global.fetch = jest.fn(async (url) => ({
            ok: true, status: 200, statusText: 'OK',
            headers: { get: () => 'application/json' },
            json: async () => (/\/collections\/\?page=/.test(String(url)) ? collectionsPage : emptyJson),
        }));
        const { container } = renderAt('/collections', registeredSession());

        const rowBox = await screen.findByRole('checkbox', { name: 'Select goesr_glm_l2' });
        expect(rowBox.closest('tr')).not.toHaveAttribute('role');
        expect(screen.getByRole('checkbox', { name: 'Select all collections' })).toBeInTheDocument();
        expect(screen.getByRole('table', { name: 'Collections' })).toBeInTheDocument();
        expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
        // "+1" is focusable and screen readers get the full list
        expect(screen.getByText(/more: MSFC_PROV/)).toBeInTheDocument();

        const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
        expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
});

describe('fixes from the UAT test', () => {
    test('Home card numbers are not headings', async () => {
        renderAt('/', registeredSession());
        await screen.findByRole('heading', { level: 1, name: 'Home' });
        const h3 = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
        expect(h3.some((t) => /^\d/.test(t))).toBe(false);
    });

    test('account button is named from the profile (cueusername)', async () => {
        const s = registeredSession();
        delete s.user.username;
        s.user.cueusername = 'tester2';
        renderAt('/', s);
        expect(await screen.findByRole('button', { name: 'Account menu for tester2' })).toBeInTheDocument();
    });

    test('Files by Cost search box and tables are named', async () => {
        renderAt('/files-by-cost', registeredSession());
        await screen.findByRole('heading', { level: 1, name: 'Metrics' });
        expect(await screen.findByRole('textbox', { name: 'Search files by name' })).toBeInTheDocument();
    });
});

describe('signup form and the Launchpad gate (plan 28)', () => {
    const axeOptions = { rules: { 'color-contrast': { enabled: false } } };

    test('provider-only login: account type is locked to Provider, with a note, and axe passes', async () => {
        const { container } = renderAt('/signup', { ...tokenOnlySession('unregistered'), authProvider: 'google', providerOnly: true });
        await screen.findByRole('heading', { level: 1, name: /New User Application/ });
        const accountType = screen.getByRole('combobox', { name: /Account Type/ });
        expect(accountType).toHaveTextContent('Provider');
        expect(accountType).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByText(/sign in with Launchpad/)).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Provider' })).toBeInTheDocument();
        await new Promise((r) => setTimeout(r, 50));
        const results = await axe.run(container, axeOptions);
        expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });

    test('Launchpad login: form unchanged (DAAC selected, not locked)', async () => {
        renderAt('/signup', tokenOnlySession('unregistered'));
        await screen.findByRole('heading', { level: 1, name: /New User Application/ });
        const accountType = screen.getByRole('combobox', { name: /Account Type/ });
        expect(accountType).toHaveTextContent('DAAC');
        expect(accountType).not.toHaveAttribute('aria-disabled');
        expect(screen.queryByText(/sign in with Launchpad/)).not.toBeInTheDocument();
    });
});

describe('switching DAAC reloads the page data', () => {
    const byGroup = {
        g1: [{ id: 'c1', short_name: 'ghrc_collection', active: true, provider: { id: 'p1', name: 'GHRC_PROV' }, egress: { id: 'e1', path: 'ghrc' }, providers: [] }],
        g2: [{ id: 'c2', short_name: 'cue_collection', active: true, provider: { id: 'p2', name: 'CUE_PROV' }, egress: { id: 'e2', path: 'cue' }, providers: [] }],
    };

    test('Collections shows the new DAAC collections, not "No collections found"', async () => {
        const calls = [];
        global.fetch = jest.fn(async (url, options = {}) => {
            const group = (options.headers || {})['X-Active-Ngroup-Id'];
            if (/\/collections\/\?page=/.test(String(url))) calls.push(group);
            const body = /\/collections\/\?page=/.test(String(url))
                ? { collections: byGroup[group] || [], page: 1, page_size: 50, total: (byGroup[group] || []).length }
                : emptyJson;
            return { ok: true, status: 200, statusText: 'OK', headers: { get: () => 'application/json' }, json: async () => body };
        });
        const session = registeredSession();
        session.user.ngroups = [{ id: 'g1', short_name: 'GHRC' }, { id: 'g2', short_name: 'CUE' }];
        renderAt('/collections', session);
        expect(await screen.findByRole('checkbox', { name: 'Select ghrc_collection' })).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Active DAAC group' }));
        fireEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'CUE' }));

        expect(await screen.findByRole('checkbox', { name: 'Select cue_collection' })).toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: 'Select ghrc_collection' })).not.toBeInTheDocument();
        expect(screen.queryByText(/No collections found/i)).not.toBeInTheDocument();
        expect(calls).toEqual(['g1', 'g2']);
    });

    // Every menu must ask the API for the new DAAC's data after a switch.
    // [path, h1, the list request that must be repeated for the new DAAC (or null = any request)]
    test.each([
        ['/daac', 'DAAC', /\/egress\/\?page=/],
        ['/providers', 'Providers', /\/providers\/\?page=/],
        ['/users', 'Users', /\/cueusers\/\?page=/],
        ['/', 'Home', null],
        ['/metrics', 'Metrics', null],
        ['/files-by-status', 'Metrics', null],
        ['/files-by-cost', 'Metrics', null],
        ['/users/pending-requests', 'Users', null],
        ['/profile/api-keys', 'Profile', null],
    ])('%s requests the new DAAC\'s data after a switch', async (path, h1, listUrl) => {
        const calls = [];
        global.fetch = jest.fn(async (url, options = {}) => {
            calls.push({ url: String(url), group: (options.headers || {})['X-Active-Ngroup-Id'] });
            return {
                ok: true, status: 200, statusText: 'OK', headers: { get: () => 'application/json' },
                json: async () => (/\/roles\/?$|user[-_]application/.test(String(url)) ? [] : emptyJson),
            };
        });
        const session = registeredSession();
        session.user.ngroups = [{ id: 'g1', short_name: 'GHRC' }, { id: 'g2', short_name: 'CUE' }];
        renderAt(path, session);
        await screen.findByRole('heading', { level: 1, name: h1 });
        await new Promise((r) => setTimeout(r, 50));

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Active DAAC group' }));
        fireEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'CUE' }));
        await new Promise((r) => setTimeout(r, 100));

        const forNewDaac = calls.filter((c) => c.group === 'g2' && (!listUrl || listUrl.test(c.url)));
        expect(forNewDaac.length).toBeGreaterThan(0);
    });
});

describe('Metrics filter after a DAAC switch', () => {
    test('loads the new DAAC\'s providers, users and collections and drops a provider picked in the old DAAC', async () => {
        const providersBy = { g1: [{ id: 'p1', short_name: 'GHRC_PROV' }], g2: [{ id: 'p2', short_name: 'CUE_PROV' }] };
        const calls = [];
        global.fetch = jest.fn(async (url, options = {}) => {
            const group = (options.headers || {})['X-Active-Ngroup-Id'];
            calls.push({ url: String(url), group });
            let body = emptyJson;
            if (/\/providers\/\?page=/.test(String(url))) body = { providers: providersBy[group] || [], page: 1, page_size: 50, total: 1 };
            return { ok: true, status: 200, statusText: 'OK', headers: { get: () => 'application/json' }, json: async () => body };
        });
        const session = registeredSession();
        session.user.ngroups = [{ id: 'g1', short_name: 'GHRC' }, { id: 'g2', short_name: 'CUE' }];
        renderAt('/metrics', session);
        await screen.findByRole('heading', { level: 1, name: 'Metrics' });

        // pick GHRC_PROV and apply
        fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Provider' }), { key: 'ArrowDown' });
        fireEvent.click(await screen.findByRole('option', { name: 'GHRC_PROV' }));
        const apply = screen.getByRole('button', { name: 'Apply Filters' });
        await waitFor(() => expect(apply).not.toBeDisabled());
        fireEvent.click(apply);
        await waitFor(() => expect(calls.some((c) => /file-metrics/.test(c.url) && /provider_id=p1/.test(c.url))).toBe(true));

        // switch DAAC
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Active DAAC group' }));
        fireEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'CUE' }));

        await waitFor(() => {
            for (const list of [/\/providers\/\?page=/, /\/cueusers\/\?page=/, /\/collections\/\?page=/]) {
                expect(calls.some((c) => c.group === 'g2' && list.test(c.url))).toBe(true);
            }
        });
        await waitFor(() => expect(screen.getByRole('combobox', { name: 'Provider' })).toHaveValue(''));
        const lastMetrics = calls.filter((c) => c.group === 'g2' && /file-metrics/.test(c.url)).pop();
        expect(lastMetrics.url).not.toMatch(/provider_id=p1/);

        fireEvent.keyDown(screen.getByRole('combobox', { name: 'Provider' }), { key: 'ArrowDown' });
        expect(await screen.findByRole('option', { name: 'CUE_PROV' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'GHRC_PROV' })).not.toBeInTheDocument();
    });
});
