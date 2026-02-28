import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface InvestigationChoice {
  id: string;
  text: string;
  response: string;
  nextPointId: string | null;
  order: number;
}

interface InvestigationPoint {
  id: string;
  name: string;
  description: string;
  positionX: number;
  positionY: number;
  iconUrl: string | null;
  eventScript: string | null;
  rewards: string | null;
  isActive: boolean;
  choices: InvestigationChoice[];
  order?: number;
}

interface EventBlock {
  id: string;
  type: 'dialogue' | 'choice' | 'reward' | 'stat' | 'lock';
  backgroundImage?: string;
  dialogueText?: string;
  characterId?: string;
  characterIds?: string[];
  speakingCharacterId?: string | string[];
  focusEffect?: boolean;
  characterExpressions?: { [characterId: string]: number };
  choices?: Array<{
    id: string;
    text: string;
    nextBlockId?: string;
    response?: string;
  }>;
  nextBlockId?: string;
  position: { x: number; y: number };
  rewardGalleon?: number;
  rewardItems?: Array<{
    itemId: string;
    quantity: number;
  }>;
  rewardMessage?: string;
  // 스탯 이벤트 블록 필드
  statType?: 'attack' | 'defense' | 'agility' | 'luck';
  successBlockId?: string;
  greatSuccessBlockId?: string;
  failureBlockId?: string;
  greatFailureBlockId?: string;
  successMessage?: string;
  greatSuccessMessage?: string;
  failureMessage?: string;
  greatFailureMessage?: string;
  // 잠금 블록 필드
  password?: string;
  correctBlockId?: string;
  incorrectBlockId?: string;
}

interface EventCharacter {
  id: string;
  name: string;
  portraitImage: string;
}

interface EventBackground {
  id: string;
  name: string;
  imageUrl: string;
}

interface Map {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  isPinned?: boolean;
  createdAt?: string;
  investigationPoints: InvestigationPoint[];
}

interface UserInvestigation {
  id: string;
  pointId: string;
  choiceId: string | null;
  completedAt: string;
}

