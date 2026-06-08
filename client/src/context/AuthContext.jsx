import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.defaults.headers.common['Authorization'] =
        `Bearer ${token}`;

      axios.get('/api/users/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];

          const guestUser = sessionStorage.getItem('guestUser');
          if (guestUser) {
            setUser(JSON.parse(guestUser));
          }
        })
        .finally(() => {
          setLoading(false);
        });

    } else {
      const guestUser = sessionStorage.getItem('guestUser');
      if (guestUser) {
        setUser(JSON.parse(guestUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
  };

  const loginAsGuest = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];

    const savedGuest = sessionStorage.getItem('guestUser');

    if (savedGuest) {
      const guestUser = JSON.parse(savedGuest);
      setUser(guestUser);
      return guestUser;
    }

    const guestUser = {
      id: crypto.randomUUID(),
      username: `Guest_${Math.floor(Math.random() * 9000) + 1000}`,
      isGuest: true,
      goldCoins: 0,
      diamonds: 0,
    };

    sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
    setUser(guestUser);

    return guestUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('guestUser');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, loginAsGuest, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
