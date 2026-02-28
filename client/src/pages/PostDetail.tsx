import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    username: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    username: string;
  };
  character?: {
    name: string;
    displayName?: string;
    profileImage?: string;
  };
  comments: Comment[];
  votes: Array<{ option: string }>;
}

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      await api.post(`/posts/${id}/comments`, { content: commentContent });
      setCommentContent('');
      fetchPost();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!post) {
    return <div className="text-center py-8">게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h1 className="text-3xl font-bold text-hogwarts-blue mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          {post.character && (
            <span className="font-semibold">{post.character.displayName || post.character.name}</span>
          )}
          {post.author && <span>@{post.author.username}</span>}
          <span>{new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <div className="prose max-w-none mb-6">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
        {post.votes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">투표 현황</h3>
            <div className="space-y-2">
              {post.votes.map((vote, idx) => (
                <div key={idx} className="text-sm">{vote.option}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">댓글 ({post.comments.length})</h2>
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full px-4 py-2 border rounded-md mb-2"
              rows={3}
            />
            <button
              type="submit"
              className="bg-hogwarts-blue text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
            >
              댓글 작성
            </button>
          </form>
        )}
        <div className="space-y-4">
          {post.comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                {comment.author && (
                  <span className="font-semibold">@{comment.author.username}</span>
                )}
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;


