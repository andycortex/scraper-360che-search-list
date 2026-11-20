import { createHttpRouter } from '@crawlee/http';

export const router = createHttpRouter();

router.addDefaultHandler(async ({ request, body, log, pushData }) => {
    const { page, searchQuery } = request.userData;

    log.info(`Procesando página ${page} → term: "${searchQuery}"`);

    let json;
    try {
        json = typeof body === 'string' ? JSON.parse(body) : JSON.parse(body.toString());
    } catch (err) {
        log.error('Error parseando JSON', { url: request.url });
        return;
    }

    if (json.status !== 0) {
        log.warning(`API respondió con error: ${json.msg || json.status}`);
        return;
    }

    const data = json.data || {};

    const series = data.product_series;
    const keywordList = data.product_keyword?.list;

    // Condición: 1 resultado (product_series, ej: 2.txt) o varios resultados (product_keyword.list, ej: 1.txt)
    if (series && series.F_SeriesId) {
        // 1 resultado
        await pushData({
            type: 'product',
            searchQuery,
            page,
            productId: series.proId ? String(series.proId) : null,
            title: series.F_ShortName || null,
            brandId: series.F_BrandId ? String(series.F_BrandId) : null,
            seriesId: series.F_SeriesId ? String(series.F_SeriesId) : null,
            subId: series.F_SubCategoryId ? String(series.F_SubCategoryId) : null,
            priceMin: series.price?.minPrice || series.showPrice?.minPrice || null,
            maxPrice: series.price?.maxPrice || series.showPrice?.maxPrice || null,
            priceUnit: series.productData?.[0]?.F_PriceUnit || '万元',
            showPrice: series.showPrice?.minPrice || series.price?.minPrice || null,
            showPriceMsg: series.showPrice?.message || series.productData?.[0]?.showMsg || null,
            showPriceType: series.showPrice?.type ?? series.productData?.[0]?.showType ?? null,
            saleState:
                series.F_IsStopMake === '1' || series.F_IsStopMake === 1
                    ? 'stopSelling'
                    : 'onSale',
            isEv: series.isEv === '1' || series.isEv === 1,
            weekClickCount: series.productData?.[0]?.F_WeekClickCount
                ? String(series.productData[0].F_WeekClickCount)
                : null,
            image: series.mainImg || series.smallImg || null,
            url: series.seriesUrl || series.paramsUrl || null,
            pcUrl: series.seriesUrl || null,
            h5Url: series.seriesUrl || null,
            appUrl: series.paramsUrl || series.seriesUrl || null,
        });

        log.info(`Página ${page} procesada → 1 resultado (serie única: "${series.F_ShortName}")`);
    } else if (Array.isArray(keywordList) && keywordList.length > 0) {
        // Varios resultados
        for (const item of keywordList) {
            await pushData({
                type: 'product',
                searchQuery,
                page,
                productId: item.product_id ? String(item.product_id) : null,
                title: item.title || null,
                brandId: item.brand_id ? String(item.brand_id) : null,
                seriesId: item.seriesId ? String(item.seriesId) : null,
                subId: item.subId ? String(item.subId) : null,
                priceMin: item.price_min || null,
                priceMax: item.price_max || null,
                priceUnit: item.price_unit || '万元',
                showPrice: item.show_price?.price || item.price_min || null,
                showPriceMsg: item.show_price?.message || null,
                showPriceType: item.show_price?.type ?? null,
                saleState:
                    item.sale_state ||
                    (item.F_IsStopMake === '1' || item.F_IsStopMake === 1
                        ? 'stopSelling'
                        : 'onSale'),
                isEv: item.isEv === '1' || item.isEv === 1,
                weekClickCount: item.F_WeekClickCount ? String(item.F_WeekClickCount) : null,
                image: item.image || null,
                url: item.pc_url || item.h5_url || item.app_url || null,
                pcUrl: item.pc_url || null,
                h5Url: item.h5_url || null,
                appUrl: item.app_url || null,
            });
        }

        log.info(`Página ${page} procesada → ${keywordList.length} resultados (lista por palabra clave)`);
    } else {
        log.info(`Página ${page} procesada → 0 resultados`);
    }
});
