import { Outlet, NavLink } from 'react-router-dom';
import { SocketProvider } from '../socket/SocketProvider';
import { useSocketStatus } from '../socket/useSocketStatus';
import { DebugOverlay } from './DebugOverlay';

function Shell() {
  const { isConnected } = useSocketStatus();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#121417] text-white">
      <header className="border-b border-white/10 bg-[#181c20] safe-pt">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
          <NavLink to="/" className="text-lg font-semibold tracking-wide text-white md:text-xl">
            Monodeal
          </NavLink>
          <div className="flex items-center gap-3 text-sm text-white/70 md:gap-4">
            <NavLink to="/create" className={({ isActive }) => (isActive ? 'text-brass' : 'hover:text-white')}>
              Create
            </NavLink>
            <NavLink to="/join" className={({ isActive }) => (isActive ? 'text-brass' : 'hover:text-white')}>
              Join
            </NavLink>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] md:px-3 md:text-xs">
              {isConnected ? 'Online' : 'Connecting'}
            </span>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-5 md:py-10">
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
