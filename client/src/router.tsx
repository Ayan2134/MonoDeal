import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './shared/AppLayout';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { HomePage } from './pages/HomePage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { LobbyPage } from './pages/LobbyPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'create', element: <CreateRoomPage /> },
      { path: 'join', element: <JoinRoomPage /> },
      { path: 'room/:roomCode', element: <JoinRoomPage /> },
      { path: 'lobby/:roomId', element: <LobbyPage /> },
    ],
  },
]);
