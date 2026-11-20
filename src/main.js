import { Actor } from 'apify';
import { HttpCrawler } from '@crawlee/http';
import { router } from './routes.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};

const { searchQuery, maxPages = 3, maxRequestsPerCrawl = 30 } = input;

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new HttpCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 45,
    additionalMimeTypes: ['application/json'],
    preNavigationHooks: [
        async ({ request }, gotOptions) => {
            gotOptions.headers = {
                ...gotOptions.headers,
                accept: 'application/json, text/plain, */*',
                'accept-language': 'es-419,es;q=0.9,en;q=0.8',
                authorization:
                    'Basic c2F1MjAxOTA2MjYxMDMzNDYwMTdiODY6JDJ5JDEwJDR3WGxJWDdXb3JHRThaeGN0ZVZmQ2VKcHBxSU9HRHpheWl6R214d2E5QXZuVTZQSlFaSG9x',
                'cache-control': 'no-cache',
                pragma: 'no-cache',
                referer: 'https://so.360che.com/',
            };
        },
    ],
    requestHandler: router,
});

const startUrls = [];

for (let page = 1; page <= maxPages; page++) {
    const url = new URL('https://data-hive.360che.com/search/v1/complex-v4');
    url.searchParams.set('local_address', '');
    url.searchParams.set('term', searchQuery);
    url.searchParams.set('page', String(page));

    startUrls.push({
        url: url.toString(),
        userData: {
            page,
            searchQuery,
        },
    });
}

await crawler.run(startUrls);

await Actor.exit();
