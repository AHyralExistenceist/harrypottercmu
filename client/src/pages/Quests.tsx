import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  questType?: string;
  dayOfWeek?: number | null;
  rewards?: any;
  requirements?: any;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UserQuest {
  id: string;
  status: string;
  quest: Quest;
  acceptedAt: string;
  completedAt?: string;
}

const Quests = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sub',
    questType: 'always',
    dayOfWeek: null as number | null,
    rewards: '',
    requirements: '',
    isActive: true
  });

  useEffect(() => {
    fetchQuests();
    fetchUserQuests();
    if (isAdmin) {
      fetchAllQuests();
    }
  }, [isAdmin]);

  const fetchQuests = async () => {
    try {
      const response = await api.get('/quests');
      setQuests(response.data);
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuests = async () => {
    try {
      const response = await api.get('/quests/admin/all');
      setQuests(response.data);
    } catch (error) {
      console.error('Error fetching all quests:', error);
    }
  };

  const fetchUserQuests = async () => {
    try {
      const response = await api.get('/quests/my-quests');
      setUserQuests(response.data);
    } catch (error) {
      console.error('Error fetching user quests:', error);
    }
  };

  const handleAcceptQuest = async (questId: string) => {
    try {
      await api.post(`/quests/${questId}/accept`);
      fetchUserQuests();
      alert('퀘스트를 수락했습니다!');
    } catch (error: any) {
      alert(error.response?.data?.error || '퀘스트 수락 실패');
    }
  };

  const handleCompleteQuest = async (questId: string) => {
    try {
      await api.post(`/quests/${questId}/complete`);
      fetchUserQuests();
      alert('퀘스트를 완료했습니다!');
    } catch (error: any) {
      alert(error.response?.data?.error || '퀘스트 완료 실패');
    }
  };

  const handleEdit = (quest: Quest) => {
    setEditingQuestId(quest.id);
    setFormData({
      title: quest.title,
      description: quest.description,
      type: quest.type,
      questType: quest.questType || 'always',
      dayOfWeek: quest.dayOfWeek ?? null,
      rewards: quest.rewards ? (typeof quest.rewards === 'string' ? quest.rewards : JSON.stringify(quest.rewards)) : '',
      requirements: quest.requirements ? (typeof quest.requirements === 'string' ? quest.requirements : JSON.stringify(quest.requirements)) : '',
      isActive: quest.isActive !== undefined ? quest.isActive : true
    });
    setShowAddForm(true);
  };

  const handleDelete = async (questId: string) => {
    if (!confirm('정말 이 퀘스트를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/quests/${questId}`);
      fetchAllQuests();
      alert('퀘스트가 삭제되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '퀘스트 삭제 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const questData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        questType: formData.questType,
        isActive: formData.isActive
      };

      if (formData.questType === 'weekday') {
        questData.dayOfWeek = formData.dayOfWeek;
      }

      if (formData.rewards) {
        try {
          questData.rewards = JSON.parse(formData.rewards);
        } catch {
          questData.rewards = formData.rewards;
        }
      }

      if (formData.requirements) {
        try {
          questData.requirements = JSON.parse(formData.requirements);
        } catch {
          questData.requirements = formData.requirements;
        }
      }

      if (editingQuestId) {
        await api.put(`/quests/${editingQuestId}`, questData);
        alert('퀘스트가 수정되었습니다.');
      } else {
        await api.post('/quests', questData);
        alert('퀘스트가 생성되었습니다.');
      }

      setShowAddForm(false);
      setEditingQuestId(null);
      setFormData({
        title: '',
        description: '',
        type: 'sub',
        questType: 'always',
        dayOfWeek: null,
        rewards: '',
        requirements: '',
        isActive: true
      });
      fetchAllQuests();
    } catch (error: any) {
      alert(error.response?.data?.error || '퀘스트 저장 실패');
    }
  };

  const getQuestStatus = (questId: string) => {
    const userQuest = userQuests.find(uq => uq.quest.id === questId);
    return userQuest?.status;
  };

  const getQuestTypeLabel = (questType?: string) => {
    switch (questType) {
      case 'always': return '상시';
      case 'daily': return '일일';
      case 'weekly': return '주간';
      case 'weekday': return '요일';
      default: return '상시';
    }
  };

  const getDayOfWeekLabel = (dayOfWeek: number | null | undefined) => {
    if (dayOfWeek === null || dayOfWeek === undefined) return '';
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return days[dayOfWeek];
  };

  const isQuestAvailable = (quest: Quest) => {
    if (!quest.isActive) return false;
    const now = new Date();
    const dayOfWeek = now.getDay();

    switch (quest.questType) {
      case 'always':
        return true;
      case 'daily':
        return true;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        const questDate = new Date(quest.createdAt || quest.updatedAt || now);
        return questDate >= weekStart;
      case 'weekday':
        return quest.dayOfWeek === dayOfWeek;
      default:
        return true;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-hogwarts-blue">퀘스트</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingQuestId(null);
              setFormData({
                title: '',
                description: '',
                type: 'sub',
                questType: 'always',
                dayOfWeek: null,
                rewards: '',
                requirements: '',
                isActive: true
              });
            }}
            className="bg-hogwarts-gold text-hogwarts-blue px-4 py-2 rounded-md hover:bg-yellow-500 transition"
          >
            {showAddForm ? '퀘스트 생성 취소' : '퀘스트 생성'}
          </button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{editingQuestId ? '퀘스트 수정' : '퀘스트 생성'}</h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingQuestId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">타입</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="main">메인</option>
                <option value="sub">서브</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">퀘스트 종류</label>
              <select
                value={formData.questType}
                onChange={(e) => setFormData({ ...formData, questType: e.target.value, dayOfWeek: e.target.value === 'weekday' ? formData.dayOfWeek : null })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="always">상시퀘스트</option>
                <option value="daily">일일퀘스트</option>
                <option value="weekly">주간퀘스트</option>
                <option value="weekday">요일퀘스트</option>
              </select>
            </div>
            {formData.questType === 'weekday' && (
              <div>
                <label className="block text-sm font-medium mb-1">요일</label>
                <select
                  value={formData.dayOfWeek ?? ''}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="0">일요일</option>
                  <option value="1">월요일</option>
                  <option value="2">화요일</option>
                  <option value="3">수요일</option>
                  <option value="4">목요일</option>
                  <option value="5">금요일</option>
                  <option value="6">토요일</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">보상 (JSON 형식)</label>
              <textarea
                value={formData.rewards}
                onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                placeholder='{"gold": 100, "items": []}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">요구사항 (JSON 형식)</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                placeholder='{"level": 5, "items": []}'
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                활성화
              </label>
            </div>
            <button
              type="submit"
              className="bg-hogwarts-blue text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
            >
              {editingQuestId ? '수정' : '생성'}
            </button>
          </form>
        </div>
      )}

      {!showAddForm && (
        <>
          {/* 내 퀘스트 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">내 퀘스트</h2>
            <div className="space-y-4">
              {userQuests.map((userQuest) => (
                <div key={userQuest.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{userQuest.quest.title}</h3>
                    <span className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {userQuest.status === 'PENDING' ? '대기중' :
                       userQuest.status === 'IN_PROGRESS' ? '진행중' :
                       userQuest.status === 'COMPLETED' ? '완료' : '실패'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{userQuest.quest.description}</p>
                  {userQuest.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteQuest(userQuest.quest.id)}
                      className="bg-hogwarts-gold text-hogwarts-blue px-4 py-2 rounded-md hover:bg-yellow-500 transition"
                    >
                      완료하기
                    </button>
                  )}
                </div>
              ))}
              {userQuests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  진행중인 퀘스트가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 사용 가능한 퀘스트 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">사용 가능한 퀘스트</h2>
            <div className="space-y-4">
              {quests
                .filter(quest => !isAdmin || quest.isActive)
                .filter(quest => isQuestAvailable(quest))
                .map((quest) => {
                  const status = getQuestStatus(quest.id);
                  return (
                    <div key={quest.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{quest.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {quest.type === 'main' ? '메인' : '서브'}
                            </span>
                            <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                              {getQuestTypeLabel(quest.questType)}
                              {quest.questType === 'weekday' && quest.dayOfWeek !== null && ` (${getDayOfWeekLabel(quest.dayOfWeek)})`}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(quest)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(quest.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">{quest.description}</p>
                      {!status && (
                        <button
                          onClick={() => handleAcceptQuest(quest.id)}
                          className="bg-hogwarts-blue text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
                        >
                          수락하기
                        </button>
                      )}
                      {status && (
                        <span className="text-sm text-gray-500">
                          이미 수락한 퀘스트입니다.
                        </span>
                      )}
                    </div>
                  );
                })}
              {quests.filter(quest => (!isAdmin || quest.isActive) && isQuestAvailable(quest)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  사용 가능한 퀘스트가 없습니다.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Quests;
