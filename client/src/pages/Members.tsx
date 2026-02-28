import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Character {
  id: string;
  name: string;
  displayName?: string;
  profileImage?: string;
  user: {
    username: string;
  };
}

const Members = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await api.get('/characters');
      setCharacters(response.data);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: '#231f20' }}>
      <article className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-8" style={{ color: 'rgba(223,190,106,0.9)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>멤버 목록</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {characters.map((character) => (
            <Link
              key={character.id}
              to={`/members/${character.id}`}
              className="member-card block"
            >
              <div className="aspect-[3/4] flex items-center justify-center relative overflow-hidden" style={{ background: 'rgba(34,34,34,0.9)', borderBottom: '1px solid rgba(223,190,106,0.3)' }}>
                {character.profileImage ? (
                  <img
                    src={character.profileImage}
                    alt={character.displayName || character.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ transform: 'scale(1)' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ) : (
                  <div className="text-6xl" style={{ color: 'rgba(223,190,106,0.5)' }}>👤</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-bold text-base mb-2" style={{ color: 'rgba(223,190,106,0.9)', letterSpacing: '0.1em' }}>{character.displayName || character.name}</h3>
                <p className="text-xs opacity-80" style={{ color: 'rgba(223,190,106,0.7)', letterSpacing: '0.1em' }}>@{character.user.username}</p>
              </div>
            </Link>
          ))}
        </div>
        {characters.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl" style={{ color: 'rgba(223,190,106,0.7)', letterSpacing: '0.1em' }}>등록된 캐릭터가 없습니다.</p>
          </div>
        )}
      </article>
    </div>
  );
};

export default Members;

