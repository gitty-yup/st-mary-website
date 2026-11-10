// Server-side entry point (pulls in pdf-lib and the embedded fonts).
// Browser code should import './fields', './content', or './defaults' directly.
export * from './types';
export * from './content';
export * from './fields';
export { BAPTISM_DEFAULTS, MARRIAGE_DEFAULTS } from './defaults';
export {
  certificateFilename,
  renderBaptismCertificate,
  renderCertificate,
  renderMarriageCertificate,
} from './render';
export { findUnsupportedCharacters, type UnsupportedCharacters } from './validate';
