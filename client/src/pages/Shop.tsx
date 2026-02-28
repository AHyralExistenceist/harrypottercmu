import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Item {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  imageUrl?: string;
  rarity: number;
  isGacha?: boolean;
  effects?: any;
}

interface UserItem {
  id: string;
  quantity: number;
  item: Item;
}

const Shop = () => {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<Item[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [gachaCount, setGachaCount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'consumable',
    price: 0,
    imageUrl: '',
    effects: '',
    isGacha: false,
    rarity: 1
  });

  useEffect(() => {
    fetchItems();
    if (!isAdmin) {
      fetchUserItems();
    }
  }, [isAdmin]);

  const fetchItems = async () => {
    try {
      const response = await api.get('/shop/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    try {
      const response = await api.get('/shop/my-items');
      setUserItems(response.data);
    } catch (error) {
      console.error('Error fetching user items:', error);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: item.type,
      price: item.price,
      imageUrl: item.imageUrl || '',
      effects: item.effects ? (typeof item.effects === 'string' ? item.effects : JSON.stringify(item.effects)) : '',
      isGacha: item.isGacha || false,
      rarity: item.rarity || 1
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('정말 이 아이템을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/shop/items/${itemId}`);
      fetchItems();
      alert('아이템이 삭제되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '아이템 삭제 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData: any = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        price: formData.price,
        imageUrl: formData.imageUrl || null,
        isGacha: formData.isGacha,
        rarity: formData.rarity
      };

      if (formData.effects) {
        try {
          itemData.effects = JSON.parse(formData.effects);
        } catch {
          itemData.effects = formData.effects;
        }
      }

      if (editingItemId) {
        await api.put(`/shop/items/${editingItemId}`, itemData);
        alert('아이템이 수정되었습니다.');
      } else {
        await api.post('/shop/items', itemData);
        alert('아이템이 생성되었습니다.');
      }

      setShowAddForm(false);
      setEditingItemId(null);
      setFormData({
        name: '',
        description: '',
        type: 'consumable',
        price: 0,
        imageUrl: '',
        effects: '',
        isGacha: false,
        rarity: 1
      });
      fetchItems();
    } catch (error: any) {
      alert(error.response?.data?.error || '아이템 저장 실패');
    }
  };

  const handlePurchase = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (user?.character && user.character.galleon < item.price) {
      alert('골드가 부족합니다.');
      return;
    }

    try {
      await api.post('/shop/purchase', { itemId, quantity: 1 });
      if (refreshUser) {
        await refreshUser();
      }
      fetchUserItems();
      alert('구매 완료!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response?.data?.error || '골드가 부족합니다.');
      } else {
        alert(error.response?.data?.error || '구매 실패');
      }
    }
  };

  const handleGacha = async () => {
    const gachaCostPerItem = 50;
    const totalCost = gachaCostPerItem * gachaCount;
    
    if (user?.character && user.character.galleon < totalCost) {
      alert('골드가 부족합니다.');
      return;
    }

    try {
      await api.post('/shop/gacha', { count: gachaCount });
      if (refreshUser) {
        await refreshUser();
      }
      fetchUserItems();
      alert('가챠 완료!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response?.data?.error || '골드가 부족합니다.');
      } else {
        alert(error.response?.data?.error || '가챠 실패');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-hogwarts-blue">상점</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingItemId(null);
              setFormData({
                name: '',
                description: '',
                type: 'consumable',
                price: 0,
                imageUrl: '',
                effects: '',
                isGacha: false,
                rarity: 1
              });
            }}
            className="bg-hogwarts-gold text-hogwarts-blue px-4 py-2 rounded-md hover:bg-yellow-500 transition"
          >
            {showAddForm ? '아이템 생성 취소' : '아이템 생성'}
          </button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{editingItemId ? '아이템 수정' : '아이템 생성'}</h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingItemId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">타입</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="consumable">소비품</option>
                <option value="equipment">장비</option>
                <option value="collectible">수집품</option>
                <option value="special">특수</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">가격</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이미지 URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">효과 (JSON 형식)</label>
              <textarea
                value={formData.effects}
                onChange={(e) => setFormData({ ...formData, effects: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                placeholder='{"hp": 20}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">레어도 (1-5)</label>
              <input
                type="number"
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="5"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isGacha}
                  onChange={(e) => setFormData({ ...formData, isGacha: e.target.checked })}
                  className="mr-2"
                />
                가챠 아이템
              </label>
            </div>
            <button
              type="submit"
              className="bg-hogwarts-blue text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
            >
              {editingItemId ? '수정' : '생성'}
            </button>
          </form>
        </div>
      )}

      {!showAddForm && (
        <>
          {!isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">가챠</h2>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={gachaCount}
                  onChange={(e) => setGachaCount(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleGacha}
                  disabled={!user?.character || user.character.galleon < (50 * gachaCount)}
                  className={`px-6 py-2 rounded-md transition font-semibold ${
                    !user?.character || user.character.galleon < (50 * gachaCount)
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-hogwarts-gold text-hogwarts-blue hover:bg-yellow-500'
                  }`}
                >
                  가챠 뽑기
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">아이템 상점</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-hogwarts-gold">
                      {item.price.toLocaleString()}G
                    </span>
                    {!isAdmin && (
                      <button
                        onClick={() => handlePurchase(item.id)}
                        disabled={!user?.character || user.character.galleon < item.price}
                        className={`px-3 py-1 rounded text-sm transition ${
                          !user?.character || user.character.galleon < item.price
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-hogwarts-blue text-white hover:bg-blue-800'
                        }`}
                      >
                        구매
                      </button>
                    )}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                등록된 아이템이 없습니다.
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">내 아이템</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userItems.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="border rounded-lg p-4"
                  >
                    {userItem.item.imageUrl && (
                      <img
                        src={userItem.item.imageUrl}
                        alt={userItem.item.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <h3 className="font-semibold mb-1">{userItem.item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      수량: {userItem.quantity}
                    </p>
                  </div>
                ))}
              </div>
              {userItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  소지한 아이템이 없습니다.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shop;