const Map = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [map, setMap] = useState<Map | null>(null);
  const [maps, setMaps] = useState<Map[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [investigations, setInvestigations] = useState<UserInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<InvestigationPoint | null>(null);
  const [showPointInfoModal, setShowPointInfoModal] = useState(false);
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
  const [eventScriptData, setEventScriptData] = useState<{ blocks: EventBlock[]; characters?: EventCharacter[] } | null>(null);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [dialogueSplitIndex, setDialogueSplitIndex] = useState<number>(0);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingPoint, setEditingPoint] = useState<InvestigationPoint | null>(null);
  const [showPointForm, setShowPointForm] = useState(false);
  const [pointFormData, setPointFormData] = useState({
    name: '',
    description: '',
    positionX: 50,
    positionY: 50,
    iconUrl: '',
    eventScript: '',
    isActive: true,
    order: 0
  });
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [showCharacterList, setShowCharacterList] = useState(true);
  const [showBackgroundList, setShowBackgroundList] = useState(true);
  const [eventBlocks, setEventBlocks] = useState<EventBlock[]>([]);
  const [savedEventBlocks, setSavedEventBlocks] = useState<EventBlock[]>([]);
  const [eventCharacters, setEventCharacters] = useState<EventCharacter[]>([]);
  const [eventBackgrounds, setEventBackgrounds] = useState<EventBackground[]>([]);
  const eventBackgroundsRef = useRef<EventBackground[]>([]);
  const [editingCharacterIds, setEditingCharacterIds] = useState<Set<string>>(new Set());
  const [editingBackgroundIds, setEditingBackgroundIds] = useState<Set<string>>(new Set());
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockIdValue, setEditingBlockIdValue] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [draggingConnection, setDraggingConnection] = useState<{ fromBlockId: string; fromChoiceId?: string } | null>(null);
  const [editingChoices, setEditingChoices] = useState<InvestigationChoice[]>([]);
  const [showChoiceForm, setShowChoiceForm] = useState(false);
  const [choiceFormData, setChoiceFormData] = useState({
    text: '',
    response: '',
    nextPointId: '',
    order: 0
  });
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [processedRewardBlocks, setProcessedRewardBlocks] = useState<Set<string>>(new Set());
  const [showMapForm, setShowMapForm] = useState(false);
  const [mapFormData, setMapFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true
  });
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editingPointPosition, setEditingPointPosition] = useState<boolean>(false);
  const [statResultMessage, setStatResultMessage] = useState<string | null>(null);
  const [statResultNextBlockId, setStatResultNextBlockId] = useState<string | undefined>(undefined);
  const [lockPasswordInput, setLockPasswordInput] = useState<string>('');
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<EventBlock | null>(null);
  const [collapsedCharacterSections, setCollapsedCharacterSections] = useState<Record<string, boolean>>({});
  const [collapsedBackgroundSections, setCollapsedBackgroundSections] = useState<Record<string, boolean>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);
  const eventEditorScrollRef = useRef<HTMLDivElement>(null);
  const [mapImageSize, setMapImageSize] = useState<{ renderWidth: number; renderHeight: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const updateMapImageSize = () => {
      if (mapImageRef.current && mapContainerRef.current) {
        const img = mapImageRef.current;
        const container = mapContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const containerW = containerRect.width;
        const containerH = containerRect.height;
        
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;
        
        if (naturalW > 0 && naturalH > 0) {
          const scale = Math.min(containerW / naturalW, containerH / naturalH);
          const renderW = naturalW * scale;
          const renderH = naturalH * scale;
          const offsetX = (containerW - renderW) / 2;
          const offsetY = (containerH - renderH) / 2;
          
          setMapImageSize({
            renderWidth: renderW,
            renderHeight: renderH,
            offsetX: offsetX,
            offsetY: offsetY
          });
        }
      }
    };

    if (map) {
      updateMapImageSize();
      
      const img = mapImageRef.current;
      if (img) {
        if (img.complete) {
          updateMapImageSize();
        } else {
          img.addEventListener('load', updateMapImageSize, { once: true });
        }
      }
      
      const container = mapContainerRef.current;
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(updateMapImageSize, 0);
      });
      
      if (container) {
        resizeObserver.observe(container);
      }
      if (img) {
        resizeObserver.observe(img);
      }
      
      window.addEventListener('resize', updateMapImageSize);
      
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateMapImageSize);
        if (img) {
          img.removeEventListener('load', updateMapImageSize);
        }
      };
    } else {
      setMapImageSize(null);
    }
  }, [map]);

  useEffect(() => {
    fetchMaps();
    if (user) {
      fetchInvestigations();
    }
    fetchItems();
  }, [user]);

  useEffect(() => {
    eventBackgroundsRef.current = eventBackgrounds;
  }, [eventBackgrounds]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveEventBackgroundsTimerRef.current) {
        clearTimeout(saveEventBackgroundsTimerRef.current);
        saveEventBackgrounds(eventBackgroundsRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveEventBackgroundsTimerRef.current) {
        clearTimeout(saveEventBackgroundsTimerRef.current);
        saveEventBackgrounds(eventBackgroundsRef.current);
      } else if (eventBackgroundsRef.current.length > 0) {
        saveEventBackgrounds(eventBackgroundsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (eventBackgroundsRef.current.length > 0) {
        saveEventBackgrounds(eventBackgroundsRef.current);
      }
    };
  }, [selectedMapId]);

  useEffect(() => {
    if (user && selectedMapId) {
      fetchMap(selectedMapId);
    }
  }, [user, selectedMapId]);

  useEffect(() => {
    if (!showInvestigationDialog || !currentBlockId || !eventScriptData) return;
    setDialogueSplitIndex(0);
    const currentBlock = eventScriptData.blocks.find(b => b.id === currentBlockId);
    if (currentBlock && currentBlock.type === 'reward' && !processedRewardBlocks.has(currentBlockId)) {
      handleRewardBlock(currentBlock);
      setProcessedRewardBlocks(prev => new Set(prev).add(currentBlockId));
    }
    if (currentBlock && currentBlock.type === 'lock') {
      setLockPasswordInput('');
    }
  }, [currentBlockId, eventScriptData, showInvestigationDialog]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedMapId) {
      fetchMap(selectedMapId);
    } else if (maps.length > 0 && !map) {
      const pinnedMap = maps.find((m: Map) => m.isPinned);
      const targetMap = pinnedMap || maps[0];
      setSelectedMapId(targetMap.id);
      setMap(targetMap);
    }
  }, [selectedMapId, maps]);

  const fetchItems = async () => {
    try {
      const response = await api.get('/shop/items');
      if (response.data && Array.isArray(response.data)) {
        setItems(response.data.map((item: any) => ({ id: item.id, name: item.name })));
      } else {
        console.warn('Items data is not an array:', response.data);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    }
  };

  const fetchMaps = async () => {
    try {
      if (isAdmin) {
        const response = await api.get('/map/admin/all');
        const mapsList = response.data || [];
        setMaps(mapsList);
        if (mapsList.length > 0 && !selectedMapId && !map) {
          const pinnedMap = mapsList.find((m: Map) => m.isPinned);
          const targetMap = pinnedMap || mapsList[0];
          setSelectedMapId(targetMap.id);
          setMap(targetMap);
        }
      } else {
        const response = await api.get('/map/list');
        const mapsList = response.data || [];
        setMaps(mapsList);
        if (mapsList.length > 0 && !selectedMapId && !map) {
          const pinnedMap = mapsList.find((m: Map) => m.isPinned);
          const targetMap = pinnedMap || mapsList[0];
          setSelectedMapId(targetMap.id);
          setMap(targetMap);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('No map found');
        setMaps([]);
      } else {
        console.error('Error fetching maps:', error);
        setMaps([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMap = async (mapId: string) => {
    try {
      // 먼저 목록에서 찾아보고, 없으면 새로 가져오기
      const existingMap = maps.find((m: Map) => m.id === mapId);
      let targetMap: Map | null = null;
      if (existingMap && existingMap.investigationPoints) {
        // 목록에 이미 조사 지점 정보가 포함되어 있으면 사용
        targetMap = existingMap;
      } else {
        // 목록에서 조사 지점 정보가 없으면 새로 가져오기
        if (isAdmin) {
          const response = await api.get(`/map/admin/all`);
          const mapsList = response.data || [];
          const foundMap = mapsList.find((m: Map) => m.id === mapId);
          if (foundMap) {
            targetMap = foundMap;
            // 목록도 업데이트
            setMaps(mapsList);
          }
        } else {
          const response = await api.get('/map/list');
          const mapsList = response.data || [];
          const foundMap = mapsList.find((m: Map) => m.id === mapId);
          if (foundMap) {
            targetMap = foundMap;
            // 목록도 업데이트
            setMaps(mapsList);
          }
        }
      }
      if (targetMap) {
        setMap(targetMap);
        try {
          const charactersResponse = await api.get(`/map/${mapId}/event-characters`);
          const dbCharacters = charactersResponse.data || [];
          if (dbCharacters.length > 0) {
            setEventCharacters(dbCharacters.map((char: any) => ({
              id: char.id,
              name: char.name,
              portraitImage: char.portraitImage || ''
            })));
          } else {
            const allCharacters: EventCharacter[] = [];
            const characterIds = new Set<string>();
            if (targetMap.investigationPoints) {
              targetMap.investigationPoints.forEach((point: InvestigationPoint) => {
                if (point.eventScript) {
                  try {
                    const script = JSON.parse(point.eventScript);
                    if (script.characters && Array.isArray(script.characters)) {
                      script.characters.forEach((char: EventCharacter) => {
                        if (!characterIds.has(char.id)) {
                          characterIds.add(char.id);
                          allCharacters.push(char);
                        }
                      });
                    }
                  } catch (e) {
                    // JSON 파싱 오류 무시
                  }
                }
              });
            }
            if (allCharacters.length > 0) {
              setEventCharacters(allCharacters);
              await api.post(`/map/${mapId}/event-characters`, { characters: allCharacters });
            }
          }
        } catch (error) {
          console.error('Error fetching event characters:', error);
        }
        try {
          const backgroundsResponse = await api.get(`/map/${mapId}/event-backgrounds`);
          const dbBackgroundsRaw = backgroundsResponse.data;
          const dbBackgrounds = Array.isArray(dbBackgroundsRaw)
            ? dbBackgroundsRaw
            : (dbBackgroundsRaw?.backgrounds ?? []);
          if (dbBackgrounds.length > 0) {
            const mappedBackgrounds = dbBackgrounds.map((bg: any) => ({
              id: bg.id,
              name: bg.name || '',
              imageUrl: bg.imageUrl ?? bg.url ?? bg.backgroundImage ?? ''
            }));
            setEventBackgrounds(mappedBackgrounds);
            eventBackgroundsRef.current = mappedBackgrounds;
          } else {
            setEventBackgrounds([]);
            eventBackgroundsRef.current = [];
          }
        } catch (error) {
          console.error('Error fetching event backgrounds:', error);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Map not found');
      } else {
        console.error('Error fetching map:', error);
      }
    }
  };

  const fetchInvestigations = async () => {
    try {
      const response = await api.get('/map/investigations');
      setInvestigations(response.data);
    } catch (error) {
      console.error('Error fetching investigations:', error);
    }
  };

  const saveEventCharacters = async () => {
    if (!map?.id) return;
    try {
      await api.post(`/map/${map.id}/event-characters`, { characters: eventCharacters });
    } catch (error) {
      console.error('Error saving event characters:', error);
    }
  };

  const saveEventBackgrounds = async (backgroundsToSave?: EventBackground[]) => {
    if (!map?.id) return;
    const raw = backgroundsToSave ?? eventBackgroundsRef.current;
    const backgrounds = raw.map(b => ({
      id: b.id,
      name: b.name || '',
      imageUrl: b.imageUrl || ''
    }));
    try {
      const response = await api.post(`/map/${map.id}/event-backgrounds`, { backgrounds });
      if (response.status !== 200) {
        console.error('Failed to save event backgrounds:', response.status, response.data);
      }
    } catch (error: any) {
      console.error('Error saving event backgrounds:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  };

  const saveEventBackgroundsTimerRef = useRef<number | null>(null);
  const debouncedSaveEventBackgrounds = () => {
    if (saveEventBackgroundsTimerRef.current) {
      window.clearTimeout(saveEventBackgroundsTimerRef.current);
    }
    saveEventBackgroundsTimerRef.current = window.setTimeout(() => {
      saveEventBackgrounds();
    }, 500);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !showAdminPanel || !map) {
      console.log('handleMapClick early return:', { isAdmin, showAdminPanel, map: !!map });
      return;
    }
    
    // 조사 지점 버튼을 클릭한 경우 무시
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'BUTTON') {
      console.log('handleMapClick: clicked on button, ignoring');
      return;
    }

    // 위치 수정 모드인 경우
    if (editingPointPosition && editingPoint) {
      const rect = e.currentTarget.getBoundingClientRect();
      
      if (mapImageSize) {
        const relativeX = e.clientX - rect.left - mapImageSize.offsetX;
        const relativeY = e.clientY - rect.top - mapImageSize.offsetY;
        
        // 이미지 영역 밖 클릭은 무시
        if (relativeX < 0 || relativeX > mapImageSize.renderWidth || 
            relativeY < 0 || relativeY > mapImageSize.renderHeight) {
          return;
        }
        
        const x = (relativeX / mapImageSize.renderWidth) * 100;
        const y = (relativeY / mapImageSize.renderHeight) * 100;
        
        setPointFormData({
          ...pointFormData,
          positionX: Math.max(0, Math.min(100, x)),
          positionY: Math.max(0, Math.min(100, y))
        });
        setEditingPointPosition(false);
        return;
      }
      
      // fallback: mapImageSize가 없는 경우
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPointFormData({
        ...pointFormData,
        positionX: Math.max(0, Math.min(100, x)),
        positionY: Math.max(0, Math.min(100, y))
      });
      setEditingPointPosition(false);
      return;
    }

    console.log('handleMapClick: opening point form');
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (mapImageSize) {
      const relativeX = e.clientX - rect.left - mapImageSize.offsetX;
      const relativeY = e.clientY - rect.top - mapImageSize.offsetY;
      
      // 이미지 영역 밖 클릭은 무시
      if (relativeX < 0 || relativeX > mapImageSize.renderWidth || 
          relativeY < 0 || relativeY > mapImageSize.renderHeight) {
        return;
      }
      
      const x = (relativeX / mapImageSize.renderWidth) * 100;
      const y = (relativeY / mapImageSize.renderHeight) * 100;
      
      setEditingPoint(null);
      setPointFormData({
        name: '',
        description: '',
        positionX: Math.max(0, Math.min(100, x)),
        positionY: Math.max(0, Math.min(100, y)),
        iconUrl: '',
        eventScript: '',
        isActive: true,
        order: 0
      });
      setEventBlocks([]);
      setEditingChoices([]);
      setShowPointForm(true);
      return;
    }
    
    // fallback: mapImageSize가 없는 경우
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setEditingPoint(null);
    setPointFormData({
      name: '',
      description: '',
      positionX: Math.max(0, Math.min(100, x)),
      positionY: Math.max(0, Math.min(100, y)),
      iconUrl: '',
      eventScript: '',
      isActive: true,
      order: 0
    });
    setEventBlocks([]);
    setEditingChoices([]);
    setShowPointForm(true);
  };

  const handlePointClick = (point: InvestigationPoint, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (isAdmin && showAdminPanel) {
      setEditingPoint(point);
      setPointFormData({
        name: point.name,
        description: point.description,
        positionX: point.positionX,
        positionY: point.positionY,
        iconUrl: point.iconUrl || '',
        eventScript: point.eventScript || '',
        isActive: point.isActive,
        order: point.order || 0
      });
      if (point.eventScript) {
        try {
          const script = JSON.parse(point.eventScript);
          if (script.blocks) {
            setEventBlocks(script.blocks || []);
            if (script.characters && script.characters.length > 0) {
              setEventCharacters(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const newCharacters = script.characters.filter((c: EventCharacter) => !existingIds.has(c.id));
                return [...prev, ...newCharacters];
              });
            }
          } else if (script.scenes) {
            const blocks: EventBlock[] = script.scenes.map((scene: any, idx: number) => ({
              id: `block_${idx}`,
              type: scene.choices && scene.choices.length > 0 ? 'choice' : 'dialogue',
              dialogueText: scene.text,
              choices: scene.choices?.map((c: any, cIdx: number) => ({
                id: `choice_${idx}_${cIdx}`,
                text: c.text,
                response: c.response,
                nextBlockId: c.nextScene ? `block_${c.nextScene - 1}` : undefined
              })),
              position: { x: 100 + idx * 300, y: 100 }
            }));
            setEventBlocks(blocks);
            if (script.characters && script.characters.length > 0) {
              setEventCharacters(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const newCharacters = script.characters.filter((c: EventCharacter) => !existingIds.has(c.id));
                return [...prev, ...newCharacters];
              });
            }
          } else {
            setEventBlocks([]);
            if (script.characters && script.characters.length > 0) {
              setEventCharacters(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const newCharacters = script.characters.filter((c: EventCharacter) => !existingIds.has(c.id));
                return [...prev, ...newCharacters];
              });
            }
          }
        } catch (e) {
          setEventBlocks([]);
        }
      } else {
        setEventBlocks([]);
      }
      setEditingChoices(point.choices || []);
      setShowPointForm(true);
      return;
    }

    setSelectedPoint(point);
    setShowPointInfoModal(true);
  };

  const handleStartInvestigation = () => {
    if (!selectedPoint) return;
    setProcessedRewardBlocks(new Set());
    setLockPasswordInput('');
    setCurrentBlockId(null);
    if (selectedPoint.eventScript) {
      try {
        const script = JSON.parse(selectedPoint.eventScript);
        if (script.blocks && script.blocks.length > 0) {
          const scriptCharacters = script.characters || [];
          const mergedCharacters = eventCharacters.length > 0 
            ? [...eventCharacters, ...scriptCharacters.filter((sc: EventCharacter) => !eventCharacters.find(ec => ec.id === sc.id))]
            : scriptCharacters;
          setEventScriptData({ blocks: script.blocks, characters: mergedCharacters });
          setCurrentBlockId(script.blocks[0].id);
        } else {
          setEventScriptData(null);
          setCurrentBlockId(null);
        }
      } catch (e) {
        setEventScriptData(null);
        setCurrentBlockId(null);
      }
    } else {
      setEventScriptData(null);
      setCurrentBlockId(null);
    }
    setShowPointInfoModal(false);
    setShowInvestigationDialog(true);
  };

  const handleRewardBlock = (rewardBlock: EventBlock) => {
    if (!rewardBlock.rewardGalleon && (!rewardBlock.rewardItems || rewardBlock.rewardItems.length === 0)) {
      return;
    }

    const rewards = {
      galleon: rewardBlock.rewardGalleon || 0,
      items: rewardBlock.rewardItems || []
    };

    api.post(`/map/reward`, { rewards }).then(() => {
      if (user) {
        refreshUser();
      }
    }).catch((error: any) => {
      console.error('Error processing reward:', error);
      // 관리자 계정인 경우 "Character not found" 에러는 알림을 띄우지 않음
      if (isAdmin && error.response?.data?.error === 'Character not found') {
        return;
      }
      alert(error.response?.data?.error || '보상 지급 실패');
    });
  };

  const handleStatBlock = async (statBlock: EventBlock) => {
    if (!statBlock.statType) return;

    // 관리자는 스탯을 3으로 고정
    let userStat = 3;
    if (!isAdmin && user) {
      try {
        // 사용자 캐릭터 정보 가져오기
        const response = await api.get(`/user/${user.id}`);
        if (response.data?.character) {
          const character = response.data.character;
          switch (statBlock.statType) {
            case 'attack':
              userStat = character.attack || 1;
              break;
            case 'defense':
              userStat = character.defense || 1;
              break;
            case 'agility':
              userStat = character.agility || 1;
              break;
            case 'luck':
              userStat = character.luck || 1;
              break;
          }
        }
      } catch (error) {
        console.error('Error fetching character stats:', error);
      }
    }

    // 주사위 굴리기 (1-6)
    const diceRoll = Math.floor(Math.random() * 6) + 1;

    // 결과 판정: 주사위 값보다 유저 스탯이 낮으면 성공
    // 주사위가 높을수록 어려움, 스탯이 낮을수록 성공하기 쉬움
    const difference = diceRoll - userStat;

    let nextBlockId: string | undefined;
    let message: string | undefined;

    if (difference >= 5) {
      // 대성공: 주사위가 스탯보다 5 이상 높음 (스탯이 주사위보다 5 이상 낮음)
      nextBlockId = statBlock.greatSuccessBlockId;
      message = statBlock.greatSuccessMessage;
    } else if (difference >= 0) {
      // 성공: 주사위가 스탯보다 높거나 같음 (스탯이 주사위보다 낮거나 같음)
      nextBlockId = statBlock.successBlockId;
      message = statBlock.successMessage;
    } else if (difference >= -5) {
      // 실패: 주사위가 스탯보다 낮지만 5 이하
      nextBlockId = statBlock.failureBlockId;
      message = statBlock.failureMessage;
    } else {
      // 대실패: 주사위가 스탯보다 5 이상 낮음
      nextBlockId = statBlock.greatFailureBlockId;
      message = statBlock.greatFailureMessage;
    }

    // 결과 메시지 표시
    setStatResultMessage(message || null);
    setStatResultNextBlockId(nextBlockId);
    
    // 메시지가 없으면 바로 다음 블록으로 이동
    if (!message) {
      if (nextBlockId) {
        setCurrentBlockId(nextBlockId);
        setStatResultMessage(null);
        setStatResultNextBlockId(undefined);
      } else {
        // 다음 블록이 없으면 종료
        setEventScriptData(null);
        setCurrentBlockId(null);
        setStatResultMessage(null);
        setStatResultNextBlockId(undefined);
        setShowInvestigationDialog(false);
        setSelectedPoint(null);
        fetchInvestigations();
      }
    }
  };

  const handleInvestigate = async (choiceId?: string) => {
    if (!selectedPoint) return;

    try {
      const response = await api.post(`/map/investigate/${selectedPoint.id}`, {
        choiceId: choiceId || null
      });

      if (response.data.response) {
        alert(response.data.response);
      }

      if (response.data.rewards) {
        const rewardText = [];
        if (response.data.rewards.galleon) {
          rewardText.push(`${response.data.rewards.galleon} 갈레온`);
        }
        if (response.data.rewards.items) {
          response.data.rewards.items.forEach((item: any) => {
            rewardText.push(`${item.name} x${item.quantity}`);
          });
        }
        if (rewardText.length > 0) {
          alert(`보상: ${rewardText.join(', ')}`);
        }
      }

      setShowInvestigationDialog(false);
      setSelectedPoint(null);
      setEventScriptData(null);
      setCurrentBlockId(null);
      fetchInvestigations();
      if (user) {
        refreshUser();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '조사 실패');
    }
  };

  const handleCopyBlock = useCallback(() => {
    if (selectedBlockId && showEventEditor) {
      const block = eventBlocks.find(b => b.id === selectedBlockId);
      if (block) {
        setCopiedBlock(JSON.parse(JSON.stringify(block)));
      }
    }
  }, [selectedBlockId, showEventEditor, eventBlocks]);
  
  const handlePasteBlock = useCallback(() => {
    if (copiedBlock && showEventEditor) {
      const newBlock: EventBlock = {
        ...JSON.parse(JSON.stringify(copiedBlock)),
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: copiedBlock.position.x + 50,
          y: copiedBlock.position.y + 50
        }
      };
      setEventBlocks(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  }, [copiedBlock, showEventEditor]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showEventEditor) return;
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;
      if (isInputFocused && hasSelection && (e.ctrlKey || e.metaKey) && e.key === 'c') {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedBlockId) {
        e.preventDefault();
        handleCopyBlock();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedBlock) {
        if (isInputFocused) {
          return;
        }
        e.preventDefault();
        handlePasteBlock();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEventEditor, selectedBlockId, copiedBlock, handleCopyBlock, handlePasteBlock]);

  const handleCreateMap = async () => {
    try {
      const response = await api.post('/map/admin', mapFormData);
      await fetchMaps();
      const newMapId = response.data.id;
      setSelectedMapId(newMapId);
      // 조사 지점 정보를 포함한 전체 지도 정보 가져오기
      await fetchMap(newMapId);
      setShowMapForm(false);
      setMapFormData({
        name: '',
        description: '',
        imageUrl: '',
        isActive: true
      });
      setEditingMapId(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '지도 생성 실패');
    }
  };

  const handleUpdateMap = async () => {
    if (!editingMapId) return;

    try {
      const response = await api.put(`/map/admin/${editingMapId}`, mapFormData);
      await fetchMaps();
      setSelectedMapId(response.data.id);
      setMap(response.data);
      setShowMapForm(false);
      setMapFormData({
        name: '',
        description: '',
        imageUrl: '',
        isActive: true
      });
      setEditingMapId(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '지도 수정 실패');
    }
  };

  const handleMapSelect = async (mapId: string) => {
    if (selectedMapId === mapId) return;
    setSelectedMapId(mapId);
    setLoading(true);
    try {
      await fetchMap(mapId);
      if (user) {
        fetchInvestigations();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/map/admin/${mapId}/pin`);
      await fetchMaps();
      if (selectedMapId === mapId) {
        await fetchMap(mapId);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '고정 상태 변경 실패');
    }
  };

  const handleDeleteMap = async (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 지도를 삭제하시겠습니까?')) {
      return;
    }
    try {
      await api.delete(`/map/admin/${mapId}`);
      await fetchMaps();
      if (selectedMapId === mapId) {
        // 삭제된 지도가 현재 선택된 지도인 경우
        const remainingMaps = maps.filter(m => m.id !== mapId);
        if (remainingMaps.length > 0) {
          setSelectedMapId(remainingMaps[0].id);
          setMap(remainingMaps[0]);
        } else {
          setSelectedMapId(null);
          setMap(null);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '지도 삭제 실패');
    }
  };

  const handleEditMap = (mapId: string) => {
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;
    setEditingMapId(mapId);
    setMapFormData({
      name: targetMap.name,
      description: targetMap.description || '',
      imageUrl: targetMap.imageUrl,
      isActive: targetMap.isActive
    });
    setShowMapForm(true);
  };

  const handleCreatePoint = async () => {
    if (!map) return;

    try {
      let rewards = null;
      const rewardBlock = eventBlocks.find(b => b.type === 'reward');
      if (rewardBlock) {
        rewards = {
          galleon: rewardBlock.rewardGalleon || 0,
          items: rewardBlock.rewardItems || []
        };
      }

      let eventScript = null;
      if (eventBlocks.length > 0) {
        eventScript = { blocks: eventBlocks };
      }

      const response = await api.post('/map/admin/points', {
        mapId: map.id,
        ...pointFormData,
        eventScript: eventScript,
        rewards: rewards
      });

      const newPoint = response.data;
      setEditingPoint(newPoint);
      setEditingChoices([]);
      if (selectedMapId) {
        fetchMap(selectedMapId);
        fetchMaps();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '조사 지점 생성 실패');
    }
  };

  const handleUpdatePoint = async () => {
    if (!editingPoint) return;

    try {
      let rewards = null;
      const rewardBlock = eventBlocks.find(b => b.type === 'reward');
      if (rewardBlock) {
        rewards = {
          galleon: rewardBlock.rewardGalleon || 0,
          items: rewardBlock.rewardItems || []
        };
      }

      let eventScript = null;
      if (eventBlocks.length > 0) {
        eventScript = { blocks: eventBlocks };
      }

      await api.put(`/map/admin/points/${editingPoint.id}`, {
        ...pointFormData,
        eventScript: eventScript,
        rewards: rewards
      });

      setShowPointForm(false);
      setEditingPoint(null);
      setEditingPointPosition(false);
      if (selectedMapId) {
        fetchMap(selectedMapId);
        fetchMaps();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '조사 지점 수정 실패');
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/map/admin/points/${pointId}`);
      if (selectedMapId) {
        fetchMap(selectedMapId);
        fetchMaps();
      }
      setShowPointForm(false);
      setEditingPoint(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '조사 지점 삭제 실패');
    }
  };

  const handleCreateChoice = async () => {
    if (!editingPoint) return;

    try {
      await api.post('/map/admin/choices', {
        pointId: editingPoint.id,
        ...choiceFormData,
        nextPointId: choiceFormData.nextPointId || null
      });

      setShowChoiceForm(false);
      setChoiceFormData({
        text: '',
        response: '',
        nextPointId: '',
        order: 0
      });
      if (selectedMapId) {
        await fetchMap(selectedMapId);
        await fetchMaps();
      }
      if (editingPoint) {
        if (selectedMapId) {
          const response = await api.get('/map/admin/all');
          const mapsList = response.data || [];
          const updatedMap = mapsList.find((m: Map) => m.id === selectedMapId);
          if (updatedMap) {
            const updatedPoint = updatedMap.investigationPoints.find((p: InvestigationPoint) => p.id === editingPoint.id);
            if (updatedPoint) {
              setEditingChoices(updatedPoint.choices);
            }
          }
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '선택지 생성 실패');
    }
  };

  const handleUpdateChoice = async () => {
    if (!editingChoiceId) return;

    try {
      await api.put(`/map/admin/choices/${editingChoiceId}`, {
        ...choiceFormData,
        nextPointId: choiceFormData.nextPointId || null
      });

      setShowChoiceForm(false);
      setEditingChoiceId(null);
      setChoiceFormData({
        text: '',
        response: '',
        nextPointId: '',
        order: 0
      });
      if (selectedMapId) {
        await fetchMap(selectedMapId);
        await fetchMaps();
      }
      if (editingPoint) {
        if (selectedMapId) {
          const response = await api.get('/map/admin/all');
          const mapsList = response.data || [];
          const updatedMap = mapsList.find((m: Map) => m.id === selectedMapId);
          if (updatedMap) {
            const updatedPoint = updatedMap.investigationPoints.find((p: InvestigationPoint) => p.id === editingPoint.id);
            if (updatedPoint) {
              setEditingChoices(updatedPoint.choices);
            }
          }
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '선택지 수정 실패');
    }
  };

  const handleDeleteChoice = async (choiceId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/map/admin/choices/${choiceId}`);
      if (selectedMapId) {
        await fetchMap(selectedMapId);
        await fetchMaps();
      }
      if (editingPoint) {
        if (selectedMapId) {
          const response = await api.get('/map/admin/all');
          const mapsList = response.data || [];
          const updatedMap = mapsList.find((m: Map) => m.id === selectedMapId);
          if (updatedMap) {
            const updatedPoint = updatedMap.investigationPoints.find((p: InvestigationPoint) => p.id === editingPoint.id);
            if (updatedPoint) {
              setEditingChoices(updatedPoint.choices);
            }
          }
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '선택지 삭제 실패');
    }
  };

  const handleEditChoice = (choice: InvestigationChoice) => {
    setEditingChoiceId(choice.id);
    setChoiceFormData({
      text: choice.text,
      response: choice.response,
      nextPointId: choice.nextPointId || '',
      order: choice.order
    });
    setShowChoiceForm(true);
  };

  const handleAddChoice = () => {
    setEditingChoiceId(null);
    setChoiceFormData({
      text: '',
      response: '',
      nextPointId: '',
      order: editingChoices.length
    });
    setShowChoiceForm(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!map) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-hogwarts-blue">지도</h1>
          {isAdmin && (
            <button
              onClick={() => setShowMapForm(true)}
              className="btn"
            >
              지도 생성
            </button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          활성화된 지도가 없습니다.
        </div>

        {isAdmin && showMapForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
              <h2 className="text-2xl font-bold mb-4">{editingMapId ? '지도 수정' : '지도 생성'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">지도 이름</label>
                  <input
                    type="text"
                    value={mapFormData.name}
                    onChange={(e) => setMapFormData({ ...mapFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <textarea
                    value={mapFormData.description}
                    onChange={(e) => setMapFormData({ ...mapFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-black"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">지도 이미지 URL</label>
                  <input
                    type="text"
                    value={mapFormData.imageUrl}
                    onChange={(e) => setMapFormData({ ...mapFormData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-black"
                    required
                    placeholder="https://example.com/map.png"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mapFormData.isActive}
                    onChange={(e) => setMapFormData({ ...mapFormData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm">활성화</label>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                {editingMapId ? (
                  <button
                    onClick={handleUpdateMap}
                    className="btn"
                  >
                    수정
                  </button>
                ) : (
                  <button
                    onClick={handleCreateMap}
                    className="btn"
                  >
                    생성
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMapForm(false);
                    setEditingMapId(null);
                    setMapFormData({
                      name: '',
                      description: '',
                      imageUrl: '',
                      isActive: true
                    });
                  }}
                  className="btn"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="btn fantasy-text"
          style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(35, 31, 32, 0.9)', border: '1px solid rgba(223,190,106,0.3)' }}
        >
          ← 뒤로
        </button>
      </div>
      {/* 지도 목록 (왼쪽, 뒤로 버튼 아래) */}
      {maps.length > 0 && (
        <div className="absolute left-4 top-28 z-50 w-64 modern-card rounded-lg overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="p-4">
            <h3 className="text-white text-lg font-bold mb-3">지도 목록</h3>
            <div className="space-y-4">
              {maps.map((m) => (
                <div
                  key={m.id}
                  className="modern-card p-4"
                >
                  <button
                    onClick={() => handleMapSelect(m.id)}
                    className="w-full text-left"
                  >
                    <div className="font-semibold" style={{ color: 'rgba(223,190,106,0.9)' }}>{m.name}</div>
                    {m.description && (
                      <div className={`text-sm mt-1 opacity-80 ${selectedMapId === m.id ? '' : 'truncate'}`}>
                        {m.description}
                      </div>
                    )}
                  </button>
                  {isAdmin && selectedMapId === m.id && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(m.id, e);
                        }}
                        className="btn"
                        style={{ 
                          padding: '6px 10px', 
                          fontSize: '0.75rem', 
                          textTransform: 'none', 
                          letterSpacing: 'normal',
                          whiteSpace: 'nowrap',
                          minWidth: '45px',
                          margin: 0
                        }}
                        title={m.isPinned ? '고정 해제' : '고정'}
                      >
                        고정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMap(m.id);
                        }}
                        className="btn"
                        style={{ 
                          padding: '6px 10px', 
                          fontSize: '0.75rem', 
                          textTransform: 'none', 
                          letterSpacing: 'normal',
                          whiteSpace: 'nowrap',
                          minWidth: '45px',
                          margin: 0
                        }}
                        title="수정"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => handleDeleteMap(m.id, e)}
                        className="btn"
                        style={{ 
                          padding: '6px 10px', 
                          fontSize: '0.75rem', 
                          background: 'rgba(139, 0, 0, 0.8)', 
                          textTransform: 'none', 
                          letterSpacing: 'normal',
                          whiteSpace: 'nowrap',
                          minWidth: '45px',
                          margin: 0
                        }}
                        title="삭제"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => {
              setEditingMapId(null);
              setMapFormData({
                name: '',
                description: '',
                imageUrl: '',
                isActive: true
              });
              setShowMapForm(true);
            }}
            className="btn"
            style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(35, 31, 32, 0.9)', border: '1px solid rgba(223,190,106,0.3)' }}
          >
            지도 생성
          </button>
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="btn"
            style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(35, 31, 32, 0.9)', border: '1px solid rgba(223,190,106,0.3)' }}
          >
            {showAdminPanel ? '편집 모드 끄기' : '편집 모드'}
          </button>
        </div>
      )}

      <div 
        ref={mapContainerRef}
        className="relative w-full h-full bg-black"
        onClick={handleMapClick}
        style={{ cursor: (isAdmin && showAdminPanel) || editingPointPosition ? 'crosshair' : 'default' }}
      >
        {/* 블러 처리된 배경 이미지 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${map.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(20px)',
            transform: 'scale(1.2)',
            opacity: 0.6,
            zIndex: 0
          }}
        />
        <div 
          className="relative w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <img
            ref={mapImageRef}
            src={map.imageUrl}
            alt={map.name}
            className="w-full h-full object-contain"
            style={{ 
              border: 'none', 
              display: 'block',
              position: 'relative',
              zIndex: 2
            }}
            onError={(e) => {
              console.error('Failed to load map image:', map.imageUrl);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        {map.investigationPoints.map((point) => {
          const isInvestigated = investigations.some(inv => inv.pointId === point.id);
          let left = `${point.positionX}%`;
          let top = `${point.positionY}%`;
          
          if (mapImageSize) {
            const x = (point.positionX / 100) * mapImageSize.renderWidth + mapImageSize.offsetX;
            const y = (point.positionY / 100) * mapImageSize.renderHeight + mapImageSize.offsetY;
            left = `${x}px`;
            top = `${y}px`;
          }
          
          return (
            <button
              key={point.id}
              onClick={(e) => handlePointClick(point, e)}
              onMouseEnter={() => setHoveredPointId(point.id)}
              onMouseLeave={() => setHoveredPointId(null)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: left,
                top: top,
                zIndex: selectedPoint?.id === point.id ? 30 : 20
              }}
            >
              {point.iconUrl ? (
                <img
                  src={point.iconUrl}
                  alt={point.name}
                  className={`w-8 h-8 investigation-point-icon ${(hoveredPointId === point.id || selectedPoint?.id === point.id) ? 'investigation-point-icon-hovered' : ''}`}
                  style={{ border: 'none', opacity: isInvestigated ? 0.5 : 1 }}
                />
              ) : (
                <div className={`w-8 h-8 bg-red-500 rounded-full border-2 border-white investigation-point-icon ${(hoveredPointId === point.id || selectedPoint?.id === point.id) ? 'investigation-point-icon-hovered' : ''}`} style={{ opacity: isInvestigated ? 0.5 : 1 }}></div>
              )}
                {!isAdmin && (
                <div 
                  className={`absolute bottom-full left-1/2 mb-0 text-base font-semibold whitespace-nowrap px-8 py-4 pointer-events-none flex items-start justify-center caption-hover ${selectedPoint?.id === point.id ? 'caption-visible' : ''}`}
                  style={{
                    backgroundImage: 'url(/Captions.png)',
                    backgroundSize: 'contain',
                    backgroundPosition: '60% center',
                    backgroundRepeat: 'no-repeat',
                    color: 'black',
                    minWidth: '240px',
                    minHeight: '80px',
                    paddingTop: '0.5rem',
                    marginBottom: '-10px',
                    zIndex: selectedPoint?.id === point.id ? 30 : 1,
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))'
                  }}>
                  {point.name.split(' ').map((word, wordIndex, words) => {
                    const totalWords = words.length;
                    const center = (totalWords - 1) / 2;
                    const distanceFromCenter = Math.abs(wordIndex - center);
                    const maxDistance = center || 1;
                    const archHeight = distanceFromCenter / maxDistance * 3;
                    return (
                      <span key={wordIndex} style={{ 
                        display: 'inline-block',
                        transform: `translateY(${archHeight}px)`
                      }}>
                        {word}
                        {wordIndex < words.length - 1 && '\u00A0'}
                      </span>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: selectedPoint ? 20 : 15,
          opacity: (hoveredPointId || selectedPoint) ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: 'none'
        }}
      />

      <style>{`
        .btn {
          display: inline-block;
          background: transparent;
          text-transform: uppercase;
          font-weight: 500;
          font-style: normal;
          font-size: 1rem;
          letter-spacing: 0.3em;
          color: rgba(223,190,106,0.7);
          border-radius: 0;
          padding: 18px 80px 20px;
          transition: all 0.7s ease-out;
          background: linear-gradient(270deg, rgba(223,190,106,0.8), rgba(146,111,52,0.8), rgba(34,34,34,0), rgba(34,34,34,0));
          background-position: 1% 50%;
          background-size: 300% 300%;
          text-decoration: none;
          margin: 0.625rem;
          border: none;
          border: 1px solid rgba(223,190,106,0.3);
        }
        .btn:hover {
          color: #fff;
          border: 1px solid rgba(223,190,106,0);
          background-position: 99% 50%;
        }
        @keyframes fadeInSwap {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translateX(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) translateX(0) scale(1);
          }
        }
        @keyframes shrinkSwap {
          0% {
            transform: scale(1) translateX(0);
          }
          100% {
            transform: scale(0.85) translateX(0);
          }
        }
        @keyframes expandSwap {
          0% {
            transform: scale(0.85) translateX(20px);
          }
          100% {
            transform: scale(1) translateX(0);
          }
        }
        @keyframes fadeInOverlay {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.7;
          }
        }
        @keyframes bounceOnce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-50px);
          }
          50% {
            transform: translateY(0);
          }
        }
        @keyframes bounceTwice {
          0%, 100% {
            transform: translateY(0);
          }
          12.5% {
            transform: translateY(-50px);
          }
          25% {
            transform: translateY(0);
          }
          37.5% {
            transform: translateY(-50px);
          }
          50% {
            transform: translateY(0);
          }
        }
        .character-portrait {
          transition: opacity 0.3s ease-in-out;
        }
        .character-portrait img {
          image-rendering: auto;
          -webkit-image-rendering: auto;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }
        .investigation-point-icon {
          transition: all 0.3s ease;
        }
        .investigation-point-icon:hover {
          filter: brightness(1.8) drop-shadow(0 0 12px rgba(255, 255, 255, 1));
        }
        .investigation-point-icon-hovered {
          filter: brightness(1.8) drop-shadow(0 0 12px rgba(255, 255, 255, 1));
          z-index: 25 !important;
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .caption-hover {
          opacity: 0;
          transform: translate(-55%, 0);
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
        .group:hover .caption-hover,
        .caption-visible {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        @keyframes dialogueFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .dialogue-content {
          animation: dialogueFadeIn 0.4s ease-in-out;
        }
        .character-list-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .character-list-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .character-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(223,190,106,0.5);
          border-radius: 4px;
        }
        .character-list-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(223,190,106,0.7);
        }
        .event-editor-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .event-editor-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .event-editor-scroll::-webkit-scrollbar-thumb {
          background: rgba(223,190,106,0.5);
          border-radius: 4px;
        }
        .event-editor-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(223,190,106,0.7);
        }
        .block-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .block-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .block-scroll::-webkit-scrollbar-thumb {
          background: rgba(223,190,106,0.5);
          border-radius: 4px;
        }
        .block-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(223,190,106,0.7);
        }
        .block-scroll-dialogue::-webkit-scrollbar {
          width: 8px;
        }
        .block-scroll-dialogue::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .block-scroll-dialogue::-webkit-scrollbar-thumb {
          background: rgba(66, 153, 225, 0.6);
          border-radius: 4px;
        }
        .block-scroll-dialogue::-webkit-scrollbar-thumb:hover {
          background: rgba(66, 153, 225, 0.8);
        }
        .block-scroll-choice::-webkit-scrollbar {
          width: 8px;
        }
        .block-scroll-choice::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .block-scroll-choice::-webkit-scrollbar-thumb {
          background: rgba(72, 187, 120, 0.6);
          border-radius: 4px;
        }
        .block-scroll-choice::-webkit-scrollbar-thumb:hover {
          background: rgba(72, 187, 120, 0.8);
        }
        .block-scroll-reward::-webkit-scrollbar {
          width: 8px;
        }
        .block-scroll-reward::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .block-scroll-reward::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.6);
          border-radius: 4px;
        }
        .block-scroll-reward::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.8);
        }
        .block-scroll-stat::-webkit-scrollbar {
          width: 8px;
        }
        .block-scroll-stat::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .block-scroll-stat::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.6);
          border-radius: 4px;
        }
        .block-scroll-stat::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.8);
        }
        .block-scroll-lock::-webkit-scrollbar {
          width: 8px;
        }
        .block-scroll-lock::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .block-scroll-lock::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.6);
          border-radius: 4px;
        }
        .block-scroll-lock::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.8);
        }
      `}</style>
      {showInvestigationDialog && selectedPoint && (() => {
        const currentBlock = eventScriptData?.blocks?.find(b => b.id === currentBlockId);
        const prevBlock = currentBlockId && eventScriptData?.blocks ? 
          eventScriptData.blocks.find((b, idx, arr) => {
            const currentIdx = arr.findIndex(bl => bl.id === currentBlockId);
            return idx === currentIdx - 1;
          }) : null;
        const prevCharacterIds = prevBlock?.characterIds || (prevBlock?.characterId ? [prevBlock.characterId] : []);
        const prevValidCharacterIds = prevCharacterIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
        const prevSpeakingIds = Array.isArray(prevBlock?.speakingCharacterId) ? prevBlock.speakingCharacterId : (prevBlock?.speakingCharacterId ? [prevBlock.speakingCharacterId] : []);
        const prevDisplayCharacterId = prevSpeakingIds[0] || prevValidCharacterIds[0] || prevBlock?.characterId;
        const prevSpeakingCharacterIds = prevSpeakingIds;
        const currentCharacterIds = currentBlock?.characterIds || (currentBlock?.characterId ? [currentBlock.characterId] : []);
        const currentValidCharacterIds = currentCharacterIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
        const currentSpeakingIds = Array.isArray(currentBlock?.speakingCharacterId) ? currentBlock.speakingCharacterId : (currentBlock?.speakingCharacterId ? [currentBlock.speakingCharacterId] : []);
        const currentDisplayCharacterId = currentSpeakingIds[0] || currentValidCharacterIds[0] || currentBlock?.characterId;
        const characterChanged = prevDisplayCharacterId !== currentDisplayCharacterId;
        const renderDialogueText = (text: string): React.ReactNode => {
          const processTextSegment = (segment: string): React.ReactNode[] => {
            const parts: React.ReactNode[] = [];
            const boldRegex = /#([^#]+)#/g;
            const italicRegex = /\*([^*]+)\*/g;
            const allMatches: Array<{ index: number; length: number; type: 'bold' | 'italic'; content: string }> = [];
            let match: RegExpExecArray | null;
            while ((match = boldRegex.exec(segment)) !== null) {
              allMatches.push({
                index: match.index,
                length: match[0].length,
                type: 'bold',
                content: match[1]
              });
            }
            boldRegex.lastIndex = 0;
            while ((match = italicRegex.exec(segment)) !== null) {
              allMatches.push({
                index: match.index,
                length: match[0].length,
                type: 'italic',
                content: match[1]
              });
            }
            allMatches.sort((a, b) => a.index - b.index);
            let currentIndex = 0;
            for (const match of allMatches) {
              if (match.index > currentIndex) {
                const beforeText = segment.substring(currentIndex, match.index);
                const lines = beforeText.split('/');
                parts.push(...lines.map((line, idx) => (
                  <React.Fragment key={`before-${match.index}-${idx}`}>
                    {line}
                    {idx < lines.length - 1 && <br />}
                  </React.Fragment>
                )));
              }
              const matchLines = match.content.split('/');
              parts.push(...matchLines.map((line, idx) => (
                <React.Fragment key={`${match.type}-${match.index}-${idx}`}>
                  {match.type === 'bold' ? <strong>{line}</strong> : <em>{line}</em>}
                  {idx < matchLines.length - 1 && <br />}
                </React.Fragment>
              )));
              currentIndex = match.index + match.length;
            }
            if (currentIndex < segment.length) {
              const afterText = segment.substring(currentIndex);
              const lines = afterText.split('/');
              parts.push(...lines.map((line, idx) => (
                <React.Fragment key={`after-${currentIndex}-${idx}`}>
                  {line}
                  {idx < lines.length - 1 && <br />}
                </React.Fragment>
              )));
            }
            if (parts.length === 0) {
              const lines = segment.split('/');
              parts.push(...lines.map((line, idx) => (
                <React.Fragment key={`plain-${idx}`}>
                  {line}
                  {idx < lines.length - 1 && <br />}
                </React.Fragment>
              )));
            }
            return parts;
          };
          return processTextSegment(text);
        };
        return (
          <div className="fixed inset-0 z-50" style={{ backgroundColor: '#000000' }}>
            <button
              onClick={() => {
                setShowInvestigationDialog(false);
                setSelectedPoint(null);
                setEventScriptData(null);
                setCurrentBlockId(null);
              }}
              className="btn absolute top-4 left-4 z-10"
            >
              ← 뒤로
            </button>
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: '#000000',
                zIndex: 0
              }}
            />
            {windowSize.width > 1920 && (
              <>
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: '400px',
                    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 30%, rgba(0, 0, 0, 0.1) 60%, transparent 100%)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    maskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0"
                  style={{
                    width: '400px',
                    background: 'linear-gradient(to left, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 30%, rgba(0, 0, 0, 0.1) 60%, transparent 100%)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    maskImage: 'linear-gradient(to left, black 0%, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, black 0%, black 70%, transparent 100%)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />
              </>
            )}
            {(() => {
              const characterIds = currentBlock?.characterIds || (currentBlock?.characterId ? [currentBlock.characterId] : []);
              const existingIdSet = new Set((eventScriptData?.characters || eventCharacters || []).map(c => c.id));
              const validCharacterIds = characterIds
                .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                .filter(id => existingIdSet.has(id));
              
              if (validCharacterIds.length === 0) return null;
              
              const allCharacters = eventScriptData?.characters || eventCharacters || [];
              const characters = validCharacterIds
                .map(id => allCharacters.find(c => c.id === id))
                .filter((c): c is EventCharacter => c !== undefined && !!c.portraitImage && c.portraitImage.trim().length > 0);
              
              if (characters.length === 0) return null;
              
              const speakingCharacterIds = Array.isArray(currentBlock?.speakingCharacterId) ? currentBlock.speakingCharacterId : (currentBlock?.speakingCharacterId ? [currentBlock.speakingCharacterId] : []);
              const shouldAnimatePortrait = characterChanged;
              const hasFocusEffect = currentBlock?.focusEffect && speakingCharacterIds.length === 1;
              const focusedCharacterId = hasFocusEffect ? speakingCharacterIds[0] : null;
              
              return (
                <div 
                  className="absolute character-portraits-container"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0px',
                    zIndex: 1,
                    opacity: shouldAnimatePortrait ? 0 : 1,
                    animation: shouldAnimatePortrait ? 'fadeInSwap 0.6s ease-in-out forwards' : 'none'
                  }}
                >
                  {[...characters].sort((a, b) => {
                    const aIsFocused = hasFocusEffect && a.id === focusedCharacterId;
                    const bIsFocused = hasFocusEffect && b.id === focusedCharacterId;
                    if (aIsFocused && !bIsFocused) return 1;
                    if (!aIsFocused && bIsFocused) return -1;
                    return 0;
                  }).map((character) => {
                    const isSpeaking = speakingCharacterIds.includes(character.id);
                    const wasSpeaking = prevSpeakingCharacterIds.includes(character.id);
                    const isFocused = hasFocusEffect && character.id === focusedCharacterId;
                    const scale = isFocused ? 5 : (isSpeaking ? 1 : 0.85);
                    const needsShrinkAnimation = !isFocused && wasSpeaking && !isSpeaking;
                    const needsExpandAnimation = !isFocused && !wasSpeaking && isSpeaking && prevBlock !== null;
                    const expression = currentBlock?.characterExpressions?.[character.id] || 1;
                    const prevExpression = prevBlock?.characterExpressions?.[character.id] || 1;
                    const needsBounceTwiceAnimation = !isFocused && expression === 3 && prevExpression !== 3 && prevBlock !== null;
                    const needsBounceOnceAnimation = !isFocused && expression === 2 && prevExpression !== 2 && prevBlock !== null;
                    const needsBounceAnimation = needsBounceTwiceAnimation || needsBounceOnceAnimation;
                    const portraitFileName = expression > 1 ? `${character.portraitImage}_${expression}` : `${character.portraitImage}_1`;
                    
                    const baseWidth = 500;
                    const baseHeight = 800;
                    const minWidth = 300;
                    const minHeight = 480;
                    const scaleFactor = Math.max(
                      Math.min(windowSize.width / 1200, windowSize.height / 1080),
                      Math.min(minWidth / baseWidth, minHeight / baseHeight)
                    );
                    const portraitWidth = Math.max(baseWidth * scaleFactor * 1.2, minWidth);
                    const portraitHeight = Math.max(baseHeight * scaleFactor * 1.2, minHeight);
                    
                    const characterIndex = characters.indexOf(character);
                    return (
                      <div
                        key={character.id}
                        className="character-portrait"
                        style={{
                          position: isFocused ? 'fixed' : 'relative',
                          left: isFocused ? '50%' : 'auto',
                          top: isFocused ? '50%' : 'auto',
                          transform: isFocused 
                            ? `translate(-50%, 20%) scale(${scale})`
                            : (needsBounceAnimation ? undefined : `scale(${scale})`),
                          transformOrigin: 'center center',
                          overflow: 'hidden',
                          width: `${portraitWidth}px`,
                          height: `${portraitHeight}px`,
                          marginLeft: !isFocused && characterIndex > 0 ? '-100px' : '0',
                          zIndex: isFocused ? 10 : (hasFocusEffect ? 0 : 1),
                          '--portrait-scale': scale.toString(),
                          animation: needsBounceTwiceAnimation ? 'bounceTwice 0.8s ease-in-out forwards' :
                                    needsBounceOnceAnimation ? 'bounceOnce 0.5s ease-in-out forwards' :
                                    needsShrinkAnimation ? 'shrinkSwap 0.6s ease-in-out forwards' : 
                                    needsExpandAnimation ? 'expandSwap 0.6s ease-in-out forwards' : 'none',
                          willChange: (needsBounceTwiceAnimation || needsBounceOnceAnimation || needsShrinkAnimation || needsExpandAnimation) ? 'transform' : 'auto',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        } as React.CSSProperties & { '--portrait-scale': string }}
                      >
                        <img
                          src={`/dialogue/${portraitFileName}.png`}
                          alt={character.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (expression > 1) {
                              target.src = `/dialogue/${character.portraitImage}_1.png`;
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center',
                            imageRendering: 'auto',
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(0)'
                          } as React.CSSProperties}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            WebkitMaskImage: `linear-gradient(to bottom, black 0%, black 80%, transparent 100%), url(/dialogue/${portraitFileName}.png)`,
                            maskImage: `linear-gradient(to bottom, black 0%, black 80%, transparent 100%), url(/dialogue/${portraitFileName}.png)`,
                            WebkitMaskComposite: 'intersect',
                            maskComposite: 'intersect',
                            WebkitMaskSize: '100% 100%, contain',
                            maskSize: '100% 100%, contain',
                            WebkitMaskPosition: 'center, center',
                            maskPosition: 'center, center',
                            WebkitMaskRepeat: 'no-repeat, no-repeat',
                            maskRepeat: 'no-repeat, no-repeat',
                            pointerEvents: 'none'
                          }}
                        />
                        {!isSpeaking && (
                          <div 
                            className="absolute inset-0 bg-black"
                            style={{ 
                              opacity: needsShrinkAnimation ? 0 : 0.7,
                              WebkitMaskImage: `url(/dialogue/${portraitFileName}.png)`,
                              maskImage: `url(/dialogue/${portraitFileName}.png)`,
                              WebkitMaskSize: 'contain',
                              maskSize: 'contain',
                              WebkitMaskPosition: 'center',
                              maskPosition: 'center',
                              WebkitMaskRepeat: 'no-repeat',
                              maskRepeat: 'no-repeat',
                              pointerEvents: 'none',
                              animation: needsShrinkAnimation ? 'fadeInOverlay 0.6s ease-in-out forwards' : 'none'
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {(currentBlock?.type === 'choice' || currentBlock?.type === 'lock') && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2"
                style={{
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                  width: '600px',
                  maxWidth: '90%'
                }}
              >
                {currentBlock.type === 'lock' ? (
                  <div className="bg-black bg-opacity-80 rounded-lg p-6">
                    <p className="text-gray-600 text-base mb-4 text-center">
                      암호를 입력하세요
                    </p>
                    <input
                      type="text"
                      value={lockPasswordInput}
                      onChange={(e) => {
                        setLockPasswordInput(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (currentBlock.password && lockPasswordInput === currentBlock.password) {
                            if (currentBlock.correctBlockId) {
                              setCurrentBlockId(currentBlock.correctBlockId);
                              setLockPasswordInput('');
                            } else {
                              setEventScriptData(null);
                              setCurrentBlockId(null);
                              setLockPasswordInput('');
                              setShowInvestigationDialog(false);
                              setSelectedPoint(null);
                              fetchInvestigations();
                            }
                          } else {
                            if (currentBlock.incorrectBlockId) {
                              setCurrentBlockId(currentBlock.incorrectBlockId);
                              setLockPasswordInput('');
                            } else {
                              setEventScriptData(null);
                              setCurrentBlockId(null);
                              setLockPasswordInput('');
                              setShowInvestigationDialog(false);
                              setSelectedPoint(null);
                              fetchInvestigations();
                            }
                          }
                        }
                      }}
                      className="w-full px-4 py-3 text-xl bg-gray-800 text-white rounded mb-4 border border-gray-600 focus:outline-none focus:border-blue-500"
                      placeholder="암호 입력..."
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentBlock.password && lockPasswordInput === currentBlock.password) {
                          if (currentBlock.correctBlockId) {
                            setCurrentBlockId(currentBlock.correctBlockId);
                            setLockPasswordInput('');
                          } else {
                            setEventScriptData(null);
                            setCurrentBlockId(null);
                            setLockPasswordInput('');
                            setShowInvestigationDialog(false);
                            setSelectedPoint(null);
                            fetchInvestigations();
                          }
                        } else {
                          if (currentBlock.incorrectBlockId) {
                            setCurrentBlockId(currentBlock.incorrectBlockId);
                            setLockPasswordInput('');
                          } else {
                            setEventScriptData(null);
                            setCurrentBlockId(null);
                            setLockPasswordInput('');
                            setShowInvestigationDialog(false);
                            setSelectedPoint(null);
                            fetchInvestigations();
                          }
                        }
                      }}
                      className="btn w-full"
                    >
                      확인
                    </button>
                  </div>
                ) : currentBlock.type === 'choice' && currentBlock.choices && currentBlock.choices.length > 0 ? (
                  <div className="bg-black bg-opacity-80 rounded-lg p-6">
                    <div className="space-y-3">
                      {currentBlock.choices.map((choice) => (
                        <button
                          key={choice.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (choice.response) {
                              alert(choice.response);
                            }
                            if (choice.nextBlockId) {
                              setCurrentBlockId(choice.nextBlockId);
                            } else {
                              setEventScriptData(null);
                              setCurrentBlockId(null);
                              if (selectedPoint.choices.length > 0) {
                                setShowInvestigationDialog(true);
                              } else {
                                handleInvestigate();
                              }
                            }
                          }}
                          className="btn w-full"
                        >
                          {renderDialogueText(choice.text)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {currentBlock?.backgroundImage && (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(/dialogue_bg/${currentBlock.backgroundImage}.png)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 0
                }}
              />
            )}
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-black cursor-pointer text-center" 
              style={{ 
                height: '350px',
                width: '80%',
                maxWidth: '1200px',
                backgroundImage: 'url(/Dialogue_bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'top center',
                backgroundRepeat: 'no-repeat',
                padding: '2rem 4rem 2rem 6rem',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                overflowY: 'auto'
              }}
              onClick={(e) => {
                if (!currentBlock) return;
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.closest('button')) {
                  return;
                }
                if (target.tagName === 'UL' || target.tagName === 'LI' || target.closest('ul') || target.closest('li')) {
                  return;
                }
                if (currentBlock.type === 'dialogue') {
                  const dialogueText = currentBlock.dialogueText || '';
                  const splitTexts = dialogueText.split('//').map(t => t.trim()).filter(t => t.length > 0);
                  if (splitTexts.length > 0 && dialogueSplitIndex < splitTexts.length - 1) {
                    setDialogueSplitIndex(prev => prev + 1);
                  } else {
                    if (currentBlock.nextBlockId) {
                      setCurrentBlockId(currentBlock.nextBlockId);
                    } else {
                      setEventScriptData(null);
                      setCurrentBlockId(null);
                      setShowInvestigationDialog(false);
                      setSelectedPoint(null);
                      fetchInvestigations();
                    }
                  }
                } else if (currentBlock.type === 'reward') {
                  if (currentBlock.nextBlockId) {
                    setCurrentBlockId(currentBlock.nextBlockId);
                  } else {
                    setEventScriptData(null);
                    setCurrentBlockId(null);
                    setShowInvestigationDialog(false);
                    setSelectedPoint(null);
                    fetchInvestigations();
                  }
                } else if (currentBlock.type === 'stat') {
                  // 스탯 이벤트 처리
                  if (statResultMessage) {
                    // 결과 메시지가 표시된 상태에서 클릭하면 다음 블록으로 이동
                    if (statResultNextBlockId) {
                      setCurrentBlockId(statResultNextBlockId);
                      setStatResultMessage(null);
                      setStatResultNextBlockId(undefined);
                    } else {
                      setEventScriptData(null);
                      setCurrentBlockId(null);
                      setStatResultMessage(null);
                      setStatResultNextBlockId(undefined);
                      setShowInvestigationDialog(false);
                      setSelectedPoint(null);
                      fetchInvestigations();
                    }
                  } else {
                    // 결과 메시지가 없으면 스탯 체크 실행
                    handleStatBlock(currentBlock);
                  }
                } else if (currentBlock.type === 'lock') {
                  // 잠금 블록은 암호 입력 필드가 있어서 클릭만으로는 처리되지 않음
                  return;
                }
              }}
            >
                {currentBlock ? (
                <div className={characterChanged ? "dialogue-content" : ""} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flexShrink: 0, height: '68px' }}>
                    {(() => {
                      const characterIds = currentBlock?.characterIds || (currentBlock?.characterId ? [currentBlock.characterId] : []);
                      const validCharacterIds = characterIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
                      const speakingIds = Array.isArray(currentBlock?.speakingCharacterId) ? currentBlock.speakingCharacterId : (currentBlock?.speakingCharacterId ? [currentBlock.speakingCharacterId] : []);
                      const displayCharacterId = speakingIds[0] || validCharacterIds[0] || currentBlock?.characterId;
                      const allCharacters = eventScriptData?.characters || eventCharacters || [];
                      const characters = speakingIds.length > 0 
                        ? speakingIds.map(id => allCharacters.find((c: EventCharacter) => c.id === id)).filter((c): c is EventCharacter => c !== undefined)
                        : (displayCharacterId ? [allCharacters.find((c: EventCharacter) => c.id === displayCharacterId)].filter((c): c is EventCharacter => c !== undefined) : []);
                      return characters.length > 0 ? (
                        <h2 className="text-4xl font-bold mb-4 pt-4 text-left">{characters.map(c => c.name).join(', ')}</h2>
                      ) : null;
                    })()}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {currentBlock.type === 'dialogue' ? (
                      <p className="mb-6 whitespace-pre-wrap text-3xl leading-relaxed">
                        {(() => {
                          const dialogueText = currentBlock.dialogueText || '';
                          const splitTexts = dialogueText.split('//').map(t => t.trim()).filter(t => t.length > 0);
                          if (splitTexts.length > 0) {
                            const currentText = splitTexts[dialogueSplitIndex] || splitTexts[0];
                            return renderDialogueText(currentText);
                          }
                          return renderDialogueText(dialogueText);
                        })()}
                      </p>
                    ) : currentBlock.type === 'choice' ? (
                      <p className="mb-6 whitespace-pre-wrap text-3xl leading-relaxed">
                        {currentBlock.dialogueText ? renderDialogueText(currentBlock.dialogueText) : ''}
                      </p>
                    ) : currentBlock.type === 'reward' ? (
                      <>
                        {currentBlock.rewardMessage && (
                          <p className="mb-4 whitespace-pre-wrap text-3xl leading-relaxed">
                            {renderDialogueText(currentBlock.rewardMessage)}
                          </p>
                        )}
                      </>
                    ) : currentBlock.type === 'stat' ? (
                      <div className="mb-6">
                        {statResultMessage ? (
                          <p className="text-3xl mb-4 text-black">
                            {statResultMessage}
                          </p>
                        ) : (
                          <>
                            {currentBlock.dialogueText ? (
                              <p className="mb-6 whitespace-pre-wrap text-3xl leading-relaxed">
                                {renderDialogueText(currentBlock.dialogueText)}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : currentBlock.type === 'lock' ? (
                      <div className="mb-6">
                        {currentBlock.dialogueText && (
                          <p className="mb-6 whitespace-pre-wrap text-3xl leading-relaxed">
                            {renderDialogueText(currentBlock.dialogueText)}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })()}

      {isAdmin && showAdminPanel && (
        <div className="absolute bottom-4 left-4 z-10 modern-card p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(223,190,106,0.9)' }}>관리자 편집 모드</h2>
          <p className="mb-4 text-white">지도를 클릭하여 새 조사 지점을 추가하거나, 기존 조사 지점을 클릭하여 편집하세요.</p>
        </div>
      )}

        {isAdmin && showPointForm && !editingPointPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex z-50 overflow-hidden justify-center items-center">
           <div className="rounded-lg p-8 w-full max-w-2xl my-8 overflow-y-auto mx-auto" style={{ background: 'rgba(35, 31, 32, 1)', border: '1px solid rgba(223,190,106,0.3)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(223,190,106,0.9)' }}>
              {editingPoint ? '조사 지점 수정' : '새 조사 지점 추가'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(223,190,106,0.8)' }}>이름</label>
                <input
                  type="text"
                  value={pointFormData.name}
                  onChange={(e) => setPointFormData({ ...pointFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-yellow-900 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(223,190,106,0.8)' }}>설명</label>
                <textarea
                  value={pointFormData.description}
                  onChange={(e) => setPointFormData({ ...pointFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-yellow-900 text-white rounded"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(223,190,106,0.8)' }}>X 위치 (%)</label>
                  <input
                    type="number"
                    value={pointFormData.positionX.toFixed(2)}
                    readOnly
                    onClick={() => {
                      if (isAdmin && showAdminPanel && editingPoint) {
                        setEditingPointPosition(true);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded text-white ${
                      editingPointPosition 
                        ? 'bg-yellow-900 cursor-crosshair border-yellow-500' 
                        : editingPoint 
                          ? 'bg-gray-800 cursor-pointer hover:bg-gray-700 border-yellow-900' 
                          : 'bg-gray-800 cursor-not-allowed border-yellow-900'
                    }`}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className={`text-xs mt-1 ${
                    editingPointPosition 
                      ? 'text-yellow-400 font-semibold' 
                      : 'text-gray-400'
                  }`}>
                    {editingPointPosition 
                      ? '지도에서 새로운 위치를 클릭하세요' 
                      : editingPoint ? '클릭하여 위치 수정' : '지도에서 클릭하여 설정'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(223,190,106,0.8)' }}>Y 위치 (%)</label>
                  <input
                    type="number"
                    value={pointFormData.positionY.toFixed(2)}
                    readOnly
                    onClick={() => {
                      if (isAdmin && showAdminPanel && editingPoint) {
                        setEditingPointPosition(true);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded text-white ${
                      editingPointPosition 
                        ? 'bg-yellow-900 cursor-crosshair border-yellow-500' 
                        : editingPoint 
                          ? 'bg-gray-800 cursor-pointer hover:bg-gray-700 border-yellow-900' 
                          : 'bg-gray-800 cursor-not-allowed border-yellow-900'
                    }`}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className={`text-xs mt-1 ${
                    editingPointPosition 
                      ? 'text-yellow-400 font-semibold' 
                      : 'text-gray-400'
                  }`}>
                    {editingPointPosition 
                      ? '지도에서 새로운 위치를 클릭하세요' 
                      : editingPoint ? '클릭하여 위치 수정' : '지도에서 클릭하여 설정'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(223,190,106,0.8)' }}>이벤트 스크립트</label>
                <button
                  type="button"
                  onClick={() => {
                    setSavedEventBlocks(JSON.parse(JSON.stringify(eventBlocks)));
                    setShowPointForm(false);
                    setShowEventEditor(true);
                  }}
                  className="btn w-full mb-2"
                >
                  {eventBlocks.length > 0 ? '이벤트 변경' : '이벤트 추가'}
                </button>
                {eventBlocks.length > 0 && (
                  <div className="text-sm text-gray-400 mb-2">
                    {eventBlocks.length}개 블록이 설정되어 있습니다.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(223,190,106,0.8)' }}>아이콘 URL</label>
                <input
                  type="text"
                  value={pointFormData.iconUrl}
                  onChange={(e) => setPointFormData({ ...pointFormData, iconUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-yellow-900 text-white rounded"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={pointFormData.isActive}
                  onChange={(e) => setPointFormData({ ...pointFormData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-white">활성화</label>
              </div>
            </div>


            <div className="flex gap-2 mt-6">
              <button
                onClick={editingPoint ? handleUpdatePoint : handleCreatePoint}
                className="btn"
                style={{ padding: '10px 20px', fontSize: '0.875rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
              >
                {editingPoint ? '수정' : '생성'}
              </button>
              <button
                onClick={() => {
                  setShowPointForm(false);
                  setEditingPoint(null);
                  setEditingPointPosition(false);
                }}
                className="btn"
                style={{ padding: '10px 20px', fontSize: '0.875rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
              >
                취소
              </button>
              {editingPoint && (
                <button
                  onClick={() => handleDeletePoint(editingPoint.id)}
                  className="btn"
                  style={{ padding: '10px 20px', fontSize: '0.875rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0, background: 'rgba(220, 38, 38, 0.8)' }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showEventEditor && !showPointForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex z-50 overflow-hidden justify-center items-center">
          <div className="flex gap-4 my-8 flex-wrap" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            <div className="flex-1 rounded-lg flex flex-col min-w-[400px]" style={{ background: 'rgba(35, 31, 32, 1)', border: '1px solid rgba(223,190,106,0.3)', maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="flex-shrink-0 pb-4 pt-8 px-8 border-b" style={{ borderColor: 'rgba(223,190,106,0.3)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold" style={{ color: 'rgba(223,190,106,0.9)' }}>이벤트 스크립트 편집</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowEventEditor(false);
                        setShowPointForm(true);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setEventBlocks(JSON.parse(JSON.stringify(savedEventBlocks)));
                        setShowEventEditor(false);
                        setShowPointForm(true);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                    >
                      취소
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                        className="px-3 py-1 rounded text-lg border"
                        style={{ background: 'rgba(0, 0, 0, 0.5)', borderColor: 'rgba(223,190,106,0.3)', color: 'rgba(223,190,106,0.9)' }}
                      >
                        -
                      </button>
                      <span className="text-white text-sm min-w-[60px] text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
                        className="px-3 py-1 rounded text-lg border"
                        style={{ background: 'rgba(0, 0, 0, 0.5)', borderColor: 'rgba(223,190,106,0.3)', color: 'rgba(223,190,106,0.9)' }}
                      >
                        +
                      </button>
                    </div>
                    <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const scrollTop = eventEditorScrollRef.current?.scrollTop || 0;
                        const newY = scrollTop + 100;
                        const newBlock: EventBlock = {
                          id: `block_${Date.now()}`,
                          type: 'dialogue',
                          dialogueText: '',
                          position: { x: 100, y: newY }
                        };
                        setEventBlocks([...eventBlocks, newBlock]);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(66, 153, 225, 0.5)', color: 'rgba(223,190,106,0.9)' }}
                    >
                      대사 블록 추가
                    </button>
                    <button
                      onClick={() => {
                        const scrollTop = eventEditorScrollRef.current?.scrollTop || 0;
                        const newY = scrollTop + 100;
                        const newBlock: EventBlock = {
                          id: `block_${Date.now()}`,
                          type: 'choice',
                          choices: [],
                          position: { x: 100, y: newY }
                        };
                        setEventBlocks([...eventBlocks, newBlock]);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(72, 187, 120, 0.5)', color: 'rgba(223,190,106,0.9)' }}
                    >
                      선택지 블록 추가
                    </button>
                    <button
                      onClick={() => {
                        const scrollTop = eventEditorScrollRef.current?.scrollTop || 0;
                        const newY = scrollTop + 100;
                        const newBlock: EventBlock = {
                          id: `block_${Date.now()}`,
                          type: 'reward',
                          rewardGalleon: 0,
                          rewardItems: [],
                          rewardMessage: '',
                          position: { x: 100, y: newY }
                        };
                        setEventBlocks([...eventBlocks, newBlock]);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(251, 191, 36, 0.5)', color: 'rgba(223,190,106,0.9)' }}
                    >
                      보상 블록 추가
                    </button>
                    <button
                      onClick={() => {
                        const scrollTop = eventEditorScrollRef.current?.scrollTop || 0;
                        const newY = scrollTop + 100;
                        const newBlock: EventBlock = {
                          id: `block_${Date.now()}`,
                          type: 'stat',
                          statType: 'attack',
                          successMessage: '',
                          greatSuccessMessage: '',
                          failureMessage: '',
                          greatFailureMessage: '',
                          position: { x: 100, y: newY }
                        };
                        setEventBlocks([...eventBlocks, newBlock]);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(168, 85, 247, 0.5)', color: 'rgba(223,190,106,0.9)' }}
                    >
                      스탯 이벤트 블록 추가
                    </button>
                    <button
                      onClick={() => {
                        const scrollTop = eventEditorScrollRef.current?.scrollTop || 0;
                        const newY = scrollTop + 100;
                        const newBlock: EventBlock = {
                          id: `block_${Date.now()}`,
                          type: 'lock',
                          password: '',
                          position: { x: 100, y: newY }
                        };
                        setEventBlocks([...eventBlocks, newBlock]);
                      }}
                      className="btn"
                      style={{ padding: '10px 20px', fontSize: '0.875rem', background: 'rgba(220, 38, 38, 0.5)', color: 'rgba(223,190,106,0.9)' }}
                    >
                      잠금 블록 추가
                    </button>
                    </div>
                  </div>
                </div>
                <div ref={eventEditorScrollRef} className="flex-1 overflow-y-auto bg-black event-editor-scroll px-8 pt-4">
                  <div 
                    className="relative" 
                    style={{ 
                      minHeight: eventBlocks.length > 0 ? `${Math.max(600, Math.max(...eventBlocks.map(b => b.position.y + 500)))}px` : '600px',
                      minWidth: eventBlocks.length > 0 ? `${Math.max(1200, Math.max(...eventBlocks.map(b => b.position.x + 400)))}px` : '1200px',
                      background: '#1a1a1a', 
                      position: 'relative', 
                      overflow: 'visible',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top left'
                    }}
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.absolute.border-2') || target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('button')) {
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      const startX = (e.clientX - rect.left) / zoomLevel;
                      const startY = (e.clientY - rect.top) / zoomLevel;
                      setSelectionBox({ startX, startY, endX: startX, endY: startY });
                      setSelectedBlockIds(new Set());
                      setSelectedBlockId(null);
                      const handleMove = (e: MouseEvent) => {
                        const container = eventEditorScrollRef.current?.querySelector('.relative') as HTMLElement;
                        if (!container) return;
                        const rect = container.getBoundingClientRect();
                        const endX = (e.clientX - rect.left) / zoomLevel;
                        const endY = (e.clientY - rect.top) / zoomLevel;
                        setSelectionBox(prev => prev ? { ...prev, endX, endY } : null);
                        const minX = Math.min(startX, endX);
                        const maxX = Math.max(startX, endX);
                        const minY = Math.min(startY, endY);
                        const maxY = Math.max(startY, endY);
                        const selected = eventBlocks.filter(block => {
                          const blockRight = block.position.x + 250;
                          const blockBottom = block.position.y + 200;
                          return block.position.x < maxX && blockRight > minX && block.position.y < maxY && blockBottom > minY;
                        }).map(b => b.id);
                        setSelectedBlockIds(new Set(selected));
                      };
                      const handleUp = () => {
                        document.removeEventListener('mousemove', handleMove);
                        document.removeEventListener('mouseup', handleUp);
                        setSelectionBox(null);
                      };
                      document.addEventListener('mousemove', handleMove);
                      document.addEventListener('mouseup', handleUp);
                    }}
                  >
                    {selectionBox && (
                      <div
                        className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
                        style={{
                          left: Math.min(selectionBox.startX, selectionBox.endX),
                          top: Math.min(selectionBox.startY, selectionBox.endY),
                          width: Math.abs(selectionBox.endX - selectionBox.startX),
                          height: Math.abs(selectionBox.endY - selectionBox.startY),
                          zIndex: 100
                        }}
                      />
                    )}
                    {eventBlocks.map((block) => {
                      const isSelected = selectedBlockIds.has(block.id) || selectedBlockId === block.id;
                      return (
                        <div
                          key={block.id}
                          className="absolute border-2 rounded-lg p-4 cursor-move"
                        style={{
                          left: block.position.x,
                          top: block.position.y,
                          width: '250px',
                          background: block.type === 'dialogue' ? '#2d3748' : block.type === 'choice' ? '#22543d' : block.type === 'reward' ? '#744210' : block.type === 'stat' ? '#6b21a8' : '#7f1d1d',
                          borderColor: isSelected ? '#4299e1' : '#4a5568',
                          borderWidth: isSelected ? '3px' : '2px',
                          zIndex: isSelected ? 10 : 1
                        }}
                        onClick={(e) => {
                          if (e.shiftKey) {
                            setSelectedBlockIds(prev => {
                              const next = new Set(prev);
                              if (next.has(block.id)) {
                                next.delete(block.id);
                              } else {
                                next.add(block.id);
                              }
                              return next;
                            });
                            setSelectedBlockId(null);
                          } else {
                            setSelectedBlockId(block.id);
                            setSelectedBlockIds(new Set([block.id]));
                          }
                        }}
                        onMouseDown={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('button')) {
                            return;
                          }
                          e.preventDefault();
                          e.stopPropagation();
                          const isMultiSelect = selectedBlockIds.has(block.id) || (selectedBlockIds.size > 0 && e.shiftKey);
                          const blocksToMove = isMultiSelect && selectedBlockIds.size > 0 
                            ? eventBlocks.filter(b => selectedBlockIds.has(b.id))
                            : [block];
                          const rect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                          if (!rect) return;
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startPositions = blocksToMove.map(b => ({ id: b.id, x: b.position.x, y: b.position.y }));
                          const handleMove = (e: MouseEvent) => {
                            const deltaX = (e.clientX - startX) / zoomLevel;
                            const deltaY = (e.clientY - startY) / zoomLevel;
                            setEventBlocks(prevBlocks => 
                              prevBlocks.map(b => {
                                const startPos = startPositions.find(sp => sp.id === b.id);
                                if (startPos) {
                                  return { ...b, position: { x: startPos.x + deltaX, y: startPos.y + deltaY } };
                                }
                                return b;
                              })
                            );
                          };
                          const handleUp = () => {
                            document.removeEventListener('mousemove', handleMove);
                            document.removeEventListener('mouseup', handleUp);
                          };
                          document.addEventListener('mousemove', handleMove);
                          document.addEventListener('mouseup', handleUp);
                        }}
                      >
                        <div className="block-header text-white font-bold mb-2 cursor-move">
                          <div className="flex items-center justify-between mb-1">
                            <span>{block.type === 'dialogue' ? '대사' : block.type === 'choice' ? '선택지' : block.type === 'reward' ? '보상' : block.type === 'stat' ? '스탯 이벤트' : '잠금'}</span>
                            <span className="text-xs text-gray-400">ID: {block.id}</span>
                          </div>
                          {(() => {
                            const characterIds = block.characterIds || [];
                            const existingIdSet = new Set(eventCharacters.map(c => c.id));
                            const validCharacterIds = characterIds
                              .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                              .filter(id => existingIdSet.has(id));
                            if (validCharacterIds.length === 0) return null;
                            const characters = validCharacterIds
                              .map(id => eventCharacters.find(c => c.id === id))
                              .filter((c): c is EventCharacter => c !== undefined && !!c.portraitImage && c.portraitImage.trim().length > 0);
                            if (characters.length === 0) return null;
                            return (
                              <div className="mt-2 mb-2">
                                <div className={`grid gap-1 ${characters.length === 1 ? 'grid-cols-1' : characters.length === 2 ? 'grid-cols-2' : characters.length === 3 ? 'grid-cols-3' : 'grid-cols-2 grid-rows-2'}`}>
                                  {characters.map((character, idx) => {
                                    const blockSpeakingIds = Array.isArray(block.speakingCharacterId) ? block.speakingCharacterId : (block.speakingCharacterId ? [block.speakingCharacterId] : []);
                                    const isSpeaking = blockSpeakingIds.includes(character.id);
                                    const expression = block.characterExpressions?.[character.id] || 1;
                                    const portraitFileName = expression > 1 ? `${character.portraitImage}_${expression}` : `${character.portraitImage}_1`;
                                    return (
                                      <div key={character.id} className="relative">
                                        <img
                                          src={`/dialogue/${portraitFileName}.png`}
                                          alt={character.name || '인물'}
                                          className="w-full h-20 object-cover rounded"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (expression > 1) {
                                              target.src = `/dialogue/${character.portraitImage}_1.png`;
                                            } else {
                                              target.style.display = 'none';
                                            }
                                          }}
                                        />
                                        {!isSpeaking && (
                                          <div className="absolute inset-0 bg-black bg-opacity-70 rounded" />
                                        )}
                                        <div className={`text-xs mt-1 text-center ${isSpeaking ? 'text-gray-300' : 'text-gray-500'}`}>
                                          {idx + 1}. {character.name || '이름 없음'}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="mt-2">
                      <label className="text-xs text-gray-300 block mb-1">블록 ID</label>
                        <input
                          type="text"
                          value={editingBlockId === block.id ? editingBlockIdValue : block.id}
                          onChange={(e) => {
                            setEditingBlockId(block.id);
                            setEditingBlockIdValue(e.target.value);
                          }}
                          onFocus={(e) => {
                            setEditingBlockId(block.id);
                            setEditingBlockIdValue(e.currentTarget.value);
                          }}
                          onBlur={() => {
                            if (editingBlockId === block.id && editingBlockIdValue !== block.id && editingBlockIdValue.trim() !== '') {
                              const newId = editingBlockIdValue.trim();
                              setEventBlocks(prevBlocks => {
                                return prevBlocks.map(b => {
                                  if (b.id === block.id) {
                                    return { ...b, id: newId };
                                  }
                                  if (b.type === 'dialogue' && b.nextBlockId === block.id) {
                                    return { ...b, nextBlockId: newId };
                                  }
                                  if (b.type === 'choice' && b.choices) {
                                    return {
                                      ...b,
                                      choices: b.choices.map(c => 
                                        c.nextBlockId === block.id 
                                          ? { ...c, nextBlockId: newId }
                                          : c
                                      )
                                    };
                                  }
                                  return b;
                                });
                              });
                            }
                            setEditingBlockId(null);
                            setEditingBlockIdValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                          placeholder="블록 ID"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                        </div>
                        <div className="mt-2">
                          <label className="text-xs text-gray-300 block mb-1">배경</label>
                          <select
                            value={block.backgroundImage || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, backgroundImage: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음 (기본 배경)</option>
                            {eventBackgrounds.map(bg => (
                              <option key={bg.id} value={bg.imageUrl}>{bg.name || bg.imageUrl}</option>
                            ))}
                          </select>
                        </div>
                        {block.type === 'dialogue' ? (
                      <div>
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">대사</label>
                          <textarea
                            value={block.dialogueText || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, dialogueText: e.target.value } : b
                              ));
                            }}
                            className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded block-scroll-${block.type}`}
                            rows={4}
                            placeholder="대사를 입력하세요... (*이탤릭, #볼드, /줄바꿈)"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-300">인물 설정</label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedCharacterSections({
                                  ...collapsedCharacterSections,
                                  [block.id]: !collapsedCharacterSections[block.id]
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-200"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {collapsedCharacterSections[block.id] ? '▼' : '▲'}
                            </button>
                          </div>
                          {!collapsedCharacterSections[block.id] && (
                            <>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">등장 인물 (최대 4명)</label>
                                <div className={`space-y-1 max-h-32 overflow-y-auto block-scroll-${block.type}`} style={{ border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '0.25rem', padding: '0.5rem' }}>
                                  {(() => {
                                    const characterIds = block.characterIds || [];
                                    const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                    const validCharacterIds = characterIds
                                      .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                      .filter(id => existingIdSet.has(id));
                                    return eventCharacters.map((character) => {
                                      const isChecked = validCharacterIds.includes(character.id);
                                      const order = isChecked ? validCharacterIds.indexOf(character.id) + 1 : null;
                                      return (
                                        <label key={character.id} className="flex items-center cursor-pointer hover:bg-gray-600 px-2 py-1 rounded" style={{ transition: 'background-color 0.2s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentIds = block.characterIds || [];
                                              const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                              const validCurrentIds = currentIds
                                                .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                                .filter(id => existingIdSet.has(id));
                                              let newIds: string[];
                                              if (e.target.checked) {
                                                if (validCurrentIds.length >= 4) {
                                                  return;
                                                }
                                                newIds = [...validCurrentIds, character.id];
                                              } else {
                                                newIds = validCurrentIds.filter(id => id !== character.id);
                                              }
                                              setEventBlocks(eventBlocks.map(b =>
                                                b.id === block.id ? { ...b, characterIds: newIds, characterId: newIds[0] || undefined } : b
                                              ));
                                            }}
                                            className="mr-2"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-sm text-white flex items-center gap-1">
                                            {order && <span className="text-xs text-yellow-400 font-bold">[{order}]</span>}
                                            {character.name || '이름 없음'}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">대사 발언 인물</label>
                                <div className="max-h-32 overflow-y-auto block-scroll px-2 py-1 text-sm bg-gray-700 rounded">
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const currentSpeakingIds = Array.isArray(block.speakingCharacterId) ? block.speakingCharacterId : (block.speakingCharacterId ? [block.speakingCharacterId] : []);
                                    const isSelected = currentSpeakingIds.includes(character.id);
                                    return (
                                      <label key={character.id} className="flex items-center gap-2 py-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newSpeakingIds = e.target.checked
                                              ? [...currentSpeakingIds, character.id]
                                              : currentSpeakingIds.filter(id => id !== character.id);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { ...b, speakingCharacterId: newSpeakingIds.length > 0 ? newSpeakingIds : undefined } : b
                                            ));
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-white text-xs">{character.name || '이름 없음'}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <label className="flex items-center gap-2 mt-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={block.focusEffect || false}
                                    onChange={(e) => {
                                      setEventBlocks(eventBlocks.map(b =>
                                        b.id === block.id ? { ...b, focusEffect: e.target.checked } : b
                                      ));
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="text-white text-xs">집중 효과 (대사 발언 인물 1명일 때만)</span>
                                </label>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">인물 표정</label>
                                <div className={`space-y-2 max-h-40 overflow-y-auto block-scroll-${block.type} px-2 py-1 text-sm bg-gray-700 rounded`}>
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const expression = block.characterExpressions?.[character.id] || 1;
                                    return (
                                      <div key={character.id} className="flex items-center justify-between py-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-white text-xs">{character.name || '이름 없음'}:</span>
                                        <select
                                          value={expression}
                                          onChange={(e) => {
                                            const newExpression = parseInt(e.target.value);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { 
                                                ...b, 
                                                characterExpressions: {
                                                  ...b.characterExpressions,
                                                  [character.id]: newExpression
                                                }
                                              } : b
                                            ));
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value={1}>평소</option>
                                          <option value={2}>화남</option>
                                          <option value={3}>웃음</option>
                                          <option value={4}>놀람</option>
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <label className="text-xs text-gray-300 block mb-1">다음 블록 ID</label>
                          <select
                            value={block.nextBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, nextBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음 (종료)</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id} ({b.type === 'dialogue' ? '대사' : '선택지'})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : block.type === 'choice' ? (
                      <div>
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">선택지</label>
                          {(block.choices || []).map((choice, idx) => (
                            <div key={choice.id} className="mb-2 p-2 bg-gray-800 rounded">
                              <input
                                type="text"
                                value={choice.text}
                                onChange={(e) => {
                                  setEventBlocks(eventBlocks.map(b => 
                                    b.id === block.id 
                                      ? { 
                                          ...b, 
                                          choices: b.choices?.map(c => 
                                            c.id === choice.id ? { ...c, text: e.target.value } : c
                                          )
                                        }
                                      : b
                                  ));
                                }}
                                className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded mb-1"
                                placeholder="선택지 텍스트 (*이탤릭, #볼드, /줄바꿈)"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <select
                                value={choice.nextBlockId || ''}
                                onChange={(e) => {
                                  setEventBlocks(eventBlocks.map(b => 
                                    b.id === block.id 
                                      ? { 
                                          ...b, 
                                          choices: b.choices?.map(c => 
                                            c.id === choice.id ? { ...c, nextBlockId: e.target.value || undefined } : c
                                          )
                                        }
                                      : b
                                  ));
                                }}
                                className="w-full px-2 py-1 text-xs bg-gray-700 text-white rounded mb-1"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">없음 (종료)</option>
                                {eventBlocks.filter(b => b.id !== block.id).map(b => (
                                  <option key={b.id} value={b.id}>{b.id} ({b.type === 'dialogue' ? '대사' : b.type === 'choice' ? '선택지' : '보상'})</option>
                                ))}
                              </select>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEventBlocks(eventBlocks.map(b => 
                                    b.id === block.id 
                                      ? { ...b, choices: b.choices?.filter(c => c.id !== choice.id) }
                                      : b
                                  ));
                                }}
                                className="w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id 
                                  ? { 
                                      ...b, 
                                      choices: [...(b.choices || []), { 
                                        id: `choice_${Date.now()}`, 
                                        text: '' 
                                      }] 
                                    }
                                  : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            선택지 추가
                          </button>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-300">인물 설정</label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedCharacterSections({
                                  ...collapsedCharacterSections,
                                  [block.id]: !collapsedCharacterSections[block.id]
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-200"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {collapsedCharacterSections[block.id] ? '▼' : '▲'}
                            </button>
                          </div>
                          {!collapsedCharacterSections[block.id] && (
                            <>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">등장 인물 (최대 4명)</label>
                                <div className={`space-y-1 max-h-32 overflow-y-auto block-scroll-${block.type}`} style={{ border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '0.25rem', padding: '0.5rem' }}>
                                  {(() => {
                                    const characterIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                    const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                    const validCharacterIds = characterIds
                                      .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                      .filter(id => existingIdSet.has(id));
                                    return eventCharacters.map((character) => {
                                      const isChecked = validCharacterIds.includes(character.id);
                                      const order = isChecked ? validCharacterIds.indexOf(character.id) + 1 : null;
                                      return (
                                        <label key={character.id} className="flex items-center cursor-pointer hover:bg-gray-600 px-2 py-1 rounded" style={{ transition: 'background-color 0.2s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                              const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                              const validCurrentIds = currentIds
                                                .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                                .filter(id => existingIdSet.has(id));
                                              let newIds: string[];
                                              if (e.target.checked) {
                                                if (validCurrentIds.length >= 4) {
                                                  return;
                                                }
                                                newIds = [...validCurrentIds, character.id];
                                              } else {
                                                newIds = validCurrentIds.filter(id => id !== character.id);
                                              }
                                              setEventBlocks(eventBlocks.map(b =>
                                                b.id === block.id ? { ...b, characterIds: newIds, characterId: newIds[0] || undefined } : b
                                              ));
                                            }}
                                            className="mr-2"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-sm text-white flex items-center gap-1">
                                            {order && <span className="text-xs text-yellow-400 font-bold">[{order}]</span>}
                                            {character.name || '이름 없음'}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">대사 발언 인물</label>
                                <div className="max-h-32 overflow-y-auto block-scroll px-2 py-1 text-sm bg-gray-700 rounded">
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const currentSpeakingIds = Array.isArray(block.speakingCharacterId) ? block.speakingCharacterId : (block.speakingCharacterId ? [block.speakingCharacterId] : []);
                                    const isSelected = currentSpeakingIds.includes(character.id);
                                    return (
                                      <label key={character.id} className="flex items-center gap-2 py-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newSpeakingIds = e.target.checked
                                              ? [...currentSpeakingIds, character.id]
                                              : currentSpeakingIds.filter(id => id !== character.id);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { ...b, speakingCharacterId: newSpeakingIds.length > 0 ? newSpeakingIds : undefined } : b
                                            ));
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-white text-xs">{character.name || '이름 없음'}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">인물 표정</label>
                                <div className={`space-y-2 max-h-40 overflow-y-auto block-scroll-${block.type} px-2 py-1 text-sm bg-gray-700 rounded`}>
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const expression = block.characterExpressions?.[character.id] || 1;
                                    return (
                                      <div key={character.id} className="flex items-center justify-between py-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-white text-xs">{character.name || '이름 없음'}:</span>
                                        <select
                                          value={expression}
                                          onChange={(e) => {
                                            const newExpression = parseInt(e.target.value);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { 
                                                ...b, 
                                                characterExpressions: {
                                                  ...b.characterExpressions,
                                                  [character.id]: newExpression
                                                }
                                              } : b
                                            ));
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value={1}>평소</option>
                                          <option value={2}>화남</option>
                                          <option value={3}>웃음</option>
                                          <option value={4}>놀람</option>
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : block.type === 'reward' ? (
                      <div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">갈레온</label>
                          <input
                            type="number"
                            value={block.rewardGalleon || 0}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, rewardGalleon: parseInt(e.target.value) || 0 } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            placeholder="0"
                            min="0"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">아이템 보상</label>
                          {(block.rewardItems || []).map((item, idx) => (
                            <div key={idx} className="mb-2 p-2 bg-gray-800 rounded">
                              <select
                                value={item.itemId}
                                onChange={(e) => {
                                  setEventBlocks(eventBlocks.map(b => 
                                    b.id === block.id 
                                      ? { 
                                          ...b, 
                                          rewardItems: b.rewardItems?.map((ri, i) => 
                                            i === idx ? { ...ri, itemId: e.target.value } : ri
                                          )
                                        }
                                      : b
                                  ));
                                }}
                                className="w-full px-2 py-1 text-xs bg-gray-700 text-white rounded mb-1"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">아이템 선택</option>
                                {items.length > 0 ? (
                                  items.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                  ))
                                ) : (
                                  <option value="" disabled>아이템을 불러오는 중...</option>
                                )}
                              </select>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  setEventBlocks(eventBlocks.map(b => 
                                    b.id === block.id 
                                      ? { 
                                          ...b, 
                                          rewardItems: b.rewardItems?.map((ri, i) => 
                                            i === idx ? { ...ri, quantity: parseInt(e.target.value) || 1 } : ri
                                          )
                                        }
                                      : b
                                  ));
                                }}
                                className="w-full px-2 py-1 text-xs bg-gray-700 text-white rounded mb-1"
                                placeholder="수량"
                                min="1"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEventBlocks(eventBlocks.map(b => 
                                    b.id === block.id 
                                      ? { ...b, rewardItems: b.rewardItems?.filter((_, i) => i !== idx) }
                                      : b
                                  ));
                                }}
                                className="w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id 
                                  ? { 
                                      ...b, 
                                      rewardItems: [...(b.rewardItems || []), { itemId: '', quantity: 1 }]
                                    }
                                  : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            아이템 추가
                          </button>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">보상 메시지</label>
                          <textarea
                            value={block.rewardMessage || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, rewardMessage: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={3}
                            placeholder="보상 메시지 (*이탤릭, #볼드, /줄바꿈)"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-300">인물 설정</label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedCharacterSections({
                                  ...collapsedCharacterSections,
                                  [block.id]: !collapsedCharacterSections[block.id]
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-200"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {collapsedCharacterSections[block.id] ? '▼' : '▲'}
                            </button>
                          </div>
                          {!collapsedCharacterSections[block.id] && (
                            <>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">등장 인물 (최대 4명)</label>
                                <div className={`space-y-1 max-h-32 overflow-y-auto block-scroll-${block.type}`} style={{ border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '0.25rem', padding: '0.5rem' }}>
                                  {(() => {
                                    const characterIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                    const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                    const validCharacterIds = characterIds
                                      .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                      .filter(id => existingIdSet.has(id));
                                    return eventCharacters.map((character) => {
                                      const isChecked = validCharacterIds.includes(character.id);
                                      const order = isChecked ? validCharacterIds.indexOf(character.id) + 1 : null;
                                      return (
                                        <label key={character.id} className="flex items-center cursor-pointer hover:bg-gray-600 px-2 py-1 rounded" style={{ transition: 'background-color 0.2s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                              const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                              const validCurrentIds = currentIds
                                                .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                                .filter(id => existingIdSet.has(id));
                                              let newIds: string[];
                                              if (e.target.checked) {
                                                if (validCurrentIds.length >= 4) {
                                                  return;
                                                }
                                                newIds = [...validCurrentIds, character.id];
                                              } else {
                                                newIds = validCurrentIds.filter(id => id !== character.id);
                                              }
                                              setEventBlocks(eventBlocks.map(b =>
                                                b.id === block.id ? { ...b, characterIds: newIds, characterId: newIds[0] || undefined } : b
                                              ));
                                            }}
                                            className="mr-2"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-sm text-white flex items-center gap-1">
                                            {order && <span className="text-xs text-yellow-400 font-bold">[{order}]</span>}
                                            {character.name || '이름 없음'}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">대사 발언 인물</label>
                                <div className="max-h-32 overflow-y-auto block-scroll px-2 py-1 text-sm bg-gray-700 rounded">
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const currentSpeakingIds = Array.isArray(block.speakingCharacterId) ? block.speakingCharacterId : (block.speakingCharacterId ? [block.speakingCharacterId] : []);
                                    const isSelected = currentSpeakingIds.includes(character.id);
                                    return (
                                      <label key={character.id} className="flex items-center gap-2 py-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newSpeakingIds = e.target.checked
                                              ? [...currentSpeakingIds, character.id]
                                              : currentSpeakingIds.filter(id => id !== character.id);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { ...b, speakingCharacterId: newSpeakingIds.length > 0 ? newSpeakingIds : undefined } : b
                                            ));
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-white text-xs">{character.name || '이름 없음'}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">인물 표정</label>
                                <div className={`space-y-2 max-h-40 overflow-y-auto block-scroll-${block.type} px-2 py-1 text-sm bg-gray-700 rounded`}>
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const expression = block.characterExpressions?.[character.id] || 1;
                                    return (
                                      <div key={character.id} className="flex items-center justify-between py-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-white text-xs">{character.name || '이름 없음'}:</span>
                                        <select
                                          value={expression}
                                          onChange={(e) => {
                                            const newExpression = parseInt(e.target.value);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { 
                                                ...b, 
                                                characterExpressions: {
                                                  ...b.characterExpressions,
                                                  [character.id]: newExpression
                                                }
                                              } : b
                                            ));
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value={1}>평소</option>
                                          <option value={2}>화남</option>
                                          <option value={3}>웃음</option>
                                          <option value={4}>놀람</option>
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <label className="text-xs text-gray-300 block mb-1">다음 블록 ID</label>
                          <select
                            value={block.nextBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, nextBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음 (종료)</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id} ({b.type === 'dialogue' ? '대사' : b.type === 'choice' ? '선택지' : b.type === 'reward' ? '보상' : '스탯 이벤트'})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : block.type === 'stat' ? (
                      <div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">체크할 스탯</label>
                          <select
                            value={block.statType || 'attack'}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, statType: e.target.value as 'attack' | 'defense' | 'agility' | 'luck' } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="attack">공격</option>
                            <option value="defense">방어</option>
                            <option value="agility">민첩</option>
                            <option value="luck">행운</option>
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">대사</label>
                          <textarea
                            value={block.dialogueText || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, dialogueText: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={3}
                            placeholder="대사를 입력하세요... (*이탤릭, #볼드, /줄바꿈)"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">대성공 메시지</label>
                          <textarea
                            value={block.greatSuccessMessage || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, greatSuccessMessage: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={2}
                            placeholder="대성공 시 표시할 메시지..."
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">대성공 다음 블록 ID</label>
                          <select
                            value={block.greatSuccessBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, greatSuccessBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">성공 메시지</label>
                          <textarea
                            value={block.successMessage || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, successMessage: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={2}
                            placeholder="성공 시 표시할 메시지..."
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">성공 다음 블록 ID</label>
                          <select
                            value={block.successBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, successBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">실패 메시지</label>
                          <textarea
                            value={block.failureMessage || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, failureMessage: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={2}
                            placeholder="실패 시 표시할 메시지..."
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">실패 다음 블록 ID</label>
                          <select
                            value={block.failureBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, failureBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">대실패 메시지</label>
                          <textarea
                            value={block.greatFailureMessage || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, greatFailureMessage: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={2}
                            placeholder="대실패 시 표시할 메시지..."
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">대실패 다음 블록 ID</label>
                          <select
                            value={block.greatFailureBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, greatFailureBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-300">인물 설정</label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedCharacterSections({
                                  ...collapsedCharacterSections,
                                  [block.id]: !collapsedCharacterSections[block.id]
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-200"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {collapsedCharacterSections[block.id] ? '▼' : '▲'}
                            </button>
                          </div>
                          {!collapsedCharacterSections[block.id] && (
                            <>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">등장 인물 (최대 4명)</label>
                                <div className={`space-y-1 max-h-32 overflow-y-auto block-scroll-${block.type}`} style={{ border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '0.25rem', padding: '0.5rem' }}>
                                  {(() => {
                                    const characterIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                    const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                    const validCharacterIds = characterIds
                                      .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                      .filter(id => existingIdSet.has(id));
                                    return eventCharacters.map((character) => {
                                      const isChecked = validCharacterIds.includes(character.id);
                                      const order = isChecked ? validCharacterIds.indexOf(character.id) + 1 : null;
                                      return (
                                        <label key={character.id} className="flex items-center cursor-pointer hover:bg-gray-600 px-2 py-1 rounded" style={{ transition: 'background-color 0.2s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                              const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                              const validCurrentIds = currentIds
                                                .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                                .filter(id => existingIdSet.has(id));
                                              let newIds: string[];
                                              if (e.target.checked) {
                                                if (validCurrentIds.length >= 4) {
                                                  return;
                                                }
                                                newIds = [...validCurrentIds, character.id];
                                              } else {
                                                newIds = validCurrentIds.filter(id => id !== character.id);
                                              }
                                              setEventBlocks(eventBlocks.map(b =>
                                                b.id === block.id ? { ...b, characterIds: newIds, characterId: newIds[0] || undefined } : b
                                              ));
                                            }}
                                            className="mr-2"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-sm text-white flex items-center gap-1">
                                            {order && <span className="text-xs text-yellow-400 font-bold">[{order}]</span>}
                                            {character.name || '이름 없음'}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">대사 발언 인물</label>
                                <div className="max-h-32 overflow-y-auto block-scroll px-2 py-1 text-sm bg-gray-700 rounded">
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const currentSpeakingIds = Array.isArray(block.speakingCharacterId) ? block.speakingCharacterId : (block.speakingCharacterId ? [block.speakingCharacterId] : []);
                                    const isSelected = currentSpeakingIds.includes(character.id);
                                    return (
                                      <label key={character.id} className="flex items-center gap-2 py-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newSpeakingIds = e.target.checked
                                              ? [...currentSpeakingIds, character.id]
                                              : currentSpeakingIds.filter(id => id !== character.id);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { ...b, speakingCharacterId: newSpeakingIds.length > 0 ? newSpeakingIds : undefined } : b
                                            ));
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-white text-xs">{character.name || '이름 없음'}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">인물 표정</label>
                                <div className={`space-y-2 max-h-40 overflow-y-auto block-scroll-${block.type} px-2 py-1 text-sm bg-gray-700 rounded`}>
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const expression = block.characterExpressions?.[character.id] || 1;
                                    return (
                                      <div key={character.id} className="flex items-center justify-between py-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-white text-xs">{character.name || '이름 없음'}:</span>
                                        <select
                                          value={expression}
                                          onChange={(e) => {
                                            const newExpression = parseInt(e.target.value);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { 
                                                ...b, 
                                                characterExpressions: {
                                                  ...b.characterExpressions,
                                                  [character.id]: newExpression
                                                }
                                              } : b
                                            ));
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value={1}>평소</option>
                                          <option value={2}>화남</option>
                                          <option value={3}>웃음</option>
                                          <option value={4}>놀람</option>
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : block.type === 'lock' ? (
                      <div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">대사</label>
                          <textarea
                            value={block.dialogueText || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, dialogueText: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            rows={3}
                            placeholder="대사를 입력하세요... (*이탤릭, #볼드, /줄바꿈)"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">암호</label>
                          <input
                            type="text"
                            value={block.password || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, password: e.target.value } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            placeholder="암호 입력..."
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">암호 맞았을 때 다음 블록 ID</label>
                          <select
                            value={block.correctBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, correctBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음 (종료)</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id} ({b.type === 'dialogue' ? '대사' : b.type === 'choice' ? '선택지' : b.type === 'reward' ? '보상' : b.type === 'stat' ? '스탯 이벤트' : '잠금'})</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-300 block mb-1">암호 틀렸을 때 다음 블록 ID</label>
                          <select
                            value={block.incorrectBlockId || ''}
                            onChange={(e) => {
                              setEventBlocks(eventBlocks.map(b => 
                                b.id === block.id ? { ...b, incorrectBlockId: e.target.value || undefined } : b
                              ));
                            }}
                            className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">없음 (종료)</option>
                            {eventBlocks.filter(b => b.id !== block.id).map(b => (
                              <option key={b.id} value={b.id}>{b.id} ({b.type === 'dialogue' ? '대사' : b.type === 'choice' ? '선택지' : b.type === 'reward' ? '보상' : b.type === 'stat' ? '스탯 이벤트' : '잠금'})</option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-300">인물 설정</label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedCharacterSections({
                                  ...collapsedCharacterSections,
                                  [block.id]: !collapsedCharacterSections[block.id]
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-200"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {collapsedCharacterSections[block.id] ? '▼' : '▲'}
                            </button>
                          </div>
                          {!collapsedCharacterSections[block.id] && (
                            <>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">등장 인물 (최대 4명)</label>
                                <div className={`space-y-1 max-h-32 overflow-y-auto block-scroll-${block.type}`} style={{ border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '0.25rem', padding: '0.5rem' }}>
                                  {(() => {
                                    const characterIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                    const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                    const validCharacterIds = characterIds
                                      .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                      .filter(id => existingIdSet.has(id));
                                    return eventCharacters.map((character) => {
                                      const isChecked = validCharacterIds.includes(character.id);
                                      const order = isChecked ? validCharacterIds.indexOf(character.id) + 1 : null;
                                      return (
                                        <label key={character.id} className="flex items-center cursor-pointer hover:bg-gray-600 px-2 py-1 rounded" style={{ transition: 'background-color 0.2s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentIds = block.characterIds || (block.characterId ? [block.characterId] : []);
                                              const existingIdSet = new Set(eventCharacters.map(c => c.id));
                                              const validCurrentIds = currentIds
                                                .filter(id => id && typeof id === 'string' && id.trim().length > 0)
                                                .filter(id => existingIdSet.has(id));
                                              let newIds: string[];
                                              if (e.target.checked) {
                                                if (validCurrentIds.length >= 4) {
                                                  return;
                                                }
                                                newIds = [...validCurrentIds, character.id];
                                              } else {
                                                newIds = validCurrentIds.filter(id => id !== character.id);
                                              }
                                              setEventBlocks(eventBlocks.map(b =>
                                                b.id === block.id ? { ...b, characterIds: newIds, characterId: newIds[0] || undefined } : b
                                              ));
                                            }}
                                            className="mr-2"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-sm text-white flex items-center gap-1">
                                            {order && <span className="text-xs text-yellow-400 font-bold">[{order}]</span>}
                                            {character.name || '이름 없음'}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">대사 발언 인물</label>
                                <div className="max-h-32 overflow-y-auto block-scroll px-2 py-1 text-sm bg-gray-700 rounded">
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const currentSpeakingIds = Array.isArray(block.speakingCharacterId) ? block.speakingCharacterId : (block.speakingCharacterId ? [block.speakingCharacterId] : []);
                                    const isSelected = currentSpeakingIds.includes(character.id);
                                    return (
                                      <label key={character.id} className="flex items-center gap-2 py-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newSpeakingIds = e.target.checked
                                              ? [...currentSpeakingIds, character.id]
                                              : currentSpeakingIds.filter(id => id !== character.id);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { ...b, speakingCharacterId: newSpeakingIds.length > 0 ? newSpeakingIds : undefined } : b
                                            ));
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-white text-xs">{character.name || '이름 없음'}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="mb-2">
                                <label className="text-xs text-gray-300 block mb-1">인물 표정</label>
                                <div className={`space-y-2 max-h-40 overflow-y-auto block-scroll-${block.type} px-2 py-1 text-sm bg-gray-700 rounded`}>
                                  {((block.characterIds || []).filter(id => id && typeof id === 'string' && id.trim().length > 0)).map(characterId => {
                                    const character = eventCharacters.find(c => c.id === characterId);
                                    if (!character) return null;
                                    const expression = block.characterExpressions?.[character.id] || 1;
                                    return (
                                      <div key={character.id} className="flex items-center justify-between py-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-white text-xs">{character.name || '이름 없음'}:</span>
                                        <select
                                          value={expression}
                                          onChange={(e) => {
                                            const newExpression = parseInt(e.target.value);
                                            setEventBlocks(eventBlocks.map(b =>
                                              b.id === block.id ? { 
                                                ...b, 
                                                characterExpressions: {
                                                  ...b.characterExpressions,
                                                  [character.id]: newExpression
                                                }
                                              } : b
                                            ));
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value={1}>평소</option>
                                          <option value={2}>화남</option>
                                          <option value={3}>웃음</option>
                                          <option value={4}>놀람</option>
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const blockIdToDelete = block.id;
                        setEventBlocks(prevBlocks => {
                          const filtered = prevBlocks.filter(b => b.id !== blockIdToDelete);
                          setSavedEventBlocks(JSON.parse(JSON.stringify(filtered)));
                          return filtered;
                        });
                      }}
                      className="mt-2 w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      블록 삭제
                    </button>
                  </div>
                    );
                  })}
                  <svg
                  className="absolute pointer-events-none"
                  style={{ 
                    zIndex: 0, 
                    left: 0, 
                    top: 0, 
                    width: eventBlocks.length > 0 ? `${Math.max(1200, Math.max(...eventBlocks.map(b => b.position.x + 400)))}px` : '100%',
                    height: eventBlocks.length > 0 ? `${Math.max(800, Math.max(...eventBlocks.map(b => b.position.y + 500)))}px` : '100%',
                    overflow: 'visible'
                  }}
                >
                  <defs>
                    <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#4299e1" />
                    </marker>
                    <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#48bb78" />
                    </marker>
                    <marker id="arrowhead-yellow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#fbbf24" />
                    </marker>
                    <marker id="arrowhead-purple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
                    </marker>
                  </defs>
                  {eventBlocks.map((block) => {
                    if ((block.type === 'dialogue' || block.type === 'reward' || block.type === 'stat') && block.nextBlockId) {
                      const nextBlock = eventBlocks.find(b => b.id === block.nextBlockId);
                      if (nextBlock) {
                        const strokeColor = block.type === 'dialogue' ? '#4299e1' : block.type === 'reward' ? '#fbbf24' : '#a855f7';
                        const markerId = block.type === 'dialogue' ? 'arrowhead-blue' : block.type === 'reward' ? 'arrowhead-yellow' : 'arrowhead-purple';
                        const estimateBlockHeight = block.type === 'reward' ? 380 : block.type === 'dialogue' ? 200 : block.type === 'stat' ? 250 : 150;
                        const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                        return (
                          <line
                            key={`conn_${block.id}`}
                            x1={block.position.x + 125}
                            y1={block.position.y + estimateBlockHeight}
                            x2={nextBlock.position.x + 125}
                            y2={nextBlockY}
                            stroke={strokeColor}
                            strokeWidth="2"
                            markerEnd={`url(#${markerId})`}
                          />
                        );
                      }
                    } else if (block.type === 'lock') {
                      // 잠금 블록의 연결선 (맞았을 때, 틀렸을 때)
                      const lockBlockHeight = 200;
                      const connections: React.ReactNode[] = [];
                      
                      if (block.correctBlockId) {
                        const nextBlock = eventBlocks.find(b => b.id === block.correctBlockId);
                        if (nextBlock) {
                          const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                          connections.push(
                            <line
                              key={`conn_${block.id}_correct`}
                              x1={block.position.x + 125}
                              y1={block.position.y + lockBlockHeight}
                              x2={nextBlock.position.x + 125}
                              y2={nextBlockY}
                              stroke="#16a34a"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead-green)"
                            />
                          );
                        }
                      }
                      if (block.incorrectBlockId) {
                        const nextBlock = eventBlocks.find(b => b.id === block.incorrectBlockId);
                        if (nextBlock) {
                          const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                          connections.push(
                            <line
                              key={`conn_${block.id}_incorrect`}
                              x1={block.position.x + 125}
                              y1={block.position.y + lockBlockHeight}
                              x2={nextBlock.position.x + 125}
                              y2={nextBlockY}
                              stroke="#dc2626"
                              strokeWidth="2"
                              strokeDasharray="3,3"
                              markerEnd="url(#arrowhead-red)"
                            />
                          );
                        }
                      }
                      
                      return connections.length > 0 ? connections : null;
                    } else if (block.type === 'stat') {
                      // 스탯 이벤트 블록의 각 결과에 대한 연결선
                      const statBlockHeight = 250;
                      const connections: React.ReactNode[] = [];
                      
                      if (block.greatSuccessBlockId) {
                        const nextBlock = eventBlocks.find(b => b.id === block.greatSuccessBlockId);
                        if (nextBlock) {
                          const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                          connections.push(
                            <line
                              key={`conn_${block.id}_greatSuccess`}
                              x1={block.position.x + 125}
                              y1={block.position.y + statBlockHeight}
                              x2={nextBlock.position.x + 125}
                              y2={nextBlockY}
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              markerEnd="url(#arrowhead-purple)"
                            />
                          );
                        }
                      }
                      if (block.successBlockId) {
                        const nextBlock = eventBlocks.find(b => b.id === block.successBlockId);
                        if (nextBlock) {
                          const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                          connections.push(
                            <line
                              key={`conn_${block.id}_success`}
                              x1={block.position.x + 125}
                              y1={block.position.y + statBlockHeight}
                              x2={nextBlock.position.x + 125}
                              y2={nextBlockY}
                              stroke="#a855f7"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead-purple)"
                            />
                          );
                        }
                      }
                      if (block.failureBlockId) {
                        const nextBlock = eventBlocks.find(b => b.id === block.failureBlockId);
                        if (nextBlock) {
                          const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                          connections.push(
                            <line
                              key={`conn_${block.id}_failure`}
                              x1={block.position.x + 125}
                              y1={block.position.y + statBlockHeight}
                              x2={nextBlock.position.x + 125}
                              y2={nextBlockY}
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeDasharray="3,3"
                              markerEnd="url(#arrowhead-purple)"
                            />
                          );
                        }
                      }
                      if (block.greatFailureBlockId) {
                        const nextBlock = eventBlocks.find(b => b.id === block.greatFailureBlockId);
                        if (nextBlock) {
                          const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                          connections.push(
                            <line
                              key={`conn_${block.id}_greatFailure`}
                              x1={block.position.x + 125}
                              y1={block.position.y + statBlockHeight}
                              x2={nextBlock.position.x + 125}
                              y2={nextBlockY}
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              markerEnd="url(#arrowhead-purple)"
                            />
                          );
                        }
                      }
                      
                      return connections.length > 0 ? connections : null;
                    } else if (block.type === 'choice' && block.choices) {
                      const choiceBlockHeight = 200;
                      return block.choices.map((choice) => {
                        if (choice.nextBlockId) {
                          const nextBlock = eventBlocks.find(b => b.id === choice.nextBlockId);
                          if (nextBlock) {
                            const nextBlockY = nextBlock.type === 'reward' ? nextBlock.position.y + 20 : nextBlock.position.y;
                            return (
                              <line
                                key={`conn_${block.id}_${choice.id}`}
                                x1={block.position.x + 125}
                                y1={block.position.y + choiceBlockHeight}
                                x2={nextBlock.position.x + 125}
                                y2={nextBlockY}
                                stroke="#48bb78"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead-green)"
                              />
                            );
                          }
                        }
                        return null;
                      });
                    }
                    return null;
                  })}
                </svg>
                </div>
                </div>
              </div>
              {showCharacterList ? (
                <div className="flex-1 rounded-lg flex flex-col min-w-[250px] max-w-[300px]" style={{ background: 'rgba(35, 31, 32, 1)', border: '1px solid rgba(223,190,106,0.3)', maxHeight: 'calc(100vh - 8rem)' }}>
                  <div className="flex-shrink-0 pb-4 pt-8 px-4 border-b" style={{ borderColor: 'rgba(223,190,106,0.3)' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ color: 'rgba(223,190,106,0.9)' }}>인물 목록</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newCharacter: EventCharacter = {
                              id: `char_${Date.now()}`,
                              name: '',
                              portraitImage: ''
                            };
                            const updated = [...eventCharacters, newCharacter];
                            setEventCharacters(updated);
                            setEditingCharacterIds(prev => new Set(prev).add(newCharacter.id));
                            setTimeout(() => saveEventCharacters(), 100);
                          }}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                        >
                          추가
                        </button>
                        <button
                          onClick={() => setShowCharacterList(false)}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                        >
                          ◀
                        </button>
                      </div>
                    </div>
                  </div>
                <div 
                  className="flex-1 overflow-y-auto px-4 py-4 character-list-scroll"
                >
                  {eventCharacters.map((character, index) => {
                    const isEditing = editingCharacterIds.has(character.id);
                    return (
                      <div
                        key={character.id}
                        className="p-2 rounded mb-2"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid rgba(223,190,106,0.3)',
                          color: '#fff'
                        }}
                      >
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              {character.portraitImage ? (
                                <img
                                  src={`/dialogue/${character.portraitImage}.png`}
                                  alt={character.name || '인물'}
                                  className="w-10 h-10 object-cover rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '';
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(223,190,106,0.3)' }}></div>
                              )}
                              <input
                                type="text"
                                value={character.name}
                                onChange={(e) => {
                                  const updated = [...eventCharacters];
                                  updated[index] = { ...character, name: e.target.value };
                                  setEventCharacters(updated);
                                }}
                                placeholder="인물 이름"
                                className="flex-1 px-2 py-1 text-sm bg-black border border-yellow-900 text-white rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <input
                              type="text"
                              value={character.portraitImage}
                              onChange={(e) => {
                                const updated = [...eventCharacters];
                                updated[index] = { ...character, portraitImage: e.target.value };
                                setEventCharacters(updated);
                              }}
                              placeholder="PNG 파일명 (예: character1)"
                              className="w-full px-2 py-1 text-xs bg-black border border-yellow-900 text-white rounded mb-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (character.name.trim() && character.portraitImage.trim()) {
                                    setEditingCharacterIds(prev => {
                                      const next = new Set(prev);
                                      next.delete(character.id);
                                      return next;
                                    });
                                    if (selectedBlockId) {
                                      setEventBlocks(eventBlocks.map(b =>
                                        b.id === selectedBlockId ? { ...b, characterId: character.id } : b
                                      ));
                                    }
                                    await saveEventCharacters();
                                  }
                                }}
                                className="btn flex-1"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                              >
                                확인
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const charId = character.id;
                                  const updated = eventCharacters.filter((_, i) => i !== index);
                                  setEventCharacters(updated);
                                  setEventBlocks(eventBlocks.map(b => {
                                    const nextCharacterIds = (b.characterIds || []).filter(id => id !== charId);
                                    const currentSpeakingIds = Array.isArray(b.speakingCharacterId) ? b.speakingCharacterId : (b.speakingCharacterId ? [b.speakingCharacterId] : []);
                                    const nextSpeakingIds = currentSpeakingIds.filter(id => id !== charId);
                                    return {
                                      ...b,
                                      characterIds: nextCharacterIds.length > 0 ? nextCharacterIds : undefined,
                                      characterId: b.characterId === charId ? (nextCharacterIds[0] || undefined) : b.characterId,
                                      speakingCharacterId: nextSpeakingIds.length > 0 ? nextSpeakingIds : undefined
                                    };
                                  }));
                                  setEditingCharacterIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(charId);
                                    return next;
                                  });
                                  await saveEventCharacters();
                                }}
                                className="btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0, background: 'rgba(220, 38, 38, 0.8)' }}
                              >
                                삭제
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {character.portraitImage && (
                              <img
                                src={`/dialogue/${character.portraitImage}.png`}
                                alt={character.name || '인물'}
                                className="w-full h-32 object-cover rounded mb-2"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '';
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-white text-sm font-medium">
                                {character.name || '이름 없음'}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCharacterIds(prev => new Set(prev).add(character.id));
                                  }}
                                  className="btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                                >
                                  수정
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const charId = character.id;
                                    const updated = eventCharacters.filter((_, i) => i !== index);
                                    setEventCharacters(updated);
                                    setEventBlocks(eventBlocks.map(b => {
                                      const nextCharacterIds = (b.characterIds || []).filter(id => id !== charId);
                                      return {
                                        ...b,
                                        characterIds: nextCharacterIds.length > 0 ? nextCharacterIds : undefined,
                                        characterId: b.characterId === charId ? (nextCharacterIds[0] || undefined) : b.characterId,
                                        speakingCharacterId: b.speakingCharacterId === charId ? undefined : b.speakingCharacterId
                                      };
                                    }));
                                    await saveEventCharacters();
                                  }}
                                  className="btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0, background: 'rgba(220, 38, 38, 0.8)' }}
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {eventCharacters.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-4">
                      인물이 없습니다
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <button
                  onClick={() => setShowCharacterList(true)}
                  className="rounded-lg flex items-center justify-center"
                  style={{ 
                    background: 'rgba(35, 31, 32, 1)', 
                    border: '1px solid rgba(223,190,106,0.3)',
                    width: '50px',
                    height: 'calc(100vh - 8rem)',
                    maxHeight: 'calc(100vh - 8rem)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(35, 31, 32, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(223,190,106,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(35, 31, 32, 1)';
                    e.currentTarget.style.borderColor = 'rgba(223,190,106,0.3)';
                  }}
                >
                  <span style={{ 
                    color: 'rgba(223,190,106,0.9)', 
                    fontSize: '0.875rem',
                    transform: 'rotate(-90deg)',
                    whiteSpace: 'nowrap'
                  }}>인물 목록 ▶</span>
                </button>
              )}
              {showBackgroundList ? (
                <div className="flex-1 rounded-lg flex flex-col min-w-[250px] max-w-[300px]" style={{ background: 'rgba(35, 31, 32, 1)', border: '1px solid rgba(223,190,106,0.3)', maxHeight: 'calc(100vh - 8rem)' }}>
                  <div className="flex-shrink-0 pb-4 pt-8 px-4 border-b" style={{ borderColor: 'rgba(223,190,106,0.3)' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ color: 'rgba(223,190,106,0.9)' }}>배경 목록</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newBackground: EventBackground = {
                              id: `bg_${Date.now()}`,
                              name: '',
                              imageUrl: ''
                            };
                            const updated = [...eventBackgrounds, newBackground];
                            setEventBackgrounds(updated);
                            setEditingBackgroundIds(prev => new Set(prev).add(newBackground.id));
                            setTimeout(() => debouncedSaveEventBackgrounds(), 100);
                          }}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                        >
                          추가
                        </button>
                        <button
                          onClick={() => setShowBackgroundList(false)}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                        >
                          ◀
                        </button>
                      </div>
                    </div>
                  </div>
                <div 
                  className="flex-1 overflow-y-auto px-4 py-4 character-list-scroll"
                >
                  {eventBackgrounds.map((background, index) => {
                    const isEditing = editingBackgroundIds.has(background.id);
                    return (
                      <div
                        key={background.id}
                        className="p-2 rounded mb-2"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid rgba(223,190,106,0.3)',
                          color: '#fff'
                        }}
                      >
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              {background.imageUrl ? (
                                <img
                                  src={`/dialogue_bg/${background.imageUrl}.png`}
                                  alt={background.name || '배경'}
                                  className="w-10 h-10 object-cover rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '';
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(223,190,106,0.3)' }}></div>
                              )}
                              <input
                                type="text"
                                value={background.name}
                                onChange={(e) => {
                                  const updated = [...eventBackgrounds];
                                  updated[index] = { ...background, name: e.target.value };
                                  setEventBackgrounds(updated);
                                }}
                                placeholder="배경 이름"
                                className="flex-1 px-2 py-1 text-sm bg-black border border-yellow-900 text-white rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <input
                              type="text"
                              value={background.imageUrl}
                              onChange={(e) => {
                                const updated = [...eventBackgrounds];
                                updated[index] = { ...background, imageUrl: e.target.value };
                                setEventBackgrounds(updated);
                              }}
                              placeholder="PNG 파일명 (예: hall)"
                              className="w-full px-2 py-1 text-xs bg-black border border-yellow-900 text-white rounded mb-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (background.name.trim() && background.imageUrl.trim()) {
                                    setEditingBackgroundIds(prev => {
                                      const next = new Set(prev);
                                      next.delete(background.id);
                                      return next;
                                    });
                                    debouncedSaveEventBackgrounds();
                                  }
                                }}
                                className="btn flex-1"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                              >
                                확인
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const bgId = background.id;
                                  const updated = eventBackgrounds.filter((_, i) => i !== index);
                                  setEventBackgrounds(updated);
                                  setEditingBackgroundIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(bgId);
                                    return next;
                                  });
                                  debouncedSaveEventBackgrounds();
                                }}
                                className="btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0, background: 'rgba(220, 38, 38, 0.8)' }}
                              >
                                삭제
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {background.imageUrl && (
                              <img
                                src={`/dialogue_bg/${background.imageUrl}.png`}
                                alt={background.name || '배경'}
                                className="w-full h-32 object-cover rounded mb-2"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '';
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-white text-sm font-medium">
                                {background.name || '이름 없음'}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBackgroundIds(prev => new Set(prev).add(background.id));
                                  }}
                                  className="btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0 }}
                                >
                                  수정
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const updated = eventBackgrounds.filter((_, i) => i !== index);
                                    setEventBackgrounds(updated);
                                    debouncedSaveEventBackgrounds();
                                  }}
                                  className="btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', margin: 0, background: 'rgba(220, 38, 38, 0.8)' }}
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {eventBackgrounds.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-4">
                      배경이 없습니다
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <button
                  onClick={() => setShowBackgroundList(true)}
                  className="rounded-lg flex items-center justify-center"
                  style={{ 
                    background: 'rgba(35, 31, 32, 1)', 
                    border: '1px solid rgba(223,190,106,0.3)',
                    width: '50px',
                    height: 'calc(100vh - 8rem)',
                    maxHeight: 'calc(100vh - 8rem)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(35, 31, 32, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(223,190,106,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(35, 31, 32, 1)';
                    e.currentTarget.style.borderColor = 'rgba(223,190,106,0.3)';
                  }}
                >
                  <span style={{ 
                    color: 'rgba(223,190,106,0.9)', 
                    fontSize: '0.875rem',
                    transform: 'rotate(-90deg)',
                    whiteSpace: 'nowrap'
                  }}>배경 목록 ▶</span>
                </button>
              )}
          </div>
        </div>
      )}
      {/* 조사지점 정보 모달 */}
      {selectedPoint && showPointInfoModal && (
        <>
          <div className="fixed inset-0 pointer-events-none" style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 20
          }} />
          <div className="fixed pointer-events-auto" style={{ 
            zIndex: 30,
            left: mapImageSize ? `${(selectedPoint.positionX / 100) * mapImageSize.renderWidth + mapImageSize.offsetX + 200}px` : '50%',
            top: mapImageSize ? `${(selectedPoint.positionY / 100) * mapImageSize.renderHeight + mapImageSize.offsetY}px` : '50%',
            transform: 'translateY(-50%)'
          }}>
            <div className="rounded-lg p-6 relative" style={{ 
              background: 'rgba(35, 31, 32, 1)', 
              border: '1px solid rgba(223,190,106,0.3)',
              width: '400px',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => {
                  setShowPointInfoModal(false);
                  setSelectedPoint(null);
                }}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '0.875rem', 
                  margin: 0,
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(223,190,106,0.7)',
                  cursor: 'pointer',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  zIndex: 1
                }}
              >
                ← 뒤로
              </button>
              <div className="flex-1 flex flex-col justify-center items-center text-center px-4 overflow-y-auto" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                <h2 className="text-xl font-bold mb-3" style={{ color: 'rgba(223,190,106,0.9)', flexShrink: 0 }}>{selectedPoint.name}</h2>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-white">{selectedPoint.description}</p>
              </div>
              <div className="flex justify-center" style={{ flexShrink: 0, marginTop: '1rem' }}>
                <button
                  onClick={handleStartInvestigation}
                  className="btn"
                  style={{ padding: '10px 20px', fontSize: '0.875rem', margin: 0 }}
                >
                  조사하기
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 지도 생성/수정 폼 (메인 화면) */}
      {isAdmin && showMapForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-4">{editingMapId ? '지도 수정' : '지도 생성'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">지도 이름</label>
                <input
                  type="text"
                  value={mapFormData.name}
                  onChange={(e) => setMapFormData({ ...mapFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea
                  value={mapFormData.description}
                  onChange={(e) => setMapFormData({ ...mapFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-black"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">지도 이미지 URL</label>
                <input
                  type="text"
                  value={mapFormData.imageUrl}
                  onChange={(e) => setMapFormData({ ...mapFormData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-black"
                  required
                  placeholder="https://example.com/map.png"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={mapFormData.isActive}
                  onChange={(e) => setMapFormData({ ...mapFormData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">활성화</label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              {editingMapId ? (
                <button
                  onClick={handleUpdateMap}
                  className="btn"
                >
                  수정
                </button>
              ) : (
                <button
                  onClick={handleCreateMap}
                  className="btn"
                >
                  생성
                </button>
              )}
              <button
                onClick={() => {
                  setShowMapForm(false);
                  setEditingMapId(null);
                  setMapFormData({
                    name: '',
                    description: '',
                    imageUrl: '',
                    isActive: true
                  });
                }}
                className="btn"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;

