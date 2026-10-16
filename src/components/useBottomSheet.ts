import { useState, useEffect } from 'react';

const useBottomSheet = () => {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(null);

  const openBottomSheet = (service: any) => {
    setService(service);
    setOpen(true);
  };

  const closeBottomSheet = () => {
    setOpen(false);
    setService(null);
  };

  return [open, setOpen, service, closeBottomSheet];
};

export default useBottomSheet;