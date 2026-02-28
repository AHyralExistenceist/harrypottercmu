import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Character {
  id: string;
  name: string;
  displayName?: string;
  profileImage?: string;
  portraitImage?: string;
  description?: string;
  background?: string;
  quote?: string;
  catchphrase?: string;
  personalityKeywords?: string | null;
  defaultSlot?: number | null;
  attack: number;
  defense: number;
  agility: number;
  luck: number;
  hp: number;
  maxHp: number;
  gender?: string;
  user: {
    username: string;
  };
  equippedItems: Array<{
    item: {
      id: string;
      name: string;
      type: string;
      imageUrl?: string;
    };
  }>;
  relationships: Array<{
    id: string;
    characterB: {
      id: string;
      name: string;
      displayName?: string;
      profileImage?: string;
      portraitImage?: string;
    };
    relationship: string;
    description?: string;
  }>;
  relationships2: Array<{
    id: string;
    characterA: {
      id: string;
      name: string;
      displayName?: string;
      profileImage?: string;
      portraitImage?: string;
    };
    relationship: string;
    description?: string;
  }>;
}

const CharacterProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'프로필' | '아이템' | '관계'>('프로필');
  const isAdmin = user?.role === 'admin';
  const [isSliding, setIsSliding] = useState(false);
  const [prevSlot, setPrevSlot] = useState<number | null>(null);
                            const [currentRelationshipIndex, setCurrentRelationshipIndex] = useState(0);
                            const [dragStartX, setDragStartX] = useState<number | null>(null);
                            const [dragOffset, setDragOffset] = useState(0);
                            const [isDragging, setIsDragging] = useState(false);
                            const [showDescriptionView, setShowDescriptionView] = useState(false);
                            const [selectedDescriptionIndex, setSelectedDescriptionIndex] = useState<number | null>(null);
                            const [isScrolling, setIsScrolling] = useState(false);
                            const [scrollStartY, setScrollStartY] = useState(0);
                            const [scrollStartScrollTop, setScrollStartScrollTop] = useState(0);
                            const [descriptionFadeIn, setDescriptionFadeIn] = useState(false);
                            const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchCharacter(id);
    }
  }, [id]);
  
  useEffect(() => {
    setCurrentRelationshipIndex(0);
    setShowDescriptionView(false);
    setSelectedDescriptionIndex(null);
  }, [character?.id]);
  
  useEffect(() => {
    if (!showDescriptionView || selectedDescriptionIndex === null) return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setDescriptionFadeIn(true);
        if (descriptionRef.current) descriptionRef.current.scrollTop = 0;
      });
      (window as any).__relFadeRaf2 = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      const raf2 = (window as any).__relFadeRaf2;
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [showDescriptionView, selectedDescriptionIndex]);

  const fetchCharacter = async (characterId: string) => {
    try {
      const response = await api.get(`/characters/${characterId}`);
      setCharacter(response.data);
      setIsSliding(true);
      setPrevSlot(null);
      setTimeout(() => {
        if (response.data.defaultSlot) {
          setSelectedSlot(response.data.defaultSlot);
        } else {
          setSelectedSlot(null);
        }
        setTimeout(() => {
          setIsSliding(false);
        }, 200);
      }, 50);
    } catch (error) {
      console.error('Error fetching character:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultSlot = async (slotNumber: number) => {
    if (!character || !isAdmin) return;
    try {
      const response = await api.put(`/characters/${character.id}`, { defaultSlot: slotNumber });
      setCharacter({ ...character, defaultSlot: response.data.defaultSlot });
    } catch (error) {
      console.error('Error setting default slot:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 fantasy-text">Loading...</div>;
  }

  if (!character) {
    return <div className="text-center py-8 fantasy-text">캐릭터를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundImage: 'url(/profile_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', paddingLeft: '10rem', paddingRight: '0' }}>
      <div className="absolute top-0 left-0 pt-8 pl-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="fantasy-text text-lg hover:text-hogwarts-gold transition flex items-center"
        >
          ← 뒤로
        </button>
      </div>
      <div className="flex items-start relative w-full flex-1" style={{ marginTop: 0 }}>
        <div className="flex flex-col relative" style={{ flexShrink: 0, alignSelf: 'center', zIndex: 50, gap: 'clamp(8px, 1vw, 16px)', marginRight: 'clamp(4px, 1vw, 24px)' }}>
          {[1, 2, 3, 4].map((num) => {
            const getFileNameFromPath = (path: string | null | undefined) => {
              if (!path) return '';
              const match = path.match(/\/([^\/]+)\.(png|jpg|jpeg)$/);
              if (match) return match[1];
              const fileNameMatch = path.match(/^([^\/\.]+)(?:\.(png|jpg|jpeg))?$/);
              if (fileNameMatch) return fileNameMatch[1];
              return '';
            };
            const baseFileName = getFileNameFromPath(character?.portraitImage) || 'portrait';
            return (
            <div key={num} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectedSlot !== num) {
                    setPrevSlot(selectedSlot);
                    setIsSliding(true);
                    setTimeout(() => {
                      setSelectedSlot(num);
                      setTimeout(() => {
                        setIsSliding(false);
                        setPrevSlot(null);
                      }, 200);
                    }, 50);
                  }
                }}
                className="relative cursor-pointer"
                style={{
                  width: 'clamp(50px, 6vw, 80px)',
                  height: 'clamp(50px, 6vw, 80px)',
                  flexShrink: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: selectedSlot === num ? '2px solid rgba(245, 230, 211, 0.8)' : '2px solid rgba(245, 230, 211, 0.3)',
                  borderRadius: '4px',
                  padding: '4px'
                }}
              >
              <img
                src={`/profile/${baseFileName}_${num}_bg.png`}
                alt=""
                className="pointer-events-none absolute inset-0 z-10 object-contain w-full h-full"
                style={{
                  border: 'none',
                  padding: '4px'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <img
                src={`/profile/${baseFileName}_${num}.png`}
                alt=""
                className="pointer-events-none absolute inset-0 z-20 object-contain w-full h-full"
                style={{
                  border: 'none',
                  padding: '4px'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSetDefaultSlot(num);
                  }}
                  className="absolute -right-2 -top-2 w-5 h-5 rounded-full flex items-center justify-center text-xs z-30"
                  style={{
                    background: character?.defaultSlot === num ? 'rgba(245, 230, 211, 0.9)' : 'rgba(245, 230, 211, 0.5)',
                    color: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(245, 230, 211, 0.8)',
                    cursor: 'pointer'
                  }}
                  title={character?.defaultSlot === num ? '기본 슬롯으로 설정됨' : '기본 슬롯으로 설정'}
                >
                  {character?.defaultSlot === num ? '★' : '☆'}
                </button>
              )}
            </div>
            );
          })}
        </div>
        {character.portraitImage || selectedSlot ? (() => {
          let portraitPath: string;
          let bgPath: string;
          
          const getFileNameFromPath = (path: string | null | undefined) => {
            if (!path) return '';
            const match = path.match(/\/([^\/]+)\.(png|jpg|jpeg)$/);
            if (match) return match[1];
            const fileNameMatch = path.match(/^([^\/\.]+)(?:\.(png|jpg|jpeg))?$/);
            if (fileNameMatch) return fileNameMatch[1];
            return '';
          };
          
          if (selectedSlot) {
            const baseFileName = getFileNameFromPath(character.portraitImage) || 'portrait';
            portraitPath = `/profile/${baseFileName}_${selectedSlot}.png`;
            bgPath = `/profile/${baseFileName}_${selectedSlot}_bg.png`;
          } else {
            const fileName = getFileNameFromPath(character.portraitImage!);
            portraitPath = fileName ? `/profile/${fileName}.png` : character.portraitImage!;
            bgPath = fileName ? `/profile/${fileName}_bg.png` : character.portraitImage!.replace(/\.png$/, '_bg.png');
          }
          
          return (
            <>
              <div className="relative h-full flex items-end justify-center overflow-hidden" style={{ transform: 'translateX(-10%)', flexShrink: 1, minWidth: '200px', pointerEvents: 'none' }}>
                <img
                  key={`bg-${selectedSlot || 'default'}`}
                  src={bgPath}
                  alt={`${character.displayName || character.name} Background`}
                  className="pointer-events-none relative z-10 object-contain"
                  style={{
                    border: 'none',
                    maxHeight: '100%',
                    width: '100%',
                    height: 'auto',
                    transform: isSliding && prevSlot !== null ? 'translateX(-30px)' : isSliding && prevSlot === null ? 'translateX(30px)' : 'translateX(0)',
                    opacity: isSliding && prevSlot !== null ? 0 : isSliding && prevSlot === null ? 0 : 1,
                    transition: 'transform 0.4s ease-out, opacity 0.2s ease-out'
                  }}
                />
                <img
                  key={`portrait-${selectedSlot || 'default'}`}
                  src={portraitPath}
                  alt={character.displayName || character.name}
                  className="pointer-events-none absolute z-20 object-contain"
                  style={{
                    border: 'none',
                    bottom: 0,
                    maxHeight: '100%',
                    width: '100%',
                    height: 'auto',
                    transform: isSliding && prevSlot !== null ? 'translateX(-30px)' : isSliding && prevSlot === null ? 'translateX(30px)' : 'translateX(0)',
                    opacity: isSliding && prevSlot !== null ? 0 : isSliding && prevSlot === null ? 0 : 1,
                    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out'
                  }}
                />
              </div>
              <div className="flex flex-col items-start justify-start flex-1" style={{ height: '100%', minWidth: '300px' }}>
                <div
                  className="w-full h-full flex flex-col"
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(223, 190, 106, 0.3)'
                  }}
                >
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-8 pb-4 pt-16 overflow-y-auto flex-1" style={{ position: 'relative' }}>
                      {character.personalityKeywords && (() => {
                        try {
                          const keywords = typeof character.personalityKeywords === 'string'
                            ? JSON.parse(character.personalityKeywords)
                            : character.personalityKeywords;
                          if (Array.isArray(keywords) && keywords.length > 0) {
                            return (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                  {keywords.map((keyword: string, index: number) => (
                                    <span key={index} style={{ color: '#F5E6D3', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)' }}>
                                      #{keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })()}
                      <div className="mb-6">
                        <h1 className="font-bold" style={{ color: '#F5E6D3', fontFamily: "'HeirofLight', 'Cinzel', 'MedievalSharp', serif", fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                          {character.displayName || character.name}
                        </h1>
                      </div>
                      {character.catchphrase && (
                        <div className="mb-3">
                          <p className="mb-2" style={{ color: '#F5E6D3', fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>캐치프라이즈</p>
                          <div className="h-px mb-3" style={{ background: 'rgba(245, 230, 211, 0.3)' }}></div>
                        </div>
                      )}
                      {character.quote && (
                        <div className="mb-4">
                          <p style={{ color: '#F5E6D3', fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>
                            &ldquo;{character.quote}&rdquo;
                          </p>
                          <div className="h-px mt-3" style={{ background: 'rgba(223, 190, 106, 0.3)' }}></div>
                        </div>
                      )}
                      <div className="flex border-t mb-4 mt-40" style={{ borderColor: 'rgba(245, 230, 211, 0.3)', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        {(['프로필', '아이템', '관계'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="fantasy-text"
                            style={{
                              background: activeTab === tab ? 'rgba(245, 230, 211, 0.1)' : 'transparent',
                              borderBottom: activeTab === tab ? '2px solid rgba(245, 230, 211, 0.8)' : '2px solid transparent',
                              color: activeTab === tab ? '#F5E6D3' : 'rgba(245, 230, 211, 0.6)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 2vw, 24px)',
                              fontSize: 'clamp(0.75rem, 1.5vw, 1rem)',
                              flexShrink: 0,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      {activeTab === '프로필' && (
                        <div className="fantasy-text mt-4" style={{ color: 'rgba(245, 230, 211, 0.9)' }}>
                          {character.description && (
                            <div className="mb-6">
                              <h3 className="mb-3" style={{ color: '#F5E6D3', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>설명</h3>
                              <p className="whitespace-pre-wrap" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', color: '#F5E6D3' }}>{character.description}</p>
                            </div>
                          )}
                          {character.background && (
                            <div className="mb-6">
                              <h3 className="mb-3" style={{ color: '#F5E6D3', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>배경</h3>
                              <p className="whitespace-pre-wrap" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', color: '#F5E6D3' }}>{character.background}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {activeTab === '아이템' && (
                        <div className="fantasy-text mt-4" style={{ color: 'rgba(245, 230, 211, 0.9)' }}>
                          <h3 className="mb-4" style={{ color: '#F5E6D3', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>장비</h3>
                          {character.equippedItems && character.equippedItems.length > 0 ? (
                            <div className="space-y-3">
                              {character.equippedItems.map((item) => (
                                <div key={item.item.id} className="flex items-center gap-3">
                                  {item.item.imageUrl && (
                                    <img src={item.item.imageUrl} alt={item.item.name} className="w-12 h-12 object-contain" />
                                  )}
                                  <div>
                                    <div className="font-bold">{item.item.name}</div>
                                    <div className="text-sm" style={{ color: '#F5E6D3' }}>{item.item.type}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#F5E6D3' }}>장비한 아이템이 없습니다.</p>
                          )}
                        </div>
                      )}
                      {activeTab === '관계' && (
                        <div className="fantasy-text mt-4" style={{ color: 'rgba(245, 230, 211, 0.9)' }}>
                          {((character.relationships || []).length > 0 || (character.relationships2 || []).length > 0) ? (() => {
                            const getFileNameFromPath = (path: string | null | undefined) => {
                              if (!path) return '';
                              const match = path.match(/\/([^\/]+)\.(png|jpg|jpeg)$/);
                              if (match) return match[1];
                              const fileNameMatch = path.match(/^([^\/\.]+)(?:\.(png|jpg|jpeg))?$/);
                              if (fileNameMatch) return fileNameMatch[1];
                              return '';
                            };
                            const getCharacterFileName = (char: { name: string; displayName?: string; portraitImage?: string }) => {
                              if (char.portraitImage) {
                                const fileName = getFileNameFromPath(char.portraitImage);
                                if (fileName) {
                                  return fileName.split('_')[0];
                                }
                              }
                              const name = char.displayName || char.name;
                              return name.toLowerCase().replace(/\s+/g, '_');
                            };
                            const allRelations = [
                              ...(character.relationships || []).map(rel => ({
                                target: rel.characterB,
                                relationship: rel.relationship,
                                description: rel.description
                              })),
                              ...(character.relationships2 || []).map(rel => ({
                                target: rel.characterA,
                                relationship: rel.relationship,
                                description: rel.description
                              }))
                            ];
                            const uniqueRelations = allRelations.reduce((acc, rel) => {
                              if (!acc.find(r => r.target.id === rel.target.id)) {
                                acc.push(rel);
                              }
                              return acc;
                            }, [] as typeof allRelations);
                            if (uniqueRelations.length === 0) {
                              return <p style={{ color: 'rgba(223, 190, 106, 0.5)' }}>등록된 관계가 없습니다.</p>;
                            }
                            
                            const canSwipe = uniqueRelations.length >= 3;
                            
                            const handleMouseDown = (e: React.MouseEvent) => {
                              if (canSwipe) {
                                setDragStartX(e.clientX);
                                setIsDragging(true);
                                setDragOffset(0);
                              }
                            };
                            
                            const handleMouseMove = (e: React.MouseEvent) => {
                              if (canSwipe && isDragging && dragStartX !== null) {
                                const diff = e.clientX - dragStartX;
                                setDragOffset(diff);
                              }
                            };
                            
                            const handleMouseUp = () => {
                              if (canSwipe && isDragging && dragStartX !== null) {
                                const threshold = 100;
                                if (Math.abs(dragOffset) > threshold) {
                                  if (dragOffset > 0) {
                                    setCurrentRelationshipIndex((prev) => (prev - 1 + uniqueRelations.length) % uniqueRelations.length);
                                  } else {
                                    setCurrentRelationshipIndex((prev) => (prev + 1) % uniqueRelations.length);
                                  }
                                }
                                setDragStartX(null);
                                setIsDragging(false);
                                setDragOffset(0);
                              }
                            };
                            
                            const handleMouseLeave = () => {
                              if (canSwipe && isDragging) {
                                setDragStartX(null);
                                setIsDragging(false);
                                setDragOffset(0);
                              }
                            };
                            
                            const handleTouchStart = (e: React.TouchEvent) => {
                              if (canSwipe) {
                                setDragStartX(e.touches[0].clientX);
                                setIsDragging(true);
                                setDragOffset(0);
                              }
                            };
                            
                            const handleTouchMove = (e: React.TouchEvent) => {
                              if (canSwipe && isDragging && dragStartX !== null) {
                                const diff = e.touches[0].clientX - dragStartX;
                                setDragOffset(diff);
                              }
                            };
                            
                            const handleTouchEnd = () => {
                              if (canSwipe && isDragging && dragStartX !== null) {
                                const threshold = 100;
                                if (Math.abs(dragOffset) > threshold) {
                                  if (dragOffset > 0) {
                                    setCurrentRelationshipIndex((prev) => (prev - 1 + uniqueRelations.length) % uniqueRelations.length);
                                  } else {
                                    setCurrentRelationshipIndex((prev) => (prev + 1) % uniqueRelations.length);
                                  }
                                }
                                setDragStartX(null);
                                setIsDragging(false);
                                setDragOffset(0);
                              }
                            };
                            
                            if (showDescriptionView && selectedDescriptionIndex !== null && uniqueRelations[selectedDescriptionIndex]) {
                              const selectedRel = uniqueRelations[selectedDescriptionIndex];
                              
                              const handleDescriptionMouseDown = (e: React.MouseEvent) => {
                                if (descriptionRef.current) {
                                  setIsScrolling(true);
                                  setScrollStartY(e.clientY);
                                  setScrollStartScrollTop(descriptionRef.current.scrollTop);
                                }
                              };
                              
                              const handleDescriptionMouseMove = (e: React.MouseEvent) => {
                                if (isScrolling && descriptionRef.current) {
                                  const deltaY = e.clientY - scrollStartY;
                                  descriptionRef.current.scrollTop = scrollStartScrollTop - deltaY;
                                }
                              };
                              
                              const handleDescriptionMouseUp = () => {
                                setIsScrolling(false);
                              };
                              
                              return (
                                <div style={{ position: 'relative', width: '100%', minHeight: 'clamp(360px, 45vh, 520px)', opacity: descriptionFadeIn ? 1 : 0, filter: descriptionFadeIn ? 'blur(0px)' : 'blur(10px)', transform: descriptionFadeIn ? 'translateY(0px)' : 'translateY(10px)', transition: 'opacity 0.45s ease, filter 0.45s ease, transform 0.45s ease', willChange: 'opacity, filter, transform' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setDescriptionFadeIn(false);
                                      setShowDescriptionView(false);
                                      setSelectedDescriptionIndex(null);
                                    }}
                                    style={{
                                      position: 'absolute',
                                      top: 'clamp(160px, 15vh, 260px)',
                                      right: '70px',
                                      padding: '8px 16px',
                                      background: 'rgba(0, 0, 0, 0.8)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: '#F5E6D3',
                                      cursor: 'pointer',
                                      fontSize: '1.5rem',
                                      fontFamily: 'HeirofLight, Cinzel, MedievalSharp, serif',
                                      zIndex: 20
                                    }}
                                  >
                                    &lt;
                                  </button>
                                  <h3 className="mb-4" style={{ color: '#F5E6D3', fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginBottom: '16px' }}>
                                    {selectedRel.target.displayName || selectedRel.target.name} - <span style={{ fontSize: 'clamp(0.875rem, 1.75vw, 1.1rem)' }}>{selectedRel.relationship}</span>
                                  </h3>
                                  {selectedRel.description && (
                                    <div
                                      ref={descriptionRef}
                                      className="relationship-description-scroll"
                                      onMouseDown={handleDescriptionMouseDown}
                                      onMouseMove={handleDescriptionMouseMove}
                                      onMouseUp={handleDescriptionMouseUp}
                                      onMouseLeave={handleDescriptionMouseUp}
                                      style={{
                                        fontSize: 'clamp(0.75rem, 1vw, 0.9rem)',
                                        color: '#F5E6D3',
                                        lineHeight: '1.8',
                                        textAlign: 'left',
                                        maxWidth: 'clamp(400px, 50vw, 600px)',
                                        margin: 0,
                                        paddingLeft: 0,
                                        paddingRight: 'clamp(40px, 8vw, 120px)',
                                        paddingTop: 0,
                                        maxHeight: 'clamp(280px, 35vh, 400px)',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        cursor: isScrolling ? 'grabbing' : 'grab',
                                        userSelect: 'none',
                                        position: 'relative',
                                        zIndex: 10,
                                        opacity: descriptionFadeIn ? 1 : 0,
                                        transform: descriptionFadeIn ? 'translateY(0px)' : 'translateY(6px)',
                                        transition: 'opacity 0.45s ease, transform 0.45s ease',
                                        willChange: 'opacity, transform'
                                      }}
                                      onWheel={(e) => {
                                        if (descriptionRef.current) {
                                          descriptionRef.current.scrollTop += e.deltaY;
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      {selectedRel.description}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            return (
                              <div 
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  height: 'clamp(360px, 45vh, 520px)',
                                  overflow: 'visible',
                                  padding: '0 clamp(14px, 3vw, 64px) 56px',
                                  boxSizing: 'border-box'
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                              >
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                  {uniqueRelations.map((rel, idx) => {
                                    const targetFileName = getCharacterFileName(rel.target);
                                    const relationSlot = selectedSlot || character?.defaultSlot || 1;
                                    const isCenter = idx === currentRelationshipIndex;
                                    const isLeft = idx === (currentRelationshipIndex - 1 + uniqueRelations.length) % uniqueRelations.length && canSwipe;
                                    const isRight = idx === (currentRelationshipIndex + 1) % uniqueRelations.length && canSwipe;
                                    const isVisible = isCenter || isLeft || isRight || !canSwipe;
                                    
                                    if (!isVisible && canSwipe) return null;
                                    
                                    const baseW = 'clamp(120px, 15vw, 208px)';
                                    const baseH = 'clamp(180px, 24vw, 304px)';
                                    const scale = isCenter ? 1 : 0.78;
                                    const opacity = isCenter ? 1 : 0.35;
                                    const zIndex = isCenter ? 10 : isLeft ? 8 : isRight ? 7 : 1;
                                    
                                    let offsetX = '0px';
                                    if (isLeft) {
                                      offsetX = 'clamp(-110px, -9vw, -70px)';
                                    } else if (isRight) {
                                      offsetX = 'clamp(70px, 9vw, 110px)';
                                    }
                                    
                                    if (isCenter && isDragging && dragOffset !== 0) {
                                      const clampDrag = (v: number) => Math.max(-180, Math.min(180, v));
                                      offsetX = `${clampDrag(dragOffset)}px`;
                                    }
                                    
                                    const transition = isDragging
                                      ? 'transform 0.1s ease-out'
                                      : 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, filter 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease';
                                    
                                    return (
                                      <div
                                        key={rel.target.id}
                                        onClick={(e) => {
                                          if (!isDragging && isCenter) {
                                            e.stopPropagation();
                                            setDescriptionFadeIn(false);
                                            setSelectedDescriptionIndex(idx);
                                            setShowDescriptionView(true);
                                          } else if (!isDragging) {
                                            e.stopPropagation();
                                            setCurrentRelationshipIndex(idx);
                                          }
                                        }}
                                        style={{
                                          background: isCenter ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.9)',
                                          border: '2px solid rgba(245, 230, 211, 0.5)',
                                          borderRadius: '12px',
                                          width: baseW,
                                          height: baseH,
                                          boxSizing: 'border-box',
                                          position: 'absolute',
                                          top: '50%',
                                          left: '40%',
                                          transform: `translate(-50%, -50%) translateX(${offsetX}) scale(${scale})`,
                                          opacity,
                                          zIndex,
                                          transition,
                                          pointerEvents: 'auto',
                                          userSelect: 'none',
                                          boxShadow: isCenter ? '0 0 30px rgba(245, 230, 211, 0.4), 0 0 60px rgba(245, 230, 211, 0.2), 0 4px 20px rgba(0, 0, 0, 0.5)' : 'none',
                                          filter: isCenter ? 'none' : 'brightness(0.9) blur(0.3px)',
                                          overflow: 'hidden',
                                          cursor: isDragging ? 'grabbing' : 'grab'
                                        }}
                                      >
                                        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                                          <img
                                            src={`/profile/${targetFileName}_${relationSlot}.png`}
                                            alt={rel.target.displayName || rel.target.name}
                                            style={{ width: '240%', height: '240%', objectFit: 'cover', objectPosition: 'center bottom', transform: 'translate(-35%, -50%)', position: 'absolute', left: '50%', top: '50%', opacity: 0.15, zIndex: 1 }}
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                          <img
                                            src={`/profile/${targetFileName}_${relationSlot}.png`}
                                            alt={rel.target.displayName || rel.target.name}
                                            style={{ width: '110%', height: '110%', objectFit: 'cover', objectPosition: 'center bottom', transform: 'translate(-55%, -50%)', position: 'absolute', left: '50%', top: '50%', zIndex: 2 }}
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(8px, 1vw, 12px)', paddingTop: 'clamp(20px, 3vw, 32px)', background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0.3) 70%, transparent 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', maskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.5) 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.5) 80%, transparent 100%)', borderRadius: '0 0 12px 12px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', zIndex: 3 }}>
                                            <div style={{ fontSize: isCenter ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.875rem, 1.5vw, 1.2rem)', color: '#F5E6D3', fontWeight: 'bold' }}>
                                              {rel.target.displayName || rel.target.name}
                                            </div>
                                            <div style={{ fontSize: isCenter ? 'clamp(0.75rem, 1.2vw, 1rem)' : 'clamp(0.625rem, 1vw, 0.875rem)', color: 'rgba(245, 230, 211, 0.9)' }}>
                                              {rel.relationship}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {canSwipe && uniqueRelations.length > 3 && (
                                  <div style={{ position: 'absolute', bottom: 'clamp(8px, 1.5vw, 16px)', left: '40%', transform: 'translateX(-50%)', display: 'flex', gap: 'clamp(6px, 0.8vw, 12px)', zIndex: 20 }}>
                                    {uniqueRelations.map((_, idx) => (
                                      <div
                                        key={idx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentRelationshipIndex(idx);
                                        }}
                                        style={{
                                          width: idx === currentRelationshipIndex ? 'clamp(18px, 2.5vw, 24px)' : 'clamp(6px, 1vw, 8px)',
                                          height: 'clamp(6px, 1vw, 8px)',
                                          background: idx === currentRelationshipIndex ? 'rgba(245, 230, 211, 0.9)' : 'rgba(245, 230, 211, 0.4)',
                                          borderRadius: '4px',
                                          transition: 'all 0.3s ease',
                                          cursor: 'pointer'
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })() : (
                            <p style={{ color: '#F5E6D3' }}>등록된 관계가 없습니다.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })() : null}
      </div>
    </div>
  );
};

export default CharacterProfile;
