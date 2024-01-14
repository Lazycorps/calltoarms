export function useColorGenerator() {
  const generateColor = (string: string) => {
    const hRange = [0, 360];
    const sRange = [20, 100];
    const lRange = [0, 100];

    var hash = 0;
    for (var i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.floor((hash % (hRange[0] - hRange[1])) + hRange[0]);
    const s = Math.floor((hash % (sRange[0] - sRange[1])) + sRange[0]);
    const l = Math.floor((hash % (lRange[0] - lRange[1])) + lRange[0]);
    console.log(`hsl(${h}, ${s}%, ${l}%)`);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  return { generateColor };
}
