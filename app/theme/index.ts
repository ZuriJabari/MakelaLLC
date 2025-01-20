export * from './colors';
export * from './typography';
export * from './gradients';
export * from './components/buttons';

import { colors } from './colors';
import { typography } from './typography';
import { gradients } from './gradients';
import { buttons } from './components/buttons';

const theme = {
  colors,
  typography,
  gradients,
  buttons,
};

export default theme; 