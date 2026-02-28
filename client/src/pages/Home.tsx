import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

const Home = () => {
  const { user, logout } = useAuth();
  const [hoverStates, setHoverStates] = useState<Record<string, { x: number; y: number } | null>>({});
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [quotePosition, setQuotePosition] = useState<{ x: number; y: number } | null>(null);
  const [quoteFadingOut, setQuoteFadingOut] = useState(false);
  const [quoteSlidingIn, setQuoteSlidingIn] = useState(false);
  const [quoteTimeoutId, setQuoteTimeoutId] = useState<number | null>(null);

  const handleLogout = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      logout();
      setIsFadingOut(false);
    }, 500);
  };

  const handleMouseMove = (id: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverStates(prev => ({ ...prev, [id]: { x, y } }));
  };

  const handleMouseLeave = (id: string) => {
    setHoverStates(prev => ({ ...prev, [id]: null }));
  };

  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [clickEffects, setClickEffects] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    let particleIdCounter = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const newParticle = {
        id: particleIdCounter++,
        x: e.clientX,
        y: e.clientY,
      };
      setParticles(prev => [...prev, newParticle]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let clickIdCounter = 0;
    const handleClick = (e: MouseEvent) => {
      const newClick = {
        id: clickIdCounter++,
        x: e.clientX,
        y: e.clientY,
      };
      setClickEffects(prev => [...prev, newClick]);
      setTimeout(() => {
        setClickEffects(prev => prev.filter(c => c.id !== newClick.id));
      }, 600);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    // ✅ 페이지 길이(스크롤) + 배경(성) 적용
    <div className="relative min-h-[3000px] overflow-x-hidden overflow-y-visible">
      {/* 마우스 파티클 */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '4px',
            height: '4px',
            background: '#D4AF37',
            borderRadius: '50%',
            boxShadow: '0 0 8px #D4AF37, 0 0 12px #FFD700',
            animation: 'particleFade 1s ease-out forwards',
          }}
        />
      ))}
      {/* 클릭 리플 이펙트 */}
      {clickEffects.map((click) => (
        <div
          key={click.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${click.x}px`,
            top: `${click.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '0px',
            height: '0px',
            border: '2px solid #D4AF37',
            borderRadius: '50%',
            animation: 'rippleEffect 0.6s ease-out forwards',
          }}
        />
      ))}
      {/* ✅ "무대(stage)" */}
      <div className="relative mx-auto w-full max-w-[1280px] px-8 pt-6 pb-40">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-end">
          {/* 로고 */}
          <div className="flex items-end mt-8 -translate-x-12">
            <img
              src="/Logo.png"
              alt="흑백의 기록"
              className="object-contain"
              style={{ border: 'none', height: '300px' }}
            />
          </div>

          {/* 우측 상단 컨트롤 */}
          <div className="flex flex-col items-end gap-2 pb-2">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="fantasy-text text-sm">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="fantasy-text text-sm hover:text-hogwarts-gold transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/register" className="fantasy-text text-sm hover:text-hogwarts-gold transition">
                  회원가입
                </Link>
                <Link to="/login" className="fantasy-text text-sm hover:text-hogwarts-gold transition">
                  로그인
                </Link>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="relative flex items-center">
                <img
                  src="/galleon.png"
                  alt="갈레온"
                  className="h-[40px] w-auto object-contain flex-shrink-0"
                  style={{ border: 'none' }}
                />
                {user?.character && (
                  <span className="absolute left-[95px] fantasy-text text-lg whitespace-nowrap" style={{ color: '#FFFFFF', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)', transform: 'translateY(-1px)' }}>
                    {user.character.galleon?.toLocaleString() || '0'} galleon
                  </span>
                )}
              </div>
              <img src="/notice.png" alt="알림" className="h-7 w-7 object-contain cursor-pointer hover:opacity-80 transition" style={{ border: 'none' }} />
              <Link to="/shop">
                <img src="/shop.png" alt="상점" className="h-7 w-7 object-contain cursor-pointer hover:opacity-80 transition" style={{ border: 'none' }} />
              </Link>
              <img src="/settings.png" alt="설정" className="h-7 w-7 object-contain cursor-pointer hover:opacity-80 transition" style={{ border: 'none' }} />
            </div>
          </div>
        </div>

        {/* 메인 */}
        <div className="grid grid-cols-[220px_1fr_320px] gap-10 pt-8">
          {/* 왼쪽 네비 */}
          <div className="pt-16 space-y-3 -translate-x-32">
            <Link to="/boards?type=NOTICE" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2.5rem' }}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">공지사항</span>
            </Link>
            <Link to="/boards?type=WORLDVIEW" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2.5rem' }}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">세계관</span>
            </Link>
            <Link to="/boards?type=SYSTEM" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2.5rem' }}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">시스템</span>
            </Link>
            <Link to="/quests" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2rem', marginTop: '2rem' }}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">Quest</span>
            </Link>
            <Link to="/battles" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2rem' }}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">Battle</span>
            </Link>
            <Link to="/map" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2rem' }}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">Map</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/characters" className="block fantasy-text hover:text-hogwarts-gold transition py-1" style={{ fontSize: '2rem', marginTop: '2rem', color: 'rgba(223,190,106,0.8)' }}>
                <span className="inline-block hover:scale-110 transition-transform duration-300">관리</span>
              </Link>
            )}
          </div>

          {/* 중앙 캐릭터 */}
          <div className="relative flex items-start justify-center pt-6">
            <div 
              className="relative w-full group cursor-pointer" 
              style={{ maxWidth: '1000px' }}
              onClick={(e) => {
                if (user?.character?.quote) {
                  if (quoteTimeoutId) {
                    clearTimeout(quoteTimeoutId);
                    setQuoteTimeoutId(null);
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  setQuotePosition({ x, y });
                  setQuoteFadingOut(false);
                  setQuoteSlidingIn(false);
                  setShowQuote(false);
                  setTimeout(() => {
                    setShowQuote(true);
                    setTimeout(() => {
                      setQuoteSlidingIn(true);
                    }, 10);
                  }, 10);
                  const timeoutId = window.setTimeout(() => {
                    setQuoteFadingOut(true);
                    setTimeout(() => {
                      setShowQuote(false);
                      setQuotePosition(null);
                      setQuoteFadingOut(false);
                      setQuoteSlidingIn(false);
                      setQuoteTimeoutId(null);
                    }, 500);
                  }, 4500);
                  setQuoteTimeoutId(timeoutId);
                }
              }}
              onMouseLeave={() => {
                if (showQuote && quoteTimeoutId !== null) {
                  window.clearTimeout(quoteTimeoutId);
                  setQuoteTimeoutId(null);
                  setQuoteFadingOut(true);
                  setTimeout(() => {
                    setShowQuote(false);
                    setQuotePosition(null);
                    setQuoteFadingOut(false);
                    setQuoteSlidingIn(false);
                  }, 300);
                }
              }}
            >
              <div className="relative w-full" style={{ aspectRatio: '3/4', minHeight: '1100px' }}>
                {/* light - 항상 표시 (z-0) */}
                <img
                  src="/light.png"
                  alt="Light"
                  className="pointer-events-none absolute z-0 object-contain drop-shadow-2xl max-w-none translate-x-[-230px] translate-y-[200px] scale-[1.35] origin-bottom"
                  style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                  }}
                />
                {user?.character?.portraitImage ? (() => {
                  const getFileNameFromPath = (path: string | null | undefined) => {
                    if (!path) return '';
                    const match = path.match(/\/([^\/]+)\.(png|jpg|jpeg)$/);
                    if (match) return match[1];
                    const fileNameMatch = path.match(/^([^\/\.]+)(?:\.(png|jpg|jpeg))?$/);
                    if (fileNameMatch) return fileNameMatch[1];
                    return '';
                  };
                  const fileName = getFileNameFromPath(user.character.portraitImage);
                  const portraitPath = fileName ? `/${fileName}.png` : user.character.portraitImage;
                  const bgPath = fileName ? `/${fileName}_bg.png` : user.character.portraitImage.replace(/\.png$/, '_bg.png');
                  
                  return (
                    <>
                      {/* portrait_n_bg - 중간 (z-10) */}
                      <img
                        src={bgPath}
                        alt={`${user.character.displayName || user.character.name || 'Character'} Background`}
                        className="pointer-events-none absolute z-10 object-contain drop-shadow-2xl max-w-none translate-x-[-230px] translate-y-[200px] scale-[1.35] origin-bottom transition-all duration-500 ease-out group-hover:translate-x-[-225px] group-hover:translate-y-[205px]"
                        style={{
                          border: 'none',
                          width: '100%',
                          height: '100%',
                          opacity: isFadingOut ? 0 : 1,
                        }}
                        onError={() => {
                          console.log('Background image failed to load:', bgPath);
                        }}
                      />
                      {/* portrait_n - 맨 위 (z-20) */}
                      <img
                        src={portraitPath}
                        alt={user.character.displayName || user.character.name || 'Character'}
                        className="pointer-events-none absolute z-20 object-contain drop-shadow-2xl max-w-none transition-all duration-500 ease-out translate-x-[-230px] translate-y-[200px] scale-[1.35] group-hover:scale-[1.37] origin-bottom"
                        style={{
                          border: 'none',
                          width: '100%',
                          height: '100%',
                          opacity: isFadingOut ? 0 : 1,
                        }}
                        onError={() => {
                          console.log('Portrait image failed to load:', portraitPath);
                        }}
                      />
                    {/* 한마디 오버레이 (클릭 시 표시) */}
                    {showQuote && user.character.quote && quotePosition && (
                      <div 
                        className="pointer-events-none absolute z-40"
                        style={{
                          left: `${quotePosition.x}px`,
                          top: `${quotePosition.y}px`,
                          transform: quoteSlidingIn ? 'translateY(-50%)' : 'translate(-50px, -50%)',
                          width: '500px',
                          opacity: quoteFadingOut ? 0 : (quoteSlidingIn ? 1 : 0),
                          transition: `opacity ${quoteFadingOut ? '500ms' : (quoteSlidingIn ? '200ms' : '0ms')} ease-in-out, transform ${quoteFadingOut ? '500ms' : (quoteSlidingIn ? '300ms' : '0ms')} ease-out`
                        }}
                      >
                        <div 
                          className="px-8 py-4 relative"
                          style={{ 
                            background: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.7) 15%, rgba(0, 0, 0, 0.7) 85%, transparent 100%)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '999px'
                          }}
                        >
                          <div 
                            style={{
                              position: 'absolute',
                              top: '8px',
                              left: 0,
                              right: 0,
                              height: '2px',
                              background: 'linear-gradient(to right, transparent 0%, #F5E6D3 15%, #F5E6D3 85%, transparent 100%)'
                            }}
                          />
                          <p 
                            className="fantasy-text text-base leading-relaxed text-center whitespace-pre-wrap"
                            style={{ 
                              color: '#F5E6D3',
                              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
                              lineHeight: '1.8'
                            }}
                          >
                            &ldquo;{user.character.quote}&rdquo;
                          </p>
                          <div 
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: 0,
                              right: 0,
                              height: '2px',
                              background: 'linear-gradient(to right, transparent 0%, #F5E6D3 15%, #F5E6D3 85%, transparent 100%)'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {/* 캐릭터 정보 오버레이 (hover 시 표시) */}
                    <div className="pointer-events-none absolute z-30 top-20 left-[420px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                      <div className="fantasy-text space-y-2" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)' }}>
                        {user.character.catchphrase && (
                          <div className="text-base whitespace-nowrap slide-in-delay-1" style={{ color: '#D4AF37', transform: 'translateX(-1.5rem)', opacity: 0 }}>
                            [{user.character.catchphrase}]
                          </div>
                        )}
                        <div>
                          <div className="text-2xl whitespace-nowrap slide-in-delay-2" style={{ color: '#F5E6D3', transform: 'translateX(1.5rem)', opacity: 0 }}>
                            {user.character.displayName || user.character.name}
                          </div>
                        </div>
                        {user.character.personalityKeywords && (() => {
                          try {
                            const keywords = typeof user.character.personalityKeywords === 'string' 
                              ? JSON.parse(user.character.personalityKeywords)
                              : user.character.personalityKeywords;
                            if (Array.isArray(keywords) && keywords.length > 0) {
                              return (
                                <div className="space-y-1 slide-in-delay-3 mt-2" style={{ transform: 'translateX(1.5rem)', opacity: 0 }}>
                                  {keywords.map((keyword: string, index: number) => (
                                    <div key={index} className="text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                      - {keyword}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    </>
                  );
                })() : (
                  /* 로그아웃 상태 - portrait_0 (light는 위에서 이미 표시됨) */
                  <img
                    src="/portrait_0.png"
                    alt="Character"
                    className="pointer-events-none absolute z-20 object-contain drop-shadow-2xl max-w-none transition-transform duration-500 ease-out translate-x-[-230px] translate-y-[200px] scale-[1.35] origin-bottom"
                    style={{
                      border: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 패널 */}
          <div className="pt-16 flex flex-col items-end">
            <div className="-translate-x-28">
            <div className="flex items-start gap-5 mb-5">
              <Link 
                to="/members" 
                className="panel-button-hover flex-shrink-0 cursor-pointer relative transition-transform duration-150 active:scale-95" 
                style={{ width: '50%' }}
                onMouseMove={(e) => handleMouseMove('member', e)}
                onMouseLeave={() => handleMouseLeave('member')}
              >
                {hoverStates.member && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: `radial-gradient(circle 200px at ${hoverStates.member.x}px ${hoverStates.member.y}px, rgba(255, 165, 0, 0.4), transparent 70%)`,
                      mixBlendMode: 'color',
                    }}
                  />
                )}
                <img src="/member.png" alt="멤버란" className="w-full h-auto object-contain relative" style={{ border: 'none' }} />
              </Link>

              <div className="flex flex-col space-y-5" style={{ width: '50%' }}>
                <Link 
                  to="/boards?type=QNA" 
                  className="panel-button-hover block cursor-pointer relative transition-transform duration-150 active:scale-95"
                  onMouseMove={(e) => handleMouseMove('qna', e)}
                  onMouseLeave={() => handleMouseLeave('qna')}
                >
                  {hoverStates.qna && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        background: `radial-gradient(circle 200px at ${hoverStates.qna.x}px ${hoverStates.qna.y}px, rgba(255, 165, 0, 0.4), transparent 70%)`,
                        mixBlendMode: 'color',
                      }}
                    />
                  )}
                  <img src="/QnA.png" alt="QnA" className="w-full h-auto object-contain relative" style={{ border: 'none' }} />
                </Link>

                <Link 
                  to={user ? "/members" : "/login"} 
                  className="panel-button-hover block cursor-pointer relative transition-transform duration-150 active:scale-95"
                  onMouseMove={(e) => handleMouseMove('mypage', e)}
                  onMouseLeave={() => handleMouseLeave('mypage')}
                >
                  {hoverStates.mypage && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        background: `radial-gradient(circle 200px at ${hoverStates.mypage.x}px ${hoverStates.mypage.y}px, rgba(255, 165, 0, 0.4), transparent 70%)`,
                        mixBlendMode: 'color',
                      }}
                    />
                  )}
                  <img src="/mypage.png" alt="My Page" className="w-full h-auto object-contain relative" style={{ border: 'none' }} />
                </Link>
              </div>
            </div>

            <Link 
              to="/boards?type=EVENT" 
              className="panel-button-hover block cursor-pointer relative transition-transform duration-150 active:scale-95"
              onMouseMove={(e) => handleMouseMove('event', e)}
              onMouseLeave={() => handleMouseLeave('event')}
            >
              {hoverStates.event && (
                <div 
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: `radial-gradient(circle 200px at ${hoverStates.event.x}px ${hoverStates.event.y}px, rgba(255, 165, 0, 0.4), transparent 70%)`,
                    mixBlendMode: 'color',
                  }}
                />
              )}
              <img src="/event.png" alt="이벤트" className="relative" style={{ border: 'none' }} />
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

