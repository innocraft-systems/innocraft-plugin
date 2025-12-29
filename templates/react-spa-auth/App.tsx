/**
 * React SPA App with Neon Auth Routes
 *
 * File: src/App.tsx
 */

import { Routes, Route, useParams, Link } from 'react-router-dom';
import {
  AuthView,
  AccountView,
  SignedIn,
  SignedOut,
  UserButton,
  RedirectToSignIn,
} from '@neondatabase/neon-js/auth/react/ui';

// Home page with auth state handling
function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      gap: '2rem',
    }}>
      <SignedIn>
        <div style={{ textAlign: 'center' }}>
          <h1>Welcome!</h1>
          <p>You're successfully authenticated.</p>
          <div style={{ marginTop: '1rem' }}>
            <UserButton />
          </div>
          <nav style={{ marginTop: '2rem' }}>
            <Link to="/dashboard">Go to Dashboard</Link>
          </nav>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}

// Auth pages (sign-in, sign-up, etc.)
function Auth() {
  const { pathname } = useParams();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem 1rem',
    }}>
      <AuthView pathname={pathname} />
    </div>
  );
}

// Account management pages
function Account() {
  const { pathname } = useParams();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem 1rem',
    }}>
      <AccountView pathname={pathname} />
    </div>
  );
}

// Protected dashboard page
function Dashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <SignedIn>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <h1>Dashboard</h1>
          <UserButton />
        </header>
        <main>
          <p>This is a protected page. Only authenticated users can see this.</p>
        </main>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/:pathname" element={<Auth />} />
      <Route path="/account/:pathname" element={<Account />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
