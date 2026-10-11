import React from 'react';
import { useAtomValue } from 'jotai';
import { isLetterboxAtom } from '../../store/atoms';

export default function CinematicLetterbox() {
  const isLetterbox = useAtomValue(isLetterboxAtom);

  return (
    <>
      <div id="cinematic-letterbox-top" className={`cinematic-letterbox-bar top ${isLetterbox ? 'active' : ''}`} />
      <div id="cinematic-letterbox-bottom" className={`cinematic-letterbox-bar bottom ${isLetterbox ? 'active' : ''}`} />
    </>
  );
}
