import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

interface Character {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  portraitImage?: string;
  profileImage?: string;
  description?: string;
  attack: number;
  defense: number;
  agility: number;
  luck: number;
  hp: number;
  maxHp: number;
  galleon: number;
  house?: string;
  user: {
    id: string;
    username: string;
  };
}

const AdminCharacters = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    displayName: '',
    portraitImage: '',
    profileImage: '',
    description: '',
    attack: 1,
    defense: 1,
    agility: 1,
    luck: 1,
    hp: 100,
    maxHp: 100,
    galleon: 0,
    house: ''
  });

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/character/admin/all');
      setCharacters(response.data);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacterId(character.id);
    setFormData({
      userId: character.userId,
      name: character.name,
      displayName: character.displayName || '',
      portraitImage: character.portraitImage || '',
      profileImage: character.profileImage || '',
      description: character.description || '',
      attack: character.attack,
      defense: character.defense,
      agility: character.agility,
      luck: character.luck,
      hp: character.hp,
      maxHp: character.maxHp,
      galleon: character.galleon,
      house: character.house || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (characterId: string) => {
    if (!confirm('정말 이 캐릭터를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/character/${characterId}`);
      fetchCharacters();
      alert('캐릭터가 삭제되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '캐릭터 삭제 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const characterData: any = {
        name: formData.name,
        displayName: formData.displayName || null,
        portraitImage: formData.portraitImage || null,
        profileImage: formData.profileImage || null,
        description: formData.description || null,
        attack: Math.max(1, Math.min(5, formData.attack)),
        defense: Math.max(1, Math.min(5, formData.defense)),
        agility: Math.max(1, Math.min(5, formData.agility)),
        luck: Math.max(1, Math.min(5, formData.luck)),
        hp: formData.hp,
        maxHp: formData.maxHp,
        galleon: formData.galleon,
        house: formData.house || null
      };

      if (editingCharacterId) {
        await api.put(`/character/${editingCharacterId}`, characterData);
        alert('캐릭터가 수정되었습니다.');
      } else {
        if (formData.userId) {
          characterData.userId = formData.userId;
        }
        await api.post('/character', characterData);
        alert('캐릭터가 생성되었습니다.');
      }

      setShowAddForm(false);
      setEditingCharacterId(null);
      setFormData({
        userId: '',
        name: '',
        displayName: '',
        portraitImage: '',
        profileImage: '',
        description: '',
        attack: 1,
        defense: 1,
        agility: 1,
        luck: 1,
        hp: 100,
        maxHp: 100,
        galleon: 0,
        house: ''
      });
      fetchCharacters();
    } catch (error: any) {
      alert(error.response?.data?.error || '캐릭터 저장 실패');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">캐릭터 관리</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingCharacterId(null);
            setFormData({
              userId: '',
              name: '',
              displayName: '',
              portraitImage: '',
              profileImage: '',
              description: '',
              attack: 1,
              defense: 1,
              agility: 1,
              luck: 1,
              hp: 100,
              maxHp: 100,
              galleon: 0,
              house: ''
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showAddForm ? '취소' : '캐릭터 추가'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingCharacterId ? '캐릭터 수정' : '캐릭터 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingCharacterId && (
              <div>
                <label className="block text-white mb-2">사용자 ID (선택사항)</label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                  placeholder="비워두면 현재 사용자에게 생성"
                />
              </div>
            )}
            <div>
              <label className="block text-white mb-2">이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">표시 이름</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-white mb-2">초상화 이미지</label>
              <input
                type="text"
                value={formData.portraitImage}
                onChange={(e) => setFormData({ ...formData, portraitImage: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                placeholder="예: martin"
              />
            </div>
            <div>
              <label className="block text-white mb-2">프로필 이미지</label>
              <input
                type="text"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-white mb-2">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-white mb-2">공격 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.attack}
                  onChange={(e) => setFormData({ ...formData, attack: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-white mb-2">방어 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.defense}
                  onChange={(e) => setFormData({ ...formData, defense: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-white mb-2">민첩 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.agility}
                  onChange={(e) => setFormData({ ...formData, agility: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-white mb-2">행운 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.luck}
                  onChange={(e) => setFormData({ ...formData, luck: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">HP</label>
                <input
                  type="number"
                  min="1"
                  value={formData.hp}
                  onChange={(e) => setFormData({ ...formData, hp: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-white mb-2">최대 HP</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxHp}
                  onChange={(e) => setFormData({ ...formData, maxHp: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">골드</label>
                <input
                  type="number"
                  min="0"
                  value={formData.galleon}
                  onChange={(e) => setFormData({ ...formData, galleon: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-white mb-2">기숙사</label>
                <input
                  type="text"
                  value={formData.house}
                  onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                {editingCharacterId ? '수정' : '생성'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCharacterId(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">캐릭터 목록 ({characters.length}개)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">이름</th>
                <th className="text-left p-2">표시 이름</th>
                <th className="text-left p-2">사용자</th>
                <th className="text-left p-2">스탯</th>
                <th className="text-left p-2">HP</th>
                <th className="text-left p-2">골드</th>
                <th className="text-left p-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id} className="border-b border-gray-700">
                  <td className="p-2">{character.name}</td>
                  <td className="p-2">{character.displayName || '-'}</td>
                  <td className="p-2">{character.user.username}</td>
                  <td className="p-2">
                    공{character.attack} 방{character.defense} 민{character.agility} 행{character.luck}
                  </td>
                  <td className="p-2">{character.hp}/{character.maxHp}</td>
                  <td className="p-2">{character.galleon}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(character)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(character.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCharacters;
