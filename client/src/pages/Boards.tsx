import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Board {
  id: string;
  name: string;
  type: string;
  description?: string;
  _count: {
    posts: number;
  };
}

const Boards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto modern-container min-h-screen py-12 px-4">
      <h1 className="text-4xl font-bold mb-12 text-center" style={{ color: 'rgba(223,190,106,0.9)', letterSpacing: '0.1em' }}>게시판 목록</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className="modern-card p-8 block"
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgba(223,190,106,0.9)', letterSpacing: '0.05em' }}>{board.name}</h2>
            {board.description && (
              <p className="text-sm mb-6 opacity-80" style={{ lineHeight: '1.6' }}>{board.description}</p>
            )}
            <div className="flex justify-between items-center text-xs" style={{ color: 'rgba(223,190,106,0.7)' }}>
              <span style={{ border: '1px solid rgba(223,190,106,0.3)', padding: '4px 12px', letterSpacing: '0.1em' }}>{board.type}</span>
              <span style={{ letterSpacing: '0.05em' }}>게시글 {board._count.posts}개</span>
            </div>
          </Link>
        ))}
      </div>
      {boards.length === 0 && (
        <div className="text-center py-12" style={{ color: 'rgba(223,190,106,0.7)' }}>
          등록된 게시판이 없습니다.
        </div>
      )}
    </div>
  );
};

export default Boards;

