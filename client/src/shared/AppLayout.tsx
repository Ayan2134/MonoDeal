import { Outlet, NavLink } from 'react-router-dom';
import { SocketProvider } from '../socket/SocketProvider';
import { useSocketStatus } from '../socket/useSocketStatus';
import { DebugOverlay } from './DebugOverlay';

function Shell() {
  const { isConnected } = useSocketStatus();

  return (
    <div className="min-h-screen bg-[#121417] text-white">
      <header className="border-b border-white/10 bg-[#181c20]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NavLink to="/" className="text-xl font-semibold tracking-wide text-white">
            Monodeal
          </NavLink>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <NavLink to="/create" className={({ isActive }) => (isActive ? 'text-brass' : 'hover:text-white')}>
              Create
            </NavLink>
            <NavLink to="/join" className={({ isActive }) => (isActive ? 'text-brass' : 'hover:text-white')}>
              Join
            </NavLink>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
              {isConnected ? 'Online' : 'Connecting'}
            </span>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <Outlet />
      </main>
      <DebugOverlay />
    </div>
  );
}

export function AppLayout() {
  return (
    <SocketProvider>
      <Shell />
    </SocketProvider>
  );
}
