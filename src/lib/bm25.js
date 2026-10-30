import protocols from '../data/protocols.json';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'how', 'when', 'should', 'can', 'i', 'do', 'does'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

export class BM25Retriever {
  constructor(docs = protocols, k1 = 1.2, b = 0.75) {
    this.docs = docs;
    this.k1 = k1;
    this.b = b;
    this.corpusSize = docs.length;
    this.docLengths = [];
    this.avgDocLength = 0;
    this.invertedIndex = new Map();

    this.buildIndex();
  }

  buildIndex() {
    let totalLength = 0;

    this.docs.forEach((doc, docIdx) => {
      const fullText = `${doc.title} ${doc.text} ${(doc.tags || []).join(' ')}`;
      const tokens = tokenize(fullText);
      const docLen = tokens.length;
      this.docLengths[docIdx] = docLen;
      totalLength += docLen;

      const termCounts = new Map();
      tokens.forEach(token => {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      });

      termCounts.forEach((count, term) => {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, []);
        }
        this.invertedIndex.get(term).push({ docIdx, freq: count });
      });
    });

    this.avgDocLength = totalLength / (this.corpusSize || 1);
  }

  search(query, topK = 3) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = new Array(this.corpusSize).fill(0);

    queryTokens.forEach(term => {
      const postings = this.invertedIndex.get(term);
      if (!postings) return;

      const docFreq = postings.length;
      // Standard BM25 IDF formulation
      const idf = Math.log(1 + (this.corpusSize - docFreq + 0.5) / (docFreq + 0.5));

      postings.forEach(({ docIdx, freq }) => {
        const docLen = this.docLengths[docIdx];
        const tf = freq;
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        scores[docIdx] += idf * (numerator / denominator);
      });
    });

    const results = [];
    scores.forEach((score, docIdx) => {
      if (score > 0) {
        results.push({
          doc: this.docs[docIdx],
          score
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

export const defaultRetriever = new BM25Retriever();
