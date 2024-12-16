import { openOrActivateTab } from './util';
import { detectContext } from '@rshaker/context-detect';

console.info(`Startup in context: ${detectContext()}`);

document.querySelector("#actionSettings")?.addEventListener("click", () => {
    openOrActivateTab('settings.html');
});
