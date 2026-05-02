const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { CATEGORY_INTENT_SAMPLES, INTENT_TO_ACTION } = require('./intentCatalog');

const ROOT_DIR = __dirname;
const RAW_DATASET_PATH = path.join(ROOT_DIR, 'data', 'raw', 'powerlink_voice_command_dataset_6500.xlsx');
const PROCESSED_DATASET_PATH = path.join(ROOT_DIR, 'data', 'processed', 'voice_intent_dataset.csv');
const MODEL_PATH = path.join(ROOT_DIR, 'model', 'intent-classifier.json');
const REPORT_PATH = path.join(ROOT_DIR, 'reports', 'training-report.json');
const META_PATH = path.join(ROOT_DIR, 'model', 'intent-meta.json');

const NGRAM_MIN = 3;
const NGRAM_MAX = 5;

const normalizeText = (value = '') =>
    String(value)
        .toLowerCase()
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const createNgrams = (text) => {
    const source = ` ${normalizeText(text)} `;
    const grams = [];

    for (let n = NGRAM_MIN; n <= NGRAM_MAX; n += 1) {
        for (let index = 0; index <= source.length - n; index += 1) {
            grams.push(source.slice(index, index + n));
        }
    }

    return grams;
};

const csvEscape = (value = '') => {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

const loadBaseDataset = () => {
    const workbook = xlsx.readFile(RAW_DATASET_PATH);
    const sheet = workbook.Sheets.Dataset;
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    return rows
        .map((row) => ({
            text: String(row.text || '').trim(),
            intent: String(row.intent || '').trim(),
            language: String(row.language || '').trim(),
            screen: String(row.screen || '').trim(),
            action_type: String(row.action_type || '').trim(),
            source: String(row.source || '').trim(),
        }))
        .filter((row) => row.text && row.intent);
};

const buildAugmentedSamples = () => {
    const rows = [];

    Object.entries(CATEGORY_INTENT_SAMPLES).forEach(([intent, samples]) => {
        samples.forEach((text, index) => {
            rows.push({
                text,
                intent,
                language: /[\u0D80-\u0DFF]/u.test(text) ? 'si' : 'mixed_latin',
                screen: 'voice_assistant',
                action_type: INTENT_TO_ACTION[intent] || 'action',
                source: `synthetic_${index + 1}`,
            });
        });
    });

    return rows;
};

const stratifiedSplit = (rows, trainRatio = 0.8) => {
    const grouped = rows.reduce((accumulator, row) => {
        if (!accumulator[row.intent]) {
            accumulator[row.intent] = [];
        }

        accumulator[row.intent].push(row);
        return accumulator;
    }, {});

    const train = [];
    const test = [];

    Object.values(grouped).forEach((items) => {
        const sorted = [...items].sort((a, b) => a.text.localeCompare(b.text));
        const cut = Math.max(1, Math.floor(sorted.length * trainRatio));

        sorted.forEach((item, index) => {
            if (index < cut) {
                train.push(item);
            } else {
                test.push(item);
            }
        });
    });

    return { train, test };
};

const buildIdfMap = (rows) => {
    const documentFrequency = new Map();

    rows.forEach((row) => {
        const uniqueGrams = new Set(createNgrams(row.text));
        uniqueGrams.forEach((gram) => {
            documentFrequency.set(gram, (documentFrequency.get(gram) || 0) + 1);
        });
    });

    const totalDocs = rows.length;
    const idfMap = new Map();

    documentFrequency.forEach((count, gram) => {
        idfMap.set(gram, Math.log((1 + totalDocs) / (1 + count)) + 1);
    });

    return idfMap;
};

const vectorizeText = (text, idfMap) => {
    const grams = createNgrams(text);
    const tfCounts = new Map();

    grams.forEach((gram) => {
        if (idfMap.has(gram)) {
            tfCounts.set(gram, (tfCounts.get(gram) || 0) + 1);
        }
    });

    const weights = new Map();
    let norm = 0;

    tfCounts.forEach((count, gram) => {
        const weight = (count / Math.max(grams.length, 1)) * idfMap.get(gram);
        weights.set(gram, weight);
        norm += weight * weight;
    });

    return {
        weights,
        norm: Math.sqrt(norm) || 1,
    };
};

const trainCentroidModel = (rows) => {
    const idfMap = buildIdfMap(rows);
    const centroidAccumulators = {};
    const counts = {};

    rows.forEach((row) => {
        const { weights } = vectorizeText(row.text, idfMap);

        if (!centroidAccumulators[row.intent]) {
            centroidAccumulators[row.intent] = new Map();
            counts[row.intent] = 0;
        }

        counts[row.intent] += 1;

        weights.forEach((weight, gram) => {
            centroidAccumulators[row.intent].set(
                gram,
                (centroidAccumulators[row.intent].get(gram) || 0) + weight
            );
        });
    });

    const centroids = {};

    Object.entries(centroidAccumulators).forEach(([intent, accumulator]) => {
        const avgWeights = {};
        let norm = 0;

        accumulator.forEach((weight, gram) => {
            const average = weight / counts[intent];
            avgWeights[gram] = average;
            norm += average * average;
        });

        centroids[intent] = {
            norm: Math.sqrt(norm) || 1,
            weights: avgWeights,
        };
    });

    return {
        type: 'tfidf-char-ngram-centroid',
        config: {
            ngramMin: NGRAM_MIN,
            ngramMax: NGRAM_MAX,
        },
        idf: Object.fromEntries(idfMap),
        centroids,
    };
};

const predictIntent = (model, text, allowedIntents = []) => {
    const idfMap = new Map(Object.entries(model.idf || {}));
    const { weights: queryWeights, norm: queryNorm } = vectorizeText(text, idfMap);
    const allowedSet = Array.isArray(allowedIntents) && allowedIntents.length > 0
        ? new Set(allowedIntents)
        : null;

    const scored = Object.entries(model.centroids || {})
        .filter(([intent]) => !allowedSet || allowedSet.has(intent))
        .map(([intent, centroid]) => {
            let dot = 0;

            queryWeights.forEach((weight, gram) => {
                const centroidWeight = centroid.weights?.[gram];
                if (centroidWeight) {
                    dot += weight * centroidWeight;
                }
            });

            const score = dot / Math.max(queryNorm * (centroid.norm || 1), 1e-8);
            return { intent, score };
        })
        .sort((a, b) => b.score - a.score);

    return {
        intent: scored[0]?.intent || null,
        confidence: Number((scored[0]?.score || 0).toFixed(4)),
        alternatives: scored.slice(0, 5).map((item) => ({
            intent: item.intent,
            confidence: Number(item.score.toFixed(4)),
        })),
    };
};

const evaluateModel = (model, rows) => {
    let correctIntents = 0;
    let correctActions = 0;
    const labels = [...new Set(rows.map((row) => row.intent))];
    const stats = Object.fromEntries(labels.map((label) => [label, { tp: 0, fp: 0, fn: 0 }]));

    rows.forEach((row) => {
        const prediction = predictIntent(model, row.text);
        const predictedIntent = prediction.intent;

        if (predictedIntent === row.intent) {
            correctIntents += 1;
            stats[row.intent].tp += 1;
        } else {
            if (predictedIntent) {
                stats[predictedIntent] = stats[predictedIntent] || { tp: 0, fp: 0, fn: 0 };
                stats[predictedIntent].fp += 1;
            }

            stats[row.intent].fn += 1;
        }

        const expectedAction = INTENT_TO_ACTION[row.intent] || row.intent;
        const predictedAction = INTENT_TO_ACTION[predictedIntent] || predictedIntent;

        if (predictedAction === expectedAction) {
            correctActions += 1;
        }
    });

    const perIntent = Object.fromEntries(
        Object.entries(stats).map(([intent, value]) => {
            const precision = value.tp + value.fp === 0 ? 0 : value.tp / (value.tp + value.fp);
            const recall = value.tp + value.fn === 0 ? 0 : value.tp / (value.tp + value.fn);
            const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

            return [
                intent,
                {
                    precision: Number(precision.toFixed(4)),
                    recall: Number(recall.toFixed(4)),
                    f1: Number(f1.toFixed(4)),
                    support: rows.filter((row) => row.intent === intent).length,
                },
            ];
        })
    );

    return {
        intentAccuracy: Number((correctIntents / Math.max(rows.length, 1)).toFixed(4)),
        actionAccuracy: Number((correctActions / Math.max(rows.length, 1)).toFixed(4)),
        testSamples: rows.length,
        perIntent,
    };
};

const persistDatasetCsv = (rows) => {
    const header = ['text', 'intent', 'language', 'screen', 'action_type', 'source'];
    const lines = [header.join(',')];

    rows.forEach((row) => {
        lines.push(header.map((key) => csvEscape(row[key])).join(','));
    });

    fs.writeFileSync(PROCESSED_DATASET_PATH, lines.join('\n'), 'utf8');
};

const main = async () => {
    const baseRows = loadBaseDataset();
    const syntheticRows = buildAugmentedSamples();
    const allRows = [...baseRows, ...syntheticRows];
    const { train, test } = stratifiedSplit(allRows);
    const model = trainCentroidModel(train);
    const evaluation = evaluateModel(model, test);

    persistDatasetCsv(allRows);
    fs.writeFileSync(MODEL_PATH, JSON.stringify(model), 'utf8');

    const intents = [...new Set(allRows.map((row) => row.intent))].sort();
    const meta = {
        trainedAt: new Date().toISOString(),
        rawDatasetPath: RAW_DATASET_PATH,
        processedDatasetPath: PROCESSED_DATASET_PATH,
        modelType: model.type,
        totalSamples: allRows.length,
        baseSamples: baseRows.length,
        syntheticSamples: syntheticRows.length,
        intentsCount: intents.length,
        intents,
        config: model.config,
        intentActions: INTENT_TO_ACTION,
        evaluation,
    };

    fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf8');
    fs.writeFileSync(REPORT_PATH, JSON.stringify(meta, null, 2), 'utf8');

    console.log(`Voice intent training complete.`);
    console.log(`Samples: ${allRows.length} | Intents: ${intents.length}`);
    console.log(`Intent accuracy: ${evaluation.intentAccuracy}`);
    console.log(`Action accuracy: ${evaluation.actionAccuracy}`);
};

main().catch((error) => {
    console.error('Voice intent training failed:', error);
    process.exitCode = 1;
});
