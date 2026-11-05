// Route protection (plan 24 §2.4 R-5) and an automated accessibility scan (axe) of each page.
// The API is mocked: every request returns an empty, successful JSON response.
import { render, screen, cleanup } from '@testing-library/react';
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
    test.each(['/', '/collections', '/files-by-status', '/files-by-cost', '/users', '/profile'])(
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
