'use client'

import {
  Wifi, Wind, Droplets, Bath, BedDouble, ScrollText, Car,
  CookingPot, Refrigerator, Microwave, Coffee, Utensils, Flame,
  Tv, Shirt, Laptop, Fan,
  Waves, Circle,
  Sun, Trees, MountainSnow,
  Camera, Lock, Shield,
  Key, PawPrint, Baby, PartyPopper,
  HelpCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  wind: Wind,
  droplets: Droplets,
  bath: Bath,
  bed: BedDouble,
  soap: Droplets,
  scroll: ScrollText,
  car: Car,
  'cooking-pot': CookingPot,
  refrigerator: Refrigerator,
  microwave: Microwave,
  coffee: Coffee,
  utensils: Utensils,
  flame: Flame,
  tv: Tv,
  'washing-machine': Flame,
  shirt: Shirt,
  laptop: Laptop,
  fan: Fan,
  waves: Waves,
  circle: Circle,
  sun: Sun,
  trees: Trees,
  'mountain-snow': MountainSnow,
  camera: Camera,
  lock: Lock,
  shield: Shield,
  key: Key,
  'paw-print': PawPrint,
  baby: Baby,
  'party-popper': PartyPopper,
}

export function AmenidadIcon({ icono, className }: { icono: string | null; className?: string }) {
  const Icon = (icono && ICON_MAP[icono]) || HelpCircle
  return <Icon className={className || 'h-4 w-4'} />
}
