export function getAvatarBg(fotoperfil?: string | null): string {
  if (!fotoperfil) return 'bg-indigo-600';
  if (fotoperfil.includes('homer.png')) return 'bg-amber-400';
  if (fotoperfil.includes('marge.png')) return 'bg-sky-400';
  if (fotoperfil.includes('bart.png')) return 'bg-red-500';
  if (fotoperfil.includes('lisa.png')) return 'bg-orange-400';
  if (fotoperfil.includes('maggie.png')) return 'bg-cyan-400';
  return 'bg-slate-800';
}

export function getAvatarClass(fotoperfil?: string | null): string {
  if (fotoperfil && (fotoperfil.includes('homer.png') || fotoperfil.includes('marge.png') || fotoperfil.includes('bart.png') || fotoperfil.includes('lisa.png') || fotoperfil.includes('maggie.png'))) {
    return 'w-full h-full object-contain p-0.5';
  }
  return 'w-full h-full object-cover';
}
