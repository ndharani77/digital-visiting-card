import { promises as fs } from "node:fs";
import path from "node:path";
import type { VisitingCard } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "cards.json");
const storeLock = globalThis as typeof globalThis & { __visitingCardWriteQueue?: Promise<void> };

async function withStoreLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = storeLock.__visitingCardWriteQueue ?? Promise.resolve();
  let release!: () => void;
  storeLock.__visitingCardWriteQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

async function ensureStore() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf8");
  }
}

async function readCards(): Promise<VisitingCard[]> {
  await ensureStore();
  const content = await fs.readFile(dataFile, "utf8");
  return JSON.parse(content) as VisitingCard[];
}

export async function getCards(): Promise<VisitingCard[]> {
  return withStoreLock(readCards);
}

export async function getCard(id: string): Promise<VisitingCard | undefined> {
  const cards = await getCards();
  return cards.find((card) => card.id === id);
}

async function writeCards(cards: VisitingCard[]) {
  const temporaryFile = `${dataFile}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, JSON.stringify(cards, null, 2), "utf8");
    await fs.rename(temporaryFile, dataFile);
  } finally {
    await fs.rm(temporaryFile, { force: true });
  }
}

export async function addCard(
  input: Omit<VisitingCard, "id" | "createdAt">
): Promise<VisitingCard> {
  return withStoreLock(async () => {
    const cards = await readCards();
    const card: VisitingCard = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    cards.unshift(card);
    await writeCards(cards);
    return card;
  });
}

export async function updateCard(
  id: string,
  input: Omit<VisitingCard, "id" | "createdAt">
): Promise<VisitingCard | undefined> {
  return withStoreLock(async () => {
    const cards = await readCards();
    const index = cards.findIndex((card) => card.id === id);
    if (index === -1) return undefined;

    const updatedCard: VisitingCard = {
      ...input,
      id,
      createdAt: cards[index].createdAt,
    };
    cards[index] = updatedCard;
    await writeCards(cards);
    return updatedCard;
  });
}

export async function deleteCard(id: string): Promise<boolean> {
  return withStoreLock(async () => {
    const cards = await readCards();
    const remainingCards = cards.filter((card) => card.id !== id);
    if (remainingCards.length === cards.length) return false;
    await writeCards(remainingCards);
    return true;
  });
}
