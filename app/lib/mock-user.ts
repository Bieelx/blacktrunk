import {useState, useEffect} from 'react';

export type MockUser = {
  name: string;
  kgSupino: number;
  kgAgachamento: number;
};

const DEFAULT_USER: MockUser = {
  name: 'Gabriel Araujo',
  kgSupino: 80,
  kgAgachamento: 130,
};

const STORAGE_KEY = 'bt_mock_user';

export const THRESHOLDS = {
  supino: 100,
  agachamento: 150,
} as const;

export function useMockUser() {
  const [user, setUser] = useState<MockUser>(DEFAULT_USER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored) as MockUser);
    } catch {}
    setLoaded(true);
  }, []);

  function updateUser(updates: Partial<MockUser>) {
    const next = {...user, ...updates};
    setUser(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const unlocked = {
    supino: user.kgSupino >= THRESHOLDS.supino,
    agachamento: user.kgAgachamento >= THRESHOLDS.agachamento,
  };

  return {user, updateUser, unlocked, loaded};
}
