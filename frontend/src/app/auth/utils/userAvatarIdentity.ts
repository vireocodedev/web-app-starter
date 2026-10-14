const avatarColors = ["#235D80", "#70428B", "#805122", "#165E59", "#8A3D60", "#3E5A90", "#6E5637", "#2F6672"] as const;

export function avatarInitials(name: string) {
  const words = name.split(/[\s._-]+/u).filter(Boolean);
  const characters =
    words.length > 1 ? words.slice(0, 2).map(word => Array.from(word)[0]) : Array.from(words[0] ?? "").slice(0, 2);
  return characters.join("").toUpperCase() || "?";
}

export function avatarColor(name: string) {
  let hash = 0;
  for (const character of name.toLowerCase()) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return avatarColors[hash % avatarColors.length];
}
