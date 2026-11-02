import { useState } from 'react';

/** Estado simple de una hoja inferior: abierta/cerrada y el elemento que muestra. */
const useBottomSheet = <T,>() => {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  const openBottomSheet = (value: T) => {
    setItem(value);
    setOpen(true);
  };

  const closeBottomSheet = () => {
    setOpen(false);
    setItem(null);
  };

  return { open, item, openBottomSheet, closeBottomSheet };
};

export default useBottomSheet;
