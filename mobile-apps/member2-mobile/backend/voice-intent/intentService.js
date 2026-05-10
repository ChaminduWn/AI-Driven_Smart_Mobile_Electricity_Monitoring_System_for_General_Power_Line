const fs = require('fs');
const path = require('path');
const { INTENT_TO_ACTION } = require('./intentCatalog');

const MODEL_PATH = path.join(__dirname, 'model', 'intent-classifier.json');
const META_PATH = path.join(__dirname, 'model', 'intent-meta.json');

const normalizeText = (value = '') =>
    String(value)
        .toLowerCase()
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const createNgrams = (text, min = 3, max = 5) => {
    const source = ` ${normalizeText(text)} `;
    const grams = [];

    for (let n = min; n <= max; n += 1) {
        for (let index = 0; index <= source.length - n; index += 1) {
            grams.push(source.slice(index, index + n));
        }
    }

    return grams;
};

let modelCache = null;
let metaCache = null;

const ensureModelLoaded = () => {
    if (!modelCache) {
        if (!fs.existsSync(MODEL_PATH)) {
            throw new Error('Voice intent model not found. Run `npm run train:voice` first.');
        }

        modelCache = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
    }

    if (!metaCache) {
        metaCache = fs.existsSync(META_PATH)
            ? JSON.parse(fs.readFileSync(META_PATH, 'utf8'))
            : {};
    }
};

const vectorizeText = (text, model) => {
    const grams = createNgrams(
        text,
        model?.config?.ngramMin || 3,
        model?.config?.ngramMax || 5
    );
    const tfCounts = new Map();
    const idfEntries = model?.idf || {};

    grams.forEach((gram) => {
        if (idfEntries[gram] !== undefined) {
            tfCounts.set(gram, (tfCounts.get(gram) || 0) + 1);
        }
    });

    const weights = {};
    let norm = 0;

    tfCounts.forEach((count, gram) => {
        const weight = (count / Math.max(grams.length, 1)) * idfEntries[gram];
        weights[gram] = weight;
        norm += weight * weight;
    });

    return {
        weights,
        norm: Math.sqrt(norm) || 1,
    };
};

const scoreIntent = (queryVector, centroid) => {
    let dot = 0;

    Object.entries(queryVector.weights).forEach(([gram, weight]) => {
        const centroidWeight = centroid.weights?.[gram];
        if (centroidWeight) {
            dot += weight * centroidWeight;
        }
    });

    return dot / Math.max(queryVector.norm * (centroid.norm || 1), 1e-8);
};

const predictSingleIntent = (transcript = '', topN = 5, allowedIntents = []) => {
    ensureModelLoaded();

    const normalizedText = normalizeText(transcript);
    if (!normalizedText) {
        return {
            transcript,
            normalizedText,
            intent: null,
            confidence: 0,
            alternatives: [],
            action: null,
        };
    }

    const queryVector = vectorizeText(normalizedText, modelCache);
    const intentFilter = Array.isArray(allowedIntents) && allowedIntents.length > 0
        ? new Set(allowedIntents)
        : null;

    const alternatives = Object.entries(modelCache.centroids || {})
        .filter(([intent]) => !intentFilter || intentFilter.has(intent))
        .map(([intent, centroid]) => ({
            intent,
            confidence: scoreIntent(queryVector, centroid),
            action: INTENT_TO_ACTION[intent] || metaCache.intentActions?.[intent] || null,
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, Math.max(Number(topN) || 5, 1))
        .map((item) => ({
            ...item,
            confidence: Number(item.confidence.toFixed(4)),
        }));

    const top = alternatives[0];

    return {
        transcript,
        normalizedText,
        intent: top?.intent || null,
        confidence: top?.confidence || 0,
        alternatives,
        action: top?.action || null,
    };
};

const predictIntent = (transcriptOrTranscripts = '', topN = 5, allowedIntents = []) => {
    const transcriptCandidates = Array.isArray(transcriptOrTranscripts)
        ? transcriptOrTranscripts
        : [transcriptOrTranscripts];

    const uniqueCandidates = [
        ...new Set(
            transcriptCandidates
                .map((value) => String(value || '').trim())
                .filter(Boolean)
        ),
    ];

    if (uniqueCandidates.length === 0) {
        return predictSingleIntent('', topN, allowedIntents);
    }

    const rankedResults = uniqueCandidates
        .map((candidate) => predictSingleIntent(candidate, topN, allowedIntents))
        .sort((left, right) => {
            if ((right.confidence || 0) !== (left.confidence || 0)) {
                return (right.confidence || 0) - (left.confidence || 0);
            }

            return (right.normalizedText?.length || 0) - (left.normalizedText?.length || 0);
        });

    const best = rankedResults[0];

    return {
        ...best,
        transcripts: uniqueCandidates,
        matchedTranscript: best?.transcript || uniqueCandidates[0],
    };
};

const getModelStatus = () => {
    ensureModelLoaded();
    return metaCache;
};

module.exports = {
    predictIntent,
    getModelStatus,
};
