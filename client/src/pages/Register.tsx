import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    try {
      await register(username, password);
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fantasy-card p-8 w-full max-w-md">
        <h2 className="fantasy-title text-3xl font-bold mb-6 text-center">
          회원가입
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
            <label className="fantasy-text block text-sm font-medium mb-2">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="fantasy-input w-full px-3 py-2 rounded-md"
              placeholder=""
              required
            />
          </div>
          <button
            type="submit"
            className="fantasy-button w-full text-white py-2 rounded-md transition"
          >
            회원가입
          </button>
        </form>
        <p className="mt-4 text-center text-sm fantasy-text">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="fantasy-title hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

