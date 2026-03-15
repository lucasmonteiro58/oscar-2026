import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResults, getAllVotes, getAllUsers } from '../services/firestore';
import { loadCategories } from '../data/categories';

function getScore(answers, winners) {
  if (!winners || typeof answers !== 'object') return 0;
  let count = 0;
  for (const [catId, nomineeId] of Object.entries(answers)) {
    if (winners[catId] === nomineeId) count++;
  }
  return count;
}

function getDetails(answers, winners, categories) {
  if (!winners || !answers || !categories?.length) return { acertou: [], errou: [] };
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const acertou = [];
  const errou = [];
  for (const [catId, userNomineeId] of Object.entries(answers)) {
    const winnerId = winners[catId];
    const cat = catMap[catId];
    const categoryName = cat?.category ?? catId;
    const userNominee = cat?.nominees?.find((n) => n.id === userNomineeId);
    const winnerNominee = cat?.nominees?.find((n) => n.id === winnerId);
    const item = {
      category: categoryName,
      escolha: userNominee?.name ?? userNomineeId,
      vencedor: winnerNominee?.name ?? winnerId,
    };
    if (userNomineeId === winnerId) {
      acertou.push(item);
    } else {
      errou.push(item);
    }
  }
  return { acertou, errou };
}

export default function Resultado() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [categories, setCategories] = useState([]);
  const [winners, setWinners] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notPublished, setNotPublished] = useState(false);
  const [expandedUid, setExpandedUid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [resultsData, votesList, usersMap, categoriesData] = await Promise.all([
          getResults(),
          getAllVotes(),
          getAllUsers(),
          loadCategories(),
        ]);
        if (cancelled) return;
        if (!resultsData?.published || !resultsData.winners) {
          setRanking([]);
          setWinners(null);
          setNotPublished(true);
          setLoading(false);
          return;
        }
        const { winners: winnersData } = resultsData;
        setWinners(winnersData);
        setCategories(categoriesData ?? []);
        const withScores = votesList
          .filter((v) => v.answers && typeof v.answers === 'object')
          .map((v) => ({
            uid: v.uid,
            answers: v.answers,
            score: getScore(v.answers, winnersData),
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
          const isExpanded = expandedUid === entry.uid;
          const { acertou, errou } = getDetails(entry.answers, winners, categories);
          return (
            <div
              key={entry.uid}
              className={`rounded-xl border overflow-hidden ${
                isFirst
                  ? 'bg-oscar-gold/20 border-oscar-gold'
                  : isSecond
                    ? 'bg-gray-700/50 border-gray-600'
                    : isThird
                      ? 'bg-amber-900/20 border-amber-700'
                      : 'bg-oscar-card border-gray-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedUid((u) => (u === entry.uid ? null : entry.uid))}
                className="w-full flex items-center gap-4 p-4 text-left hover:opacity-90 transition-opacity"
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
                <span
                  className={`text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 py-4 border-t border-gray-700/50 space-y-4">
                  {acertou.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                        Acertou ({acertou.length})
                      </p>
                      <ul className="space-y-1.5">
                        {acertou.map((item, i) => (
                          <li
                            key={`acertou-${i}`}
                            className="text-sm py-1.5 px-3 rounded-lg bg-emerald-500/10 text-gray-300"
                          >
                            <span className="text-gray-500">{item.category}:</span>{' '}
                            <span className="text-emerald-300">{item.escolha}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {errou.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
                        Errou ({errou.length})
                      </p>
                      <ul className="space-y-1.5">
                        {errou.map((item, i) => (
                          <li
                            key={`errou-${i}`}
                            className="text-sm py-1.5 px-3 rounded-lg bg-red-500/10 text-gray-300"
                          >
                            <span className="text-gray-500">{item.category}:</span>{' '}
                            <span className="line-through text-red-300">{item.escolha}</span>
                            <span className="text-gray-400"> → </span>
                            <span className="text-emerald-300">{item.vencedor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
