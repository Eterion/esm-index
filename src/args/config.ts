import { Options } from 'yargs';

export default <{ [index: string]: Options }>{
  help: {
    alias: 'h',
    default: false,
    describe: 'Displays help.',
    type: 'boolean',
  },
  log: {
    alias: 'l',
    default: false,
    describe: 'Enables simple logging messages.',
    type: 'boolean',
  },
  paths: {
    alias: 'p',
    default: [],
    describe: 'List of paths that should be analyzed.',
    type: 'array',
  },
  version: {
    alias: 'v',
    default: false,
    describe: 'Shows currently installed package version.',
    type: 'boolean',
  },
  watch: {
    alias: 'w',
    default: false,
    describe: 'Enables watch mode.',
    type: 'boolean',
  },
};
