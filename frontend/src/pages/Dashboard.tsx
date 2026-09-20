import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.name}
        </h1>
        <button
          onClick={logout}
          className="text-sm text-gray-600 underline"
        >
          Log out
        </button>
      </div>
      <p className="text-gray-500">Monitors list coming in the next step.</p>
    </div>
  );
}