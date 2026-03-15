export default function NomineeCard({ nominee, selected, hasSelection, onSelect }) {
  const photo = nominee?.photo && typeof nominee.photo === 'string' ? nominee.photo.trim() : '';
  const hasPhoto = photo !== '';
  const initials = nominee.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const showAsSelected = hasSelection && selected;
  const useGrayscale = hasSelection && !selected;

  return (
    <button
      type="button"
      onClick={() => onSelect(nominee.id)}
      className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        showAsSelected
          ? 'border-oscar-gold bg-oscar-gold/10 shadow-lg shadow-oscar-gold/20'
          : 'border-gray-700 bg-oscar-card hover:border-gray-600'
      }`}
    >
      <div
        className={`aspect-[16/9] bg-gray-800 flex items-center justify-center overflow-hidden relative transition-all duration-200 ${
          showAsSelected
            ? 'shadow-[inset_0_0_30px_rgba(212,175,55,0.35)]'
            : ''
        }`}
      >
        {hasPhoto ? (
          <img
            src={photo}
            alt=""
            className={`w-full h-full object-cover transition-all duration-200 ${
              useGrayscale ? 'grayscale' : showAsSelected ? 'grayscale-0 brightness-105' : 'grayscale-0'
            }`}
          />
        ) : (
          <span className="text-3xl font-display font-bold text-gray-600">
            {initials}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm md:text-base line-clamp-2">
          {nominee.name}
        </p>
      </div>
    </button>
  );
}
