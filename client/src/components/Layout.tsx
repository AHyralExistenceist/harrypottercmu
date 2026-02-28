import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isCharacterProfile = location.pathname.startsWith('/members/') && location.pathname !== '/members';
  const isMapPage = location.pathname === '/map';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 홈페이지, 캐릭터 프로필 페이지, 지도 페이지에서는 네비게이션 숨김
  if (isHomePage || isCharacterProfile || isMapPage) {
    return <Outlet />;
  }

  // 다른 페이지에서는 네비게이션 표시
  return (
    <div className="min-h-screen overflow-visible">
      <nav className="mx-4 mt-4 mb-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="fantasy-title text-2xl font-bold">
                <img src="/Logo.png" alt="흑백의 기록" className="h-12 object-contain" />
              </Link>
              <div className="flex space-x-4">
                <Link to="/boards" className="fantasy-text hover:text-hogwarts-gold transition">
                  게시판
                </Link>
                <Link to="/members" className="fantasy-text hover:text-hogwarts-gold transition">
                  멤버
                </Link>
                {user && (
                  <>
                    <Link to="/battle" className="fantasy-text hover:text-hogwarts-gold transition">
                      전투
                    </Link>
                    <Link to="/shop" className="fantasy-text hover:text-hogwarts-gold transition">
                      상점
                    </Link>
                    <Link to="/quests" className="fantasy-text hover:text-hogwarts-gold transition">
                      퀘스트
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin/characters" className="fantasy-text hover:text-hogwarts-gold transition" style={{ color: 'rgba(223,190,106,0.8)' }}>
                        관리
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="fantasy-text text-sm">{user.username}</span>
                  {user.character && (
                    <span className="fantasy-title text-sm">
                      ({user.character.displayName || user.character.name})
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="fantasy-button px-4 py-2 text-white rounded transition"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="fantasy-button px-4 py-2 text-white rounded transition"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="fantasy-button px-4 py-2 text-white rounded transition"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
