import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { snapshotFlashTriggerAtom } from '../../store/atoms';

export default function SnapshotFlash() {
  const trigger = useAtomValue(snapshotFlashTriggerAtom);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setFlashing(true);
    const timer = setTimeout(() => setFlashing(false), 450);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div
      id="snapshot-flash"
      className={`snapshot-flash ${flashing ? 'flash' : ''}`}
    />
  );
}
