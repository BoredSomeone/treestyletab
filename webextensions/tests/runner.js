/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';

import * as TestTree from './test-tree.js';
import { Diff } from '/common/diff.js';

let mLogs;

async function run() {
  mLogs = document.getElementById('logs');
  const configValues = backupConfigs();
  restoreConfigs(configs.$default);
  await runAll();
  restoreConfigs(configValues);
}

function backupConfigs() {
  const values = {};
  for (const key of Object.keys(configs.$default).sort()) {
    values[key] = configs[key];
  }
  return values;
}

function restoreConfigs(values) {
  for (const key of Object.keys(values)) {
    configs[key] = values[key];
  }
}

async function runAll() {
  const testCases = [
    TestTree
  ];
  for (const tests of testCases) {
    const setup    = tests.setUp || tests.setup;
    const teardown = tests.tearDown || tests.teardown;
    for (const name of Object.keys(tests)) {
      if (!name.startsWith('test'))
        continue;
      let shouldTearDown = true;
      try {
        if (typeof setup == 'function')
          await setup();
        await tests[name]();
        if (typeof teardown == 'function') {
          await teardown();
          shouldTearDown = false;
        }
        log(`${name}: succeess`);
      }
      catch(error) {
        try {
          if (shouldTearDown &&
              typeof teardown == 'function') {
            await teardown();
          }
          throw error;
        }
        catch(error) {
          if (error && error.name == 'AssertionError')
            logFailure(`${name}: failure`, error);
          else
            logError(`${name}: error`, error);
        }
      }
    }
  }
}

function log(message, error) {
  const item = mLogs.appendChild(document.createElement('li'));
  item.textContent = message;
}

function logError(message, error) {
  const item = mLogs.appendChild(document.createElement('li'));
  item.classList.add('error');
  item.textContent = message;
  if (error) {
    item.appendChild(document.createElement('br'));
    item.appendChild(document.createTextNode(error.toString()));

    const stack = item.appendChild(document.createElement('pre'));
    stack.classList.add('stack');
    stack.textContent = error.stack;
  }
}

function logFailure(title, error) {
  const item = mLogs.appendChild(document.createElement('li'));
  item.classList.add('failure');
  item.textContent = title;
  if (error.message) {
    item.appendChild(document.createElement('br'));
    item.appendChild(document.createTextNode(error.message));
  }

  const stack = item.appendChild(document.createElement('pre'));
  stack.classList.add('stack');
  stack.textContent = error.stack;

  const diff = item.appendChild(document.createElement('pre'));
  diff.classList.add('diff');
  diff.innerHTML = Diff.readable(error.expected, error.actual, true);
}

window.addEventListener('DOMContentLoaded', run, { once: true });