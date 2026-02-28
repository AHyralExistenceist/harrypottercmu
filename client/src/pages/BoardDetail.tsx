import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author?: {
    username: string;
  };
  character?: {
    name: string;
    displayName?: string;
    profileImage?: string;
  };
  _count: {
    comments: number;
    votes: number;
  };
}

const BoardDetail = () => {
  const { boardId } = useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (boardId) {
      fetchPosts();
    }
  }, [boardId, page]);

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/posts/board/${boardId}`, {
        params: { page, limit: 20 }
      });
      setPosts(response.data.posts);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {user && (
          <Link
            to={`/boards/${boardId}/new`}
            className="inline-block bg-hogwarts-blue text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
          >
            새 게시글 작성
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="block p-6 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && (
                      <span className="bg-hogwarts-gold text-hogwarts-blue px-2 py-1 text-xs rounded font-semibold">
                        고정
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-hogwarts-blue">
                      {post.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {post.character && (
                      <span className="font-semibold">{post.character.displayName || post.character.name}</span>
                    )}
                    {post.author && <span>@{post.author.username}</span>}
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>댓글 {post._count.comments}</span>
                    {post._count.votes > 0 && <span>투표 {post._count.votes}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="p-4 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-4 py-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardDetail;


