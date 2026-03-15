import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVote, getResults } from '../services/firestore';
import { loadCategories } from '../data/categories';

function UserHeader({ user, onLogout }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-oscar-card border border-gray-700 overflow-hidden flex-shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-oscar-gold font-semibold">
              {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm truncate max-w-[180px]">{user.displayName}</span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Sair
      </button>
    </header>
  );
}

export default function Home() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [vote, setVote] = useState(null);
  const [results, setResults] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const [voteData, resultsData, cats] = await Promise.all([
        getVote(user.uid),
        getResults(),
        loadCategories(),
      ]);
      if (!cancelled) {
        setVote(voteData);
        setResults(resultsData);
        setCategories(cats);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-oscar-gold font-display text-xl">Carregando...</div>
      </div>
    );
  }

  // Não votou ou respostas vazias: redirecionar para o wizard
  const hasVoted = vote?.answers && Object.keys(vote.answers).length > 0;
  if (!hasVoted) {
    navigate('/votar', { replace: true });
    return null;
  }

  // Já votou: mostrar lista de respostas + aguardando resultado ou botão conferir
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const answersList = Object.entries(vote.answers).map(([catId, nomineeId]) => {
    const cat = categoryMap[catId];
    const nominee = cat?.nominees?.find((n) => n.id === nomineeId);
    const photo = nominee?.photo && typeof nominee.photo === 'string' ? nominee.photo.trim() : '';
    return {
      category: cat?.category ?? catId,
      name: nominee?.name ?? nomineeId,
      photo: photo || null,
    };
  });
  const published = results?.published === true;

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <UserHeader user={user} onLogout={handleLogout} />
      <h1 className="font-display text-2xl md:text-3xl font-bold text-oscar-gold mb-2">
        Minhas apostas
      </h1>
      <p className="text-gray-400 mb-6">Oscar 2026</p>

      <ul className="space-y-3 mb-8">
        {answersList.map(({ category, name, photo }) => (
          <li
            key={category}
            className="flex justify-between items-center gap-3 py-3 px-4 rounded-xl bg-oscar-card border border-gray-800"
          >
            <span className="text-gray-400 text-sm flex-shrink-0">{category}</span>
            <span className="font-medium text-right truncate min-w-0 flex-1">{name}</span>
            {photo ? (
              <img
                src={photo}
                alt=""
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : null}
          </li>
        ))}
      </ul>

      {published ? (
        <button
          type="button"
          onClick={() => navigate('/resultado')}
          className="w-full py-4 rounded-xl bg-oscar-gold text-oscar-dark font-semibold hover:bg-amber-400 transition-colors"
        >
          Conferir resultado
        </button>
      ) : (
        <div className="text-center py-6 px-4 rounded-xl bg-oscar-card border border-gray-800">
          <p className="text-gray-400">Aguardando o resultado da cerimônia</p>
          <p className="text-sm text-gray-500 mt-1">Quando estiver disponível, o botão aparecerá aqui</p>
        </div>
      )}
    </div>
  );
}
