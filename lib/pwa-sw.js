/* Deployment-specific source so browsers can detect every release. */
const BUILD_ID = __PWA_BUILD_ID__;

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
    }
});

// This worker only coordinates updates. Network requests remain network-only.
void BUILD_ID;
