export function useColorGenerator() {
  const generateColor = (string: string) => {
    const hRange: [number, number] = [0, 360];
    const sRange: [number, number] = [20, 100];
    const lRange: [number, number] = [0, 100];

    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.floor(
      (Math.abs(hash) % (hRange[1] - hRange[0])) + hRange[0]
    );
    const s = Math.floor(
      (Math.abs(hash) % (sRange[1] - sRange[0])) + sRange[0]
    );
    const l = Math.floor(
      (Math.abs(hash) % (lRange[1] - lRange[0])) + lRange[0]
    );
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  return { generateColor };
}
