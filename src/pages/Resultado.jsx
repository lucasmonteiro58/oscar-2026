import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResults, getAllVotes, getAllUsers } from '../services/firestore';

function getScore(answers, winners) {
  if (!winners || typeof answers !== 'object') return 0;
  let count = 0;
  for (const [catId, nomineeId] of Object.entries(answers)) {
    if (winners[catId] === nomineeId) count++;
  }
  return count;
}

export default function Resultado() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notPublished, setNotPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [resultsData, votesList, usersMap] = await Promise.all([
          getResults(),
          getAllVotes(),
          getAllUsers(),
        ]);
        if (cancelled) return;
        if (!resultsData?.published || !resultsData.winners) {
          setRanking([]);
          setNotPublished(true);
          setLoading(false);
          return;
        }
        const { winners } = resultsData;
        const withScores = votesList
          .filter((v) => v.answers && typeof v.answers === 'object')
          .map((v) => ({
            uid: v.uid,
            score: getScore(v.answers, winners),
            displayName: usersMap[v.uid]?.displayName ?? 'Anônimo',
            photoURL: usersMap[v.uid]?.photoURL ?? '',
          }))
          .sort((a, b) => b.score - a.score);
        setRanking(withScores);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-oscar-gold font-display text-xl">
          Carregando ranking...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-oscar-gold text-oscar-dark font-medium"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (notPublished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-400 text-center mb-6">
          O resultado ainda não foi divulgado. Aguarde a cerimônia e volte em breve.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-oscar-gold text-oscar-dark font-medium hover:bg-amber-400 transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-oscar-gold mb-2">
        Resultado do Bolão
      </h1>
      <p className="text-gray-400 mb-8">Oscar 2026 — Ranking por acertos</p>

      <div className="space-y-3">
        {ranking.map((entry, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;
          return (
            <div
              key={entry.uid}
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                isFirst
                  ? 'bg-oscar-gold/20 border-oscar-gold'
                  : isSecond
                    ? 'bg-gray-700/50 border-gray-600'
                    : isThird
                      ? 'bg-amber-900/20 border-amber-700'
                      : 'bg-oscar-card border-gray-800'
              }`}
            >
              <span className="text-2xl font-display font-bold text-oscar-gold w-10">
                {index + 1}º
              </span>
              <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                {entry.photoURL ? (
                  <img
                    src={entry.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-400">
                    {entry.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{entry.displayName}</p>
                <p className="text-sm text-gray-400">
                  {entry.score} acerto{entry.score !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-full mt-8 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
      >
        Voltar
      </button>
    </div>
  );
}
