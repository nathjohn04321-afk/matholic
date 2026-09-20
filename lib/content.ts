/**
 * Pemuat & pengindeks konten.
 *
 * Seluruh materi dibundel di dalam APK sebagai JSON (SPEC.md bagian 3), jadi
 * tidak ada pemuatan dari jaringan. Indeks dibangun sekali saat pertama
 * dipakai, lalu disimpan di memori.
 */

import { RAW_TOPICS } from './content-index';
import type { Card, Question, Topic, TopicMeta, Track } from './types';
import { TRACKS } from './types';

interface ContentIndex {
  topics: Topic[];
  byTopicId: Map<string, Topic>;
  byCardId: Map<string, { card: Card; topic: Topic; index: number }>;
  byTrack: Map<Track, Topic[]>;
  metaByTrack: Map<Track, TopicMeta[]>;
}

let index: ContentIndex | null = null;

function countQuestions(topic: Topic): number {
  return topic.cards.reduce((sum, card) => sum + card.questions.length, 0);
}

function toMeta(topic: Topic): TopicMeta {
  return {
    id: topic.id,
    track: topic.track,
    title: topic.title,
    order: topic.order,
    prerequisites: topic.prerequisites ?? [],
    estimatedMinutes: topic.estimatedMinutes,
    summary: topic.summary,
    tags: topic.tags ?? [],
    cardCount: topic.cards.length,
    questionCount: countQuestions(topic),
  };
}

function buildIndex(): ContentIndex {
  const topics = [...RAW_TOPICS].sort((a, b) => {
    if (a.track !== b.track) {
      return TRACKS.indexOf(a.track) - TRACKS.indexOf(b.track);
    }
    return a.order - b.order;
  });

  const byTopicId = new Map<string, Topic>();
  const byCardId = new Map<string, { card: Card; topic: Topic; index: number }>();
  const byTrack = new Map<Track, Topic[]>();
  const metaByTrack = new Map<Track, TopicMeta[]>();

  for (const track of TRACKS) {
    byTrack.set(track, []);
    metaByTrack.set(track, []);
  }

  for (const topic of topics) {
    byTopicId.set(topic.id, topic);
    byTrack.get(topic.track)?.push(topic);
    metaByTrack.get(topic.track)?.push(toMeta(topic));
    topic.cards.forEach((card, i) => {
      byCardId.set(card.id, { card, topic, index: i });
    });
  }

  return { topics, byTopicId, byCardId, byTrack, metaByTrack };
}

function getIndex(): ContentIndex {
  if (!index) index = buildIndex();
  return index;
}

export function getAllTopics(): Topic[] {
  return getIndex().topics;
}

export function getTopicsByTrack(track: Track): TopicMeta[] {
  return getIndex().metaByTrack.get(track) ?? [];
}

export function getTopic(topicId: string): Topic | null {
  return getIndex().byTopicId.get(topicId) ?? null;
}

export function getCard(cardId: string): Card | null {
  return getIndex().byCardId.get(cardId)?.card ?? null;
}

/** Kartu beserta topik induk dan posisinya — dipakai layar kartu. */
export interface CardContext {
  card: Card;
  topic: Topic;
  index: number;
  previousId: string | null;
  nextId: string | null;
}

export function getCardContext(cardId: string): CardContext | null {
  const found = getIndex().byCardId.get(cardId);
  if (!found) return null;
  const { card, topic, index: i } = found;
  return {
    card,
    topic,
    index: i,
    previousId: i > 0 ? (topic.cards[i - 1]?.id ?? null) : null,
    nextId: i < topic.cards.length - 1 ? (topic.cards[i + 1]?.id ?? null) : null,
  };
}

export function getAllCardIds(): string[] {
  return [...getIndex().byCardId.keys()];
}

/** Judul topik untuk id prasyarat, supaya catatan di layar enak dibaca. */
export function getTopicTitle(topicId: string): string {
  return getIndex().byTopicId.get(topicId)?.title ?? topicId;
}

export function getQuestionsForTopic(topicId: string): Question[] {
  const topic = getTopic(topicId);
  if (!topic) return [];
  return topic.cards.flatMap((card) => card.questions);
}

export interface ContentStats {
  topics: number;
  cards: number;
  questions: number;
}

export function getContentStats(): ContentStats {
  const { topics, byCardId } = getIndex();
  return {
    topics: topics.length,
    cards: byCardId.size,
    questions: topics.reduce((sum, t) => sum + countQuestions(t), 0),
  };
}
