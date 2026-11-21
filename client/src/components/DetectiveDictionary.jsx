import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BookOpen, LoaderCircle, Search, X } from "lucide-react";
import api from "../api/axios";
import {
  canonicalDictionaryWord,
  DETECTIVE_DICTIONARY,
  DICTIONARY_TERM_PATTERN,
  normalizeDictionaryWord,
} from "../data/detectiveDictionary";

const DictionaryContext = createContext(null);
const recentStorageKey = "mindmaze_dictionary_recent";
const explanationCache = new Map();
const pendingExplanations = new Map();

const contextCacheKey = (word, context) => {
  const value = `${normalizeDictionaryWord(word)}|${context.trim().toLocaleLowerCase()}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${normalizeDictionaryWord(word)}:${value.length}:${hash >>> 0}`;
};

const readRecentWords = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(recentStorageKey) || "[]");
    return Array.isArray(stored) ? stored.slice(0, 10) : [];
  } catch {
    return [];
  }
};

const contextSentence = (text, start, end) => {
  const leftBoundary = Math.max(
    text.lastIndexOf(".", start - 1),
    text.lastIndexOf("!", start - 1),
    text.lastIndexOf("?", start - 1),
    text.lastIndexOf("\n", start - 1),
  ) + 1;
  const possibleEnds = [".", "!", "?", "\n"]
    .map((mark) => text.indexOf(mark, end))
    .filter((index) => index >= 0);
  const rightBoundary = possibleEnds.length ? Math.min(...possibleEnds) + 1 : text.length;
  let sentence = text.slice(leftBoundary, rightBoundary).trim();
  if (sentence.length > 280) {
    const termMiddle = start - leftBoundary;
    const windowStart = Math.max(0, Math.min(termMiddle - 100, sentence.length - 280));
    sentence = sentence.slice(windowStart, windowStart + 280).trim();
  }
  return sentence;
};

