import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fantasy-card p-8 w-full max-w-md">
        <h2 className="fantasy-title text-3xl font-bold mb-6 text-center">
          로그인
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-70 border-2 border-red-600 text-red-200 rounded fantasy-text">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="fantasy-text block text-sm font-medium mb-2">사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="fantasy-input w-full px-3 py-2 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="fantasy-text block text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fantasy-input w-full px-3 py-2 rounded-md"
              placeholder=""
              required
            />
          </div>
          <div className="mb-6">
            <label className="fantasy-text flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm">로그인 유지</span>
            </label>
          </div>
          <button
            type="submit"
            className="fantasy-button w-full text-white py-2 rounded-md transition"
          >
            로그인
          </button>
        </form>
        <p className="mt-4 text-center text-sm fantasy-text">
          계정이 없으신가요?{' '}
          <Link to="/register" className="fantasy-title hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

