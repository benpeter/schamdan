// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here

// open external links in a new window
document.querySelectorAll('a').forEach((a) => {
    if (a.href.startsWith("http")) {
      a.target = "_blank";
    }
  });