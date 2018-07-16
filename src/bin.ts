import config from 'params/config';
import options from 'params/options';
import esmIndex from 'index';
import filterKeys from 'utils/filterKeys';
import * as yargs from 'yargs';

esmIndex(
  filterKeys(
    yargs.options({ ...config, ...options }).argv,
    ...[
      ...Object.keys(config).filter(key => !['help', 'version'].includes(key)),
      ...Object.keys(options),
    ]
  )
)
  .then(callback => {
    console.info(callback);
  })
  .catch(err => {
    console.error(err);
  });
