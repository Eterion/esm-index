#!/usr/bin/env node

import esmIndex from './index';
import * as yargs from 'yargs';

const args = yargs
  .describe('ext', 'File extension used for index files and internal filter')
  .describe('name', 'File name used for the index files')
  .describe('watch', 'Enables watch mode').argv;

esmIndex(args._[0], {}, args);
