import React from 'react';
import { useAtom } from 'jotai';
import { activeDrawerAtom } from '../../store/atoms';

export default function DrawerBackdrop() {
  const [activeDrawer, setActiveDrawer] = useAtom(activeDrawerAtom);

  if (!activeDrawer) return null;

  return (
    <div
      id="drawer-backdrop"
      className="drawer-backdrop active"
      onClick={() => setActiveDrawer(null)}
    />
  );
}
