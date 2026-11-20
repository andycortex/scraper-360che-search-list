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

const searchUrl = new URL('https://data-hive.360che.com/search/v1/complex-v4');
searchUrl.searchParams.set('local_address', '');
searchUrl.searchParams.set('term', searchQuery);
searchUrl.searchParams.set('page', '1');

const startUrls = [
    {
        url: searchUrl.toString(),
        userData: {
            page: 1,
            searchQuery,
            maxPages,
        },
    },
];

await crawler.run(startUrls);

await Actor.exit();
