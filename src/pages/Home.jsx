import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVote, getResults, getAllVotes, getAllUsers } from '../services/firestore';
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
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUid, setExpandedUid] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const [voteData, resultsData, cats, votesList, usersMap] = await Promise.all([
        getVote(user.uid),
        getResults(),
        loadCategories(),
        getAllVotes(),
        getAllUsers(),
      ]);
      if (!cancelled) {
        setVote(voteData);
        setResults(resultsData);
        setCategories(cats);
        const whoVoted = votesList
          .filter((v) => v.answers && Object.keys(v.answers).length > 0)
          .map((v) => ({
            uid: v.uid,
            displayName: usersMap[v.uid]?.displayName ?? 'Anônimo',
            photoURL: usersMap[v.uid]?.photoURL ?? '',
            answers: v.answers || {},
          }));
        setParticipants(whoVoted);
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

  // Já votou: mostrar lista de respostas na mesma ordem do JSON + aguardando resultado ou botão conferir
  const getVotesList = (answers, cats = categories) =>
    cats.map((cat) => {
      const nomineeId = (answers || {})[cat.id];
      const nominee = cat.nominees?.find((n) => n.id === nomineeId);
      const photo = nominee?.photo && typeof nominee.photo === 'string' ? nominee.photo.trim() : '';
      return {
        category: cat.category,
        name: nominee?.name ?? nomineeId ?? '—',
        photo: photo || null,
      };
    });
  const answersList = getVotesList(vote.answers);
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

      {/* Primeiro: aguardando resultado ou botão ver resultados */}
      {published ? (
        <button
          type="button"
          onClick={() => navigate('/resultado')}
          className="w-full py-4 rounded-xl bg-oscar-gold text-oscar-dark font-semibold hover:bg-amber-400 transition-colors mb-8"
        >
          Ver resultados
        </button>
      ) : (
        <div className="text-center py-6 px-4 rounded-xl bg-oscar-card border border-gray-800 mb-8">
          <p className="text-gray-400">Aguardando o resultado da cerimônia</p>
          <p className="text-sm text-gray-500 mt-1">Quando estiver disponível, o botão aparecerá aqui</p>
        </div>
      )}

      {/* Depois: lista de votos */}
      <section aria-label="Lista de votos">
        <ul className="space-y-2">
          {answersList.map(({ category, name, photo }) => (
            <li
              key={category}
              className="flex justify-between items-center gap-2 py-2 px-3 rounded-lg bg-oscar-card border border-gray-800"
            >
              <span className="text-gray-400 text-xs flex-shrink-0">{category}</span>
              <span className="font-medium text-sm text-right truncate min-w-0 flex-1">{name}</span>
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Participantes do bolão */}
      <section className="mt-10 pt-8 border-t border-gray-800" aria-label="Participantes do bolão">
        <h2 className="font-display text-lg font-semibold text-oscar-gold mb-4">
          Participantes do bolão
        </h2>
        <ul className="space-y-2">
          {participants.map((p) => {
            const isExpanded = expandedUid === p.uid;
            const votesList = getVotesList(p.answers);
            return (
              <li
                key={p.uid}
                className={`rounded-lg border overflow-hidden transition-colors ${
                  isExpanded ? 'border-oscar-gold/50 bg-oscar-card' : 'border-gray-800 bg-oscar-card'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedUid(isExpanded ? null : p.uid)}
                  className="w-full flex items-center gap-3 py-2 px-3 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {p.photoURL ? (
                      <img
                        src={p.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-oscar-gold font-semibold">
                        {p.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-gray-200 truncate flex-1">
                    {p.uid === user.uid ? `${p.displayName} (você)` : p.displayName}
                  </span>
                  <span
                    className={`text-gray-500 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▼
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-800">
                    <ul className="space-y-1.5 mt-2">
                      {votesList.map(({ category, name, photo }) => (
                        <li
                          key={category}
                          className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-gray-800/50"
                        >
                          <span className="text-gray-500 text-xs w-24 flex-shrink-0 truncate">
                            {category}
                          </span>
                          {photo ? (
                            <img
                              src={photo}
                              alt=""
                              className="w-6 h-6 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                              ?
                            </span>
                          )}
                          <span className="font-medium text-sm text-gray-200 truncate min-w-0">
                            {name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
