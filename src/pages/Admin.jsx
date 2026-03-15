import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCategories } from '../data/categories';
import { getResults, setResults, setBetsClosed } from '../services/firestore';
import NomineeCard from '../components/NomineeCard';

const ADMIN_PASSWORD = '91501748';
const ADMIN_KEY = 'oscar_admin_authenticated';

function isAdminAuthenticated() {
  try {
    return sessionStorage.getItem(ADMIN_KEY) === '1';
  } catch {
    return false;
  }
}

function setAdminAuthenticated(value) {
  try {
    if (value) sessionStorage.setItem(ADMIN_KEY, '1');
    else sessionStorage.removeItem(ADMIN_KEY);
  } catch {}
}

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [winners, setWinners] = useState({});
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [betsClosed, setBetsClosedState] = useState(false);
  const [togglingBets, setTogglingBets] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    async function load() {
      const [cats, resultsData] = await Promise.all([
        loadCategories(),
        getResults(),
      ]);
      if (!cancelled) {
        setCategories(cats);
        setWinners(resultsData?.winners ?? {});
        setPublished(resultsData?.published === true);
        setBetsClosedState(resultsData?.betsClosed === true);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [authenticated]);

  const handleToggleBets = async () => {
    setTogglingBets(true);
    setError('');
    try {
      await setBetsClosed(!betsClosed);
      setBetsClosedState(!betsClosed);
    } catch (e) {
      setError(e.message ?? 'Erro ao alterar status das apostas');
    }
    setTogglingBets(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (password === ADMIN_PASSWORD) {
      setAdminAuthenticated(true);
      setAuthenticated(true);
      setPassword('');
    } else {
      setError('Senha incorreta');
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setAuthenticated(false);
  };

  const handleSelectWinner = (categoryId, nomineeId) => {
    setWinners((prev) => ({ ...prev, [categoryId]: nomineeId }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await setResults(winners, published);
      setError('');
    } catch (e) {
      setError(e.message ?? 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handlePublishClick = () => {
    const total = categories.length;
    const filled = Object.keys(winners).length;
    if (filled < total) {
      setError(`Preencha todas as categorias antes de publicar (${filled}/${total})`);
      return;
    }
    setError('');
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async () => {
    setPublishing(true);
    setError('');
    try {
      await setResults(winners, true);
      setPublished(true);
      setShowPublishModal(false);
    } catch (e) {
      setError(e.message ?? 'Erro ao publicar');
    }
    setPublishing(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-oscar-dark">
        <h1 className="font-display text-xl text-oscar-gold mb-6">Área Admin</h1>
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl bg-oscar-card border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-oscar-gold"
            autoComplete="current-password"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-oscar-gold text-oscar-dark font-semibold hover:bg-amber-400 transition-colors"
          >
            Entrar
          </button>
        </form>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 text-gray-400 hover:text-gray-300 text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-oscar-gold">Carregando...</div>
      </div>
    );
  }

  const total = categories.length;
  const filled = Object.keys(winners).length;
  const allFilled = filled === total;

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-oscar-gold">
          Admin — Marcar vencedores
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-300"
        >
          Sair
        </button>
      </div>

      <p className="text-gray-400 mb-4">
        {filled} / {total} categorias preenchidas
      </p>

      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm text-gray-500">
          {betsClosed ? 'Apostas encerradas — ninguém pode mais votar.' : 'Apostas abertas — participantes podem votar.'}
        </p>
        <button
          type="button"
          onClick={handleToggleBets}
          disabled={togglingBets}
          className="w-full py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {togglingBets ? 'Salvando...' : betsClosed ? 'Reabrir apostas' : 'Encerrar apostas'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat.id} className="border-b border-gray-800 pb-6">
            <h2 className="font-display text-lg font-semibold text-oscar-gold mb-4">
              {cat.category}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {cat.nominees.map((nominee) => (
                <NomineeCard
                  key={nominee.id}
                  nominee={nominee}
                  selected={winners[cat.id] === nominee.id}
                  hasSelection={winners[cat.id] != null}
                  onSelect={() => handleSelectWinner(cat.id, nominee.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-oscar-dark border-t border-gray-800 max-w-2xl mx-auto flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-4 rounded-xl border border-gray-600 text-gray-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={handlePublishClick}
          disabled={!allFilled || publishing}
          className="flex-1 py-4 rounded-xl bg-oscar-gold text-oscar-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
        >
          {publishing ? 'Publicando...' : 'Publicar resultado'}
        </button>
      </div>

      {showPublishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => !publishing && setShowPublishModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-oscar-card border border-gray-700 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="publish-modal-title" className="font-display text-xl font-bold text-oscar-gold mb-2">
              Publicar resultado?
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Os participantes poderão ver o resultado do bolão e o ranking. Esta ação torna o resultado visível para todos.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => !publishing && setShowPublishModal(false)}
                disabled={publishing}
                className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePublishConfirm}
                disabled={publishing}
                className="flex-1 py-3 rounded-xl bg-oscar-gold text-oscar-dark font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {publishing ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
