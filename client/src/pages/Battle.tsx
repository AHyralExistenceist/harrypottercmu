import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Monster {
  id: string;
  name: string;
  imageUrl?: string;
  usesAttack: boolean;
  usesDefense: boolean;
  usesAgility: boolean;
  attackStat?: number;
  defenseStat?: number;
  agilityStat?: number;
}

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  currentTurn: 'player' | 'monster' | 'defense';
  turnNumber: number;
  lastAction?: {
    actor: 'player' | 'monster';
    action: string;
    diceRoll: number;
    success: boolean;
    damage?: number;
    message: string;
  };
  pendingMonsterAttack?: {
    diceRoll: number;
    baseDamage: number;
  };
  battleResult?: 'victory' | 'defeat' | 'flee';
}

interface UserItem {
  id: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    description?: string;
    type: string;
    effects?: any;
    imageUrl?: string;
  };
}

const Battle = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [showHealMenu, setShowHealMenu] = useState(false);
  const [healItems, setHealItems] = useState<UserItem[]>([]);

  const enemyId = searchParams.get('enemyId');
  const victoryBlockId = searchParams.get('victoryBlockId');
  const defeatBlockId = searchParams.get('defeatBlockId');
  const fleeBlockId = searchParams.get('fleeBlockId');
  const returnPointId = searchParams.get('returnPointId');

  useEffect(() => {
    console.log('Battle useEffect:', { enemyId, authLoading, hasUser: !!user, hasCharacter: !!user?.character, userData: user });
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      setLoading(true);
      return;
    }
    if (!enemyId) {
      console.log('Missing enemyId');
      setLoading(false);
      return;
    }
    if (!user) {
      console.log('User not loaded yet');
      setLoading(false);
      return;
    }
    if (!user.character) {
      console.log('User has no character');
      setLoading(false);
      return;
    }
    fetchMonster();
    fetchHealItems();
  }, [enemyId, user, authLoading]);

  const fetchHealItems = async () => {
    try {
      const response = await api.get('/shop/my-items');
      const allItems: UserItem[] = response.data || [];
      const consumables = allItems.filter((userItem: UserItem) => {
        const item = userItem.item;
        if (item.type !== 'consumable') return false;
        if (!item.effects) return false;
        const effects = typeof item.effects === 'string' ? JSON.parse(item.effects) : item.effects;
        return effects.hp || effects.heal || effects.restoreHp;
      });
      setHealItems(consumables);
    } catch (error) {
      console.error('Error fetching heal items:', error);
      setHealItems([]);
    }
  };

  const handleUseHealItem = async (userItem: UserItem) => {
    if (!battleState || !user?.character || isProcessing || battleState.battleResult) return;
    if (battleState.currentTurn !== 'player') return;
    if (userItem.quantity <= 0) return;

    try {
      setIsProcessing(true);
      const effects = typeof userItem.item.effects === 'string' 
        ? JSON.parse(userItem.item.effects) 
        : userItem.item.effects;
      
      const healAmount = effects.hp || effects.heal || effects.restoreHp || 0;
      
      if (healAmount > 0) {
        const newState = { ...battleState };
        const newHp = Math.min(newState.playerMaxHp, newState.playerHp + healAmount);
        const actualHeal = newHp - newState.playerHp;
        newState.playerHp = newHp;
        
        newState.lastAction = {
          actor: 'player',
          action: 'HEAL',
          diceRoll: 0,
          success: true,
          message: `${userItem.item.name}을(를) 사용했습니다! HP +${actualHeal} (${newState.playerHp}/${newState.playerMaxHp})`
        };
        
        setBattleState(newState);
        
        await api.post('/shop/use-item', {
          userItemId: userItem.id,
          quantity: 1
        });
        
        await fetchHealItems();
        setShowHealMenu(false);
      }
    } catch (error) {
      console.error('Error using heal item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchMonster = async () => {
    if (!enemyId) {
      console.log('No enemyId provided');
      return;
    }
    console.log('Fetching monster with enemyId:', enemyId);
    try {
      try {
        const monsterResponse = await api.get(`/map/monster/${enemyId}`);
        console.log('Found monster directly:', monsterResponse.data);
        setMonster(monsterResponse.data);
        initializeBattle(monsterResponse.data);
        setLoading(false);
        return;
      } catch (directError: any) {
        console.log('Direct monster fetch failed, trying map search:', directError.response?.status);
      }

      let maps: any[] = [];
      try {
        const mapsResponse = await api.get('/map/admin/all');
        maps = mapsResponse.data;
        console.log('Found maps (admin):', maps.length);
      } catch (adminError) {
        console.log('Admin API failed, trying list API');
        try {
          const mapsResponse = await api.get('/map/list');
          maps = mapsResponse.data;
          console.log('Found maps (list):', maps.length);
        } catch (listError) {
          console.error('Both map APIs failed:', listError);
          setLoading(false);
          return;
        }
      }
      
      for (const map of maps) {
        try {
          const monstersResponse = await api.get(`/map/${map.id}/monsters`);
          const monsters = Array.isArray(monstersResponse.data) ? monstersResponse.data : [];
          console.log(`Map ${map.id} has ${monsters.length} monsters:`, monsters.map((m: Monster) => ({ id: m.id, name: m.name })));
          const foundMonster = monsters.find((m: Monster) => m.id === enemyId);
          if (foundMonster) {
            console.log('Found monster:', foundMonster);
            setMonster(foundMonster);
            initializeBattle(foundMonster);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error(`Error fetching monsters for map ${map.id}:`, error);
          continue;
        }
      }
      console.log('Monster not found with enemyId:', enemyId);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching monster:', error);
      setLoading(false);
    }
  };

  const initializeBattle = (monsterData: Monster) => {
    if (!user?.character) return;
    setBattleState({
      playerHp: user.character.hp,
      playerMaxHp: user.character.maxHp,
      monsterHp: 100,
      monsterMaxHp: 100,
      currentTurn: 'player',
      turnNumber: 1
    });
  };

  const rollDice = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  const calculateDamage = (diceRoll: number): number => {
    switch (diceRoll) {
      case 1: return 30;
      case 2: return 25;
      case 3: return 20;
      case 4: return 10;
      case 5: return 5;
      default: return 0;
    }
  };

  const handlePlayerAction = async (action: 'ATTACK' | 'FLEE') => {
    if (!battleState || !user?.character || isProcessing || battleState.battleResult) return;
    if (battleState.currentTurn !== 'player') return;

    setIsProcessing(true);
    setDiceRolling(true);
    setDiceValue(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const diceRoll = rollDice();
    setDiceValue(diceRoll);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setDiceRolling(false);

    let newState = { ...battleState };
    let message = '';

    switch (action) {
      case 'ATTACK': {
        const success = diceRoll <= user.character.attack;
        if (success) {
          const damage = calculateDamage(diceRoll);
          newState.monsterHp = Math.max(0, newState.monsterHp - damage);
          message = `공격 성공! 주사위: ${diceRoll}, 데미지: ${damage}`;
          newState.lastAction = {
            actor: 'player',
            action: 'ATTACK',
            diceRoll,
            success: true,
            damage,
            message
          };
        } else {
          message = `공격 실패! 주사위: ${diceRoll} (공격 스탯: ${user.character.attack})`;
          newState.lastAction = {
            actor: 'player',
            action: 'ATTACK',
            diceRoll,
            success: false,
            message
          };
        }
        break;
      }
      case 'FLEE': {
        const success = diceRoll <= user.character.agility;
        if (success) {
          newState.battleResult = 'flee';
          message = `도주 성공! 주사위: ${diceRoll}`;
          newState.lastAction = {
            actor: 'player',
            action: 'FLEE',
            diceRoll,
            success: true,
            message
          };
          setBattleState(newState);
          handleBattleEnd('flee');
          setIsProcessing(false);
          return;
        } else {
          message = `도주 실패! 주사위: ${diceRoll} (민첩 스탯: ${user.character.agility}) - 몬스터의 공격을 받습니다.`;
          newState.lastAction = {
            actor: 'player',
            action: 'FLEE',
            diceRoll,
            success: false,
            message
          };
        }
        break;
      }
    }

    if (newState.monsterHp <= 0) {
      newState.battleResult = 'victory';
      setBattleState(newState);
      handleBattleEnd('victory');
      setIsProcessing(false);
      return;
    }

    newState.currentTurn = 'monster';
    setBattleState(newState);
    setIsProcessing(false);

    await new Promise(resolve => setTimeout(resolve, 1500));
    handleMonsterTurn(newState, user.character);
  };

  const handleDefenseAction = async (action: 'DEFEND' | 'COUNTER' | 'DODGE') => {
    if (!battleState || !user?.character || isProcessing || battleState.battleResult) return;
    if (battleState.currentTurn !== 'defense' || !battleState.pendingMonsterAttack) return;

    setIsProcessing(true);
    setDiceRolling(true);
    setDiceValue(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const defenseDice = rollDice();
    setDiceValue(defenseDice);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setDiceRolling(false);

    let newState = { ...battleState };
    const { diceRoll: monsterDice, baseDamage } = battleState.pendingMonsterAttack;
    let playerDamage = 0;
    let counterDamage = 0;
    let message = '';

    switch (action) {
      case 'DEFEND': {
        const success = defenseDice <= user.character.defense;
        if (success) {
          const defenseReduction = Math.floor(baseDamage * (user.character.defense / 10));
          playerDamage = Math.max(0, baseDamage - defenseReduction);
          message = `방어 성공! 주사위: ${defenseDice}, 데미지: ${baseDamage} → ${playerDamage} 감소`;
        } else {
          playerDamage = baseDamage;
          message = `방어 실패! 주사위: ${defenseDice} (방어 스탯: ${user.character.defense}), 전체 데미지: ${playerDamage}`;
        }
        break;
      }
      case 'COUNTER': {
        const success = defenseDice <= user.character.luck;
        playerDamage = baseDamage;
        if (success) {
          counterDamage = calculateDamage(defenseDice);
          newState.monsterHp = Math.max(0, newState.monsterHp - counterDamage);
          message = `반격 성공! 주사위: ${defenseDice}, 몬스터에게 ${counterDamage} 데미지 (플레이어는 ${playerDamage} 데미지 받음)`;
        } else {
          message = `반격 실패! 주사위: ${defenseDice} (행운 스탯: ${user.character.luck}), 전체 데미지: ${playerDamage}`;
        }
        break;
      }
      case 'DODGE': {
        const success = defenseDice <= user.character.agility;
        if (success) {
          playerDamage = 0;
          message = `회피 성공! 주사위: ${defenseDice}, 데미지 없음`;
        } else {
          playerDamage = baseDamage;
          message = `회피 실패! 주사위: ${defenseDice} (민첩 스탯: ${user.character.agility}), 전체 데미지: ${playerDamage}`;
        }
        break;
      }
    }

    newState.playerHp = Math.max(0, newState.playerHp - playerDamage);
    newState.pendingMonsterAttack = undefined;
    newState.lastAction = {
      actor: 'monster',
      action: 'ATTACK',
      diceRoll: monsterDice,
      success: playerDamage > 0,
      damage: playerDamage,
      message
    };

    if (newState.playerHp <= 0) {
      newState.battleResult = 'defeat';
      setBattleState(newState);
      handleBattleEnd('defeat');
      setIsProcessing(false);
      return;
    }

    newState.currentTurn = 'player';
    newState.turnNumber += 1;
    setBattleState(newState);
    setIsProcessing(false);
  };

  const handleMonsterTurn = async (prevState: BattleState, character: any) => {
    if (!monster) return;

    setDiceRolling(true);
    setDiceValue(null);
    await new Promise(resolve => setTimeout(resolve, 500));

    const diceRoll = rollDice();
    setDiceValue(diceRoll);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setDiceRolling(false);

    let newState = { ...prevState };

    if (prevState.lastAction?.action === 'FLEE' && !prevState.lastAction.success) {
      if (monster.usesAttack && monster.attackStat) {
        const fleeFailDice = rollDice();
        const monsterAttackSuccess = fleeFailDice <= monster.attackStat;
        if (monsterAttackSuccess) {
          const baseDamage = calculateDamage(fleeFailDice);
          newState.currentTurn = 'defense';
          newState.pendingMonsterAttack = {
            diceRoll: fleeFailDice,
            baseDamage
          };
          setBattleState(newState);
          setIsProcessing(false);
          return;
        } else {
          newState.lastAction = {
            actor: 'monster',
            action: 'ATTACK',
            diceRoll: fleeFailDice,
            success: false,
            message: `도주 실패했지만 몬스터 공격도 실패! 주사위: ${fleeFailDice}`
          };
          newState.currentTurn = 'player';
          newState.turnNumber += 1;
          setBattleState(newState);
          setIsProcessing(false);
          return;
        }
      }
    } else if (monster.usesAttack && monster.attackStat) {
      const monsterAttackSuccess = diceRoll <= monster.attackStat;
      if (monsterAttackSuccess) {
        const baseDamage = calculateDamage(diceRoll);
        newState.currentTurn = 'defense';
        newState.pendingMonsterAttack = {
          diceRoll,
          baseDamage
        };
        setBattleState(newState);
        setIsProcessing(false);
        return;
      } else {
        newState.lastAction = {
          actor: 'monster',
          action: 'ATTACK',
          diceRoll,
          success: false,
          message: `몬스터 공격 실패! 주사위: ${diceRoll}`
        };
        newState.currentTurn = 'player';
        newState.turnNumber += 1;
        setBattleState(newState);
        setIsProcessing(false);
        return;
      }
    } else {
      newState.currentTurn = 'player';
      newState.turnNumber += 1;
      setBattleState(newState);
      setIsProcessing(false);
    }
  };

  const handleBattleEnd = async (result: 'victory' | 'defeat' | 'flee') => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    let nextBlockId = '';
    if (result === 'victory' && victoryBlockId) {
      nextBlockId = victoryBlockId;
    } else if (result === 'defeat' && defeatBlockId) {
      nextBlockId = defeatBlockId;
    } else if (result === 'flee' && fleeBlockId) {
      nextBlockId = fleeBlockId;
    }

    if (nextBlockId && returnPointId) {
      navigate(`/map?pointId=${returnPointId}&blockId=${nextBlockId}`);
    } else if (returnPointId) {
      navigate(`/map?pointId=${returnPointId}`);
    } else {
      navigate('/map');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
        <div className="text-white text-xl">인증 정보를 확인하는 중...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
        <div className="text-white text-xl">전투 준비 중...</div>
        <div className="text-white text-sm">
          <div>enemyId: {enemyId || '없음'}</div>
          <div>user: {user ? '있음' : '없음'}</div>
          <div>character: {user?.character ? '있음' : '없음'}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
        <div className="text-white text-xl">로그인이 필요합니다.</div>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (!user.character) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
        <div className="text-white text-xl">캐릭터가 없습니다.</div>
        <div className="text-white text-sm">전투를 시작하려면 캐릭터가 필요합니다.</div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!monster || !battleState) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
        <div className="text-white text-xl">몬스터 정보를 불러올 수 없습니다.</div>
        <div className="text-white text-sm">
          <div>enemyId: {enemyId || '없음'}</div>
          <div>monster: {monster ? '있음' : '없음'}</div>
          <div>battleState: {battleState ? '있음' : '없음'}</div>
          <div>user.character: {user?.character ? '있음' : '없음'}</div>
        </div>
        <button
          onClick={() => navigate('/map')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          지도로 돌아가기
        </button>
      </div>
    );
  }

  const getFileNameFromPath = (path: string | null | undefined) => {
    if (!path) return '';
    const match = path.match(/\/([^\/]+)\.(png|jpg|jpeg)$/);
    if (match) return match[1];
    const fileNameMatch = path.match(/^([^\/\.]+)(?:\.(png|jpg|jpeg))?$/);
    if (fileNameMatch) return fileNameMatch[1];
    return '';
  };

  const monsterImageName = getFileNameFromPath(monster.imageUrl) || monster.name.toLowerCase();
  const characterImageName = getFileNameFromPath(user.character.portraitImage) || 'portrait';

  return (
    <div className="h-screen flex flex-col" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
      <div className="flex-1 flex items-center justify-center gap-16 px-8">
        <div className="flex flex-col items-center">
          <div className="text-white text-2xl font-bold mb-4">{user.character.displayName || user.character.name}</div>
          <div className="relative" style={{ width: '300px', height: '400px' }}>
            <img
              src={`/${characterImageName}.png`}
              alt={user.character.name}
              className="absolute inset-0 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div className="mt-4 w-full max-w-xs">
            <div className="text-white text-sm mb-1">HP: {battleState.playerHp} / {battleState.playerMaxHp}</div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%`
                }}
              ></div>
            </div>
          </div>
          <div className="mt-2 text-white text-sm">
            공격: {user.character.attack} | 방어: {user.character.defense} | 민첩: {user.character.agility} | 행운: {user.character.luck}
          </div>
        </div>

        <div className="flex flex-col items-center">
          {diceRolling && (
            <div className="mb-8 text-white text-4xl font-bold animate-pulse">
              {diceValue ? `🎲 ${diceValue}` : '🎲'}
            </div>
          )}
          {battleState.lastAction && !diceRolling && (
            <div className="mb-8 px-6 py-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.1)', maxWidth: '400px' }}>
              <div className="text-white text-center whitespace-pre-wrap">
                {battleState.lastAction.message}
              </div>
            </div>
          )}
          {battleState.battleResult && (
            <div className="mb-8 text-white text-4xl font-bold">
              {battleState.battleResult === 'victory' ? '승리!' : 
               battleState.battleResult === 'defeat' ? '패배...' : '도주 성공!'}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="text-white text-2xl font-bold mb-4">{monster.name}</div>
          <div className="relative" style={{ width: '300px', height: '400px' }}>
            {monster.imageUrl ? (
              <img
                src={`/monster/${monsterImageName}.png`}
                alt={monster.name}
                className="absolute inset-0 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded">
                <div className="text-white text-xl">No Image</div>
              </div>
            )}
          </div>
          <div className="mt-4 w-full max-w-xs">
            <div className="text-white text-sm mb-1">HP: {battleState.monsterHp} / {battleState.monsterMaxHp}</div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-red-600 h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${(battleState.monsterHp / battleState.monsterMaxHp) * 100}%`
                }}
              ></div>
            </div>
          </div>
          {monster.attackStat && (
            <div className="mt-2 text-white text-sm">
              공격: {monster.attackStat}
            </div>
          )}
        </div>
      </div>

      {battleState.currentTurn === 'player' && !battleState.battleResult && !isProcessing && (
        <div className="pb-8 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-white text-xl font-bold mb-4 text-center">턴 {battleState.turnNumber} - 당신의 차례 (공격 행동)</div>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handlePlayerAction('ATTACK')}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-lg font-bold transition"
              >
                공격
              </button>
              <button
                onClick={() => setShowHealMenu(true)}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-lg font-bold transition"
              >
                치료
              </button>
              <button
                onClick={() => handlePlayerAction('FLEE')}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-lg font-bold transition"
              >
                도주
              </button>
            </div>
          </div>
        </div>
      )}

      {showHealMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-2xl font-bold">치료제 선택</h2>
              <button
                onClick={() => setShowHealMenu(false)}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            {healItems.length === 0 ? (
              <div className="text-white text-center py-8">
                사용 가능한 치료제가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healItems.map((userItem) => {
                  const effects = typeof userItem.item.effects === 'string' 
                    ? JSON.parse(userItem.item.effects) 
                    : userItem.item.effects;
                  const healAmount = effects.hp || effects.heal || effects.restoreHp || 0;
                  
                  return (
                    <div
                      key={userItem.id}
                      className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition"
                      onClick={() => handleUseHealItem(userItem)}
                    >
                      <div className="flex items-center gap-4">
                        {userItem.item.imageUrl && (
                          <img
                            src={userItem.item.imageUrl}
                            alt={userItem.item.name}
                            className="w-16 h-16 object-contain"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">{userItem.item.name}</h3>
                          <p className="text-gray-300 text-sm">{userItem.item.description}</p>
                          <p className="text-green-400 text-sm mt-1">HP +{healAmount}</p>
                          <p className="text-gray-400 text-xs mt-1">보유: {userItem.quantity}개</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {battleState.currentTurn === 'defense' && !battleState.battleResult && !isProcessing && battleState.pendingMonsterAttack && (
        <div className="pb-8 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-white text-xl font-bold mb-4 text-center">몬스터 공격! 수비 행동을 선택하세요</div>
            <div className="text-white text-center mb-4">
              몬스터 주사위: {battleState.pendingMonsterAttack.diceRoll}, 예상 데미지: {battleState.pendingMonsterAttack.baseDamage}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleDefenseAction('DEFEND')}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-lg font-bold transition"
              >
                방어<br/>(방어 스탯)
              </button>
              <button
                onClick={() => handleDefenseAction('COUNTER')}
                disabled={isProcessing}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-lg font-bold transition"
              >
                반격<br/>(행운 스탯)
              </button>
              <button
                onClick={() => handleDefenseAction('DODGE')}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-lg font-bold transition"
              >
                회피<br/>(민첩 스탯)
              </button>
            </div>
          </div>
        </div>
      )}

      {battleState.currentTurn === 'monster' && !battleState.battleResult && (
        <div className="pb-8 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-white text-xl font-bold mb-4 text-center">턴 {battleState.turnNumber} - 몬스터의 차례</div>
            <div className="text-white text-center">몬스터가 행동을 결정하는 중...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Battle;