export const DictionaryProvider = ({ gameId, children }) => {
  const [lookup, setLookup] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recentWords, setRecentWords] = useState(readRecentWords);

  const remember = useCallback((definition) => {
    setRecentWords((previous) => {
      const next = [definition, ...previous.filter((item) => normalizeDictionaryWord(item.word) !== normalizeDictionaryWord(definition.word))].slice(0, 10);
      try {
        localStorage.setItem(recentStorageKey, JSON.stringify(next));
      } catch {
        // The current lookup remains available even when browser storage is full.
      }
      return next;
    });
  }, []);

  const lookupWord = useCallback(async (word, context = "") => {
    const canonical = canonicalDictionaryWord(word);
    const local = DETECTIVE_DICTIONARY[canonical];
    if (local) {
      const definition = { word: canonical, ...local, source: "local" };
      setLookup({ ...definition, loading: false });
      remember(definition);
      return;
    }

    const key = contextCacheKey(word, context);
    const cached = explanationCache.get(key);
    if (cached) {
      setLookup({ ...cached, loading: false });
      remember(cached);
      return;
    }
    const saved = recentWords.find((item) =>
      normalizeDictionaryWord(item.word) === normalizeDictionaryWord(word) && item.contextKey === key
    );
    if (saved) {
      explanationCache.set(key, saved);
      setLookup({ ...saved, loading: false });
      return;
    }

    setLookup({ word: word.trim(), context, loading: true, definition: "", example: "" });
    try {
      let request = pendingExplanations.get(key);
      if (!request) {
        request = api.post(`/games/${gameId}/dictionary/define`, { word: word.trim(), context })
          .then((response) => response.data.definition);
        pendingExplanations.set(key, request);
      }
      const definition = { ...(await request), contextKey: key };
      explanationCache.set(key, definition);
      setLookup({ ...definition, loading: false });
      remember(definition);
    } catch (error) {
      setLookup({
        word: word.trim(),
        loading: false,
        error: error.response?.data?.message || "Could not explain this word right now. Try again later.",
      });
    } finally {
      pendingExplanations.delete(key);
    }
  }, [gameId, recentWords, remember]);

  useEffect(() => {
    if (!lookup && !isPanelOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setLookup(null);
        setIsPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPanelOpen, lookup]);

  const value = useMemo(() => ({
    lookupWord,
    openDictionary: () => setIsPanelOpen(true),
  }), [lookupWord]);

  const filteredWords = Object.keys(DETECTIVE_DICTIONARY)
    .filter((word) => word.includes(search.trim().toLocaleLowerCase()));
  const normalizedSearch = normalizeDictionaryWord(search);
  const exactLocalMatch = Boolean(DETECTIVE_DICTIONARY[canonicalDictionaryWord(search)]);
  const canSearchUnknown = normalizedSearch.length > 0 && !exactLocalMatch && /^[\p{L}][\p{L}' -]{0,59}$/u.test(search.trim());

  return (
    <DictionaryContext.Provider value={value}>
      {children}
      {lookup && (
        <aside className="dictionary-word-popup" role="dialog" aria-label={`${lookup.word} definition`}>
          <div className="dictionary-popup-heading">
            <div><span>DETECTIVE DICTIONARY</span><h2>{lookup.word}</h2></div>
            <button type="button" className="dictionary-close" onClick={() => setLookup(null)} aria-label="Close definition"><X size={18} /></button>
          </div>
          {lookup.loading
            ? <p className="dictionary-loading"><LoaderCircle size={16} className="dictionary-spin" /> Finding a simple meaning…</p>
            : lookup.error
              ? <p className="dictionary-error" role="alert">{lookup.error}</p>
              : <DefinitionContent definition={lookup} />}
        </aside>
      )}
      {isPanelOpen && (
        <div className="dictionary-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsPanelOpen(false);
        }}>
          <section className="dictionary-panel" role="dialog" aria-modal="true" aria-labelledby="dictionary-title">
            <header className="dictionary-panel-header">
              <div><span>CASE FILE TOOLS</span><h2 id="dictionary-title"><BookOpen size={20} /> Detective Dictionary</h2></div>
              <button type="button" className="dictionary-close" onClick={() => setIsPanelOpen(false)} aria-label="Close dictionary"><X size={20} /></button>
            </header>
            <label className="dictionary-search">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a word" aria-label="Search a word" />
            </label>
            {canSearchUnknown && <button type="button" className="dictionary-unknown-search" onClick={() => lookupWord(search.trim())}>Explain “{search.trim()}”</button>}
            <div className="dictionary-panel-columns">
              <section>
                <h3>Word list</h3>
                <div className="dictionary-word-list">
                  {filteredWords.map((word) => (
                    <button type="button" key={word} onClick={() => lookupWord(word)}>{word}<span>{DETECTIVE_DICTIONARY[word].definition}</span></button>
                  ))}
                  {!filteredWords.length && !canSearchUnknown && <p className="dictionary-empty">No words found. Try another search.</p>}
                </div>
              </section>
              <section className="dictionary-recent">
                <h3>Recently viewed</h3>
                {recentWords.length
                  ? recentWords.map((definition) => <button type="button" key={definition.word} onClick={() => setLookup({ ...definition, loading: false })}>{definition.word}<span>{definition.definition}</span></button>)
                  : <p className="dictionary-empty">Words you look up will appear here.</p>}
              </section>
            </div>
          </section>
        </div>
      )}
    </DictionaryContext.Provider>
  );
};

export const DictionaryButton = () => {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) return null;
  return <button type="button" className="btn btn-secondary btn-sm dictionary-open-button" onClick={dictionary.openDictionary}><BookOpen size={15} /> Dictionary</button>;
};

export const DictionaryText = ({ children, as: Element = "span", className, ...props }) => {
  const dictionary = useContext(DictionaryContext);
  const text = String(children ?? "");
  if (!dictionary || !text) return <Element className={className} {...props}>{children}</Element>;

  const segments = [];
  let cursor = 0;
  for (const match of text.matchAll(DICTIONARY_TERM_PATTERN)) {
    const start = match.index + match[1].length;
    const end = start + match[2].length;
    if (start < cursor) continue;
    segments.push(text.slice(cursor, start));
    const word = match[2];
    const context = contextSentence(text, start, end);
    segments.push(
      <button
        type="button"
        className="dictionary-inline-word"
        key={`${start}-${word.toLocaleLowerCase()}`}
        aria-label={`Explain ${word}`}
        onClick={(event) => {
          event.stopPropagation();
          dictionary.lookupWord(word, context);
        }}
      >{word}</button>,
    );
    cursor = end;
  }
  segments.push(text.slice(cursor));
  return <Element className={className} {...props}>{segments}</Element>;
};

const DefinitionContent = ({ definition }) => (
  <div className="dictionary-definition-content">
    <p><strong>Meaning</strong>{definition.definition}</p>
    <p><strong>Example</strong>{definition.example}</p>
    {definition.synonym && <p><strong>Similar word</strong>{definition.synonym}</p>}
  </div>
);
