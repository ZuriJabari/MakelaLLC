import { colors } from './colors';

export const gradients = {
  primary: {
    colors: [colors.primary.deepPurple, colors.primary.electricIndigo],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  accent: {
    colors: [colors.accent.mintGreen, colors.accent.coral],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  premium: {
    colors: [colors.primary.deepPurple, colors.accent.mintGreen],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
}; 