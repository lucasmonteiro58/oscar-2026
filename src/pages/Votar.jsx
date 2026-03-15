import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadCategories } from '../data/categories';
import { submitVote, getResults } from '../services/firestore';
import NomineeCard from '../components/NomineeCard';

export default function Votar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betsClosed, setBetsClosed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [data, results] = await Promise.all([
        loadCategories(),
        getResults(),
      ]);
      if (!cancelled) {
        setCategories(data);
        setBetsClosed(results?.betsClosed === true);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (categories.length > 0) {
      window.scrollTo(0, 0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (showConfirmation) {
      window.scrollTo(0, 0);
    }
  }, [showConfirmation]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-oscar-gold font-display text-xl">
          Carregando...
        </div>
      </div>
    );
  }

  if (betsClosed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-2xl font-bold text-oscar-gold mb-3">
            Apostas encerradas
          </h1>
          <p className="text-gray-400 mb-6">
            O período de apostas foi encerrado. Não é mais possível enviar ou alterar votos.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-4 rounded-xl bg-oscar-gold text-oscar-dark font-semibold hover:bg-amber-400 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const total = categories.length;
  const current = categories[currentIndex];
  const currentAnswer = current ? answers[current.id] : null;
  const isLast = currentIndex === total - 1;
  const canProceed = currentAnswer != null;

  const handleSelect = (nomineeId) => {
    setAnswers((prev) => ({ ...prev, [current.id]: nomineeId }));
  };

  const handleNext = () => {
    if (isLast) return;
    setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
  };

  const handleOpenConfirmation = () => {
    if (Object.keys(answers).length !== total) return;
    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== total) return;
    setSubmitting(true);
    try {
      await submitVote(user.uid, answers);
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const answersList = Object.entries(answers).map(([catId, nomineeId]) => {
    const cat = categoryMap[catId];
    const nominee = cat?.nominees?.find((n) => n.id === nomineeId);
    const photo = nominee?.photo && typeof nominee.photo === 'string' ? nominee.photo.trim() : '';
    return {
      category: cat?.category ?? catId,
      name: nominee?.name ?? nomineeId,
      photo: photo || null,
    };
  });

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex flex-col px-4 py-8 pb-32 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-oscar-gold mb-2">
          Confirme sua votação
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Revise suas escolhas abaixo. Após confirmar, não será possível alterar.
        </p>
        <ul className="space-y-2 flex-1 overflow-auto">
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
        <div className="fixed bottom-0 left-0 right-0 bg-oscar-dark border-t border-gray-800 p-4 flex gap-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-oscar-gold text-oscar-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            {submitting ? 'Enviando...' : 'Confirmar e enviar'}
          </button>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-400">Nenhuma categoria carregada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-10 bg-oscar-dark/95 backdrop-blur py-4 px-4 border-b border-gray-800">
        <p className="text-center text-gray-400 text-sm">
          Pergunta {currentIndex + 1} de {total}
        </p>
        <div className="h-1.5 mt-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-oscar-gold rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div key={current.id} className="animate-fade-in">
          <h2 className="font-display text-xl md:text-2xl font-bold text-oscar-gold mb-6">
            {current.category}
          </h2>
          <p className="text-gray-400 text-sm mb-4">Quem você acha que vai ganhar?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {current.nominees.map((nominee) => (
              <NomineeCard
                key={nominee.id}
                nominee={nominee}
                selected={currentAnswer === nominee.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-oscar-dark border-t border-gray-800 p-4 flex gap-3 max-w-lg mx-auto">
        {currentIndex > 0 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Anterior
          </button>
        ) : (
          <div />
        )}
        <div className="flex-1" />
        {!isLast ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className="px-6 py-3 rounded-xl bg-oscar-gold text-oscar-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpenConfirmation}
            disabled={!canProceed}
            className="px-6 py-3 rounded-xl bg-oscar-gold text-oscar-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            Revisar votação
          </button>
        )}
      </footer>
    </div>
  );
}
