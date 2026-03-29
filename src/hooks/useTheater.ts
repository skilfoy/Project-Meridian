'use client';
import { useAppStore } from '@/store/app.store';
import { THEATERS, getTheater } from '@/lib/theaters';

export function useTheater() {
  const activeTheaterId   = useAppStore((s) => s.activeTheaterId);
  const setActiveTheaterId = useAppStore((s) => s.setActiveTheaterId);
  const activeTheater     = getTheater(activeTheaterId) ?? THEATERS[0];
  return { theaters: THEATERS, activeTheater, activeTheaterId, setActiveTheaterId };
}
