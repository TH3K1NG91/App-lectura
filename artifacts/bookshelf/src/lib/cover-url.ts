export function coverUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  if (objectPath.startsWith("http")) return objectPath;
  return `/api/storage/objects${objectPath.replace(/^\/objects/, "")}`;
}
