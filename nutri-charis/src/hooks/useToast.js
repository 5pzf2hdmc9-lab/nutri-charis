import { useState } from 'react';

export function useToast() {
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3400);
  };
  return { toastMsg, setToastMsg, showToast };
}
