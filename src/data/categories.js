// Categories are loaded from public/oscar.json at runtime to allow adding images later
export const CATEGORIES_URL = '/oscar.json';

export async function loadCategories() {
  const res = await fetch(CATEGORIES_URL);
  if (!res.ok) throw new Error('Falha ao carregar categorias');
  return res.json();
}
