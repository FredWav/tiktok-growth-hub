import { useEffect, useState } from "react";

/** Faux sur le serveur et pendant le tout premier rendu client. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
