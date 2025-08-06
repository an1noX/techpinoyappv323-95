
export const getPlaceholderImage = (
  name: string, 
  type: string, 
  width: number = 200, 
  height: number = 200
): string => {
  const encodedName = encodeURIComponent(name);
  return `https://via.placeholder.com/${width}x${height}?text=${encodedName}`;
};
