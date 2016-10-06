import * as test from 'blue-tape';
import * as config from '../src/config';

test('sanity', (t: test.Test) => {
  let conf = config.defaults();
  t.equal(conf.gameVersion, 'ANY');
  t.equal(conf.fullscreen, false);
  t.end();
});
