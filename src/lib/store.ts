import { promises as fs } from "node:fs";
import path from "node:path";
import type { VisitingCard } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "cards.json");

async function ensureStore() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf8");
  }
}

export async function getCards(): Promise<VisitingCard[]> {
  await ensureStore();
  const content = await fs.readFile(dataFile, "utf8");
  return JSON.parse(content) as VisitingCard[];
}

export async function getCard(id: string): Promise<VisitingCard | undefined> {
  const cards = await getCards();
  return cards.find((card) => card.id === id);
}

export async function addCard(
  input: Omit<VisitingCard, "id" | "createdAt">
): Promise<VisitingCard> {
  const cards = await getCards();
  const card: VisitingCard = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  cards.unshift(card);
  await fs.writeFile(dataFile, JSON.stringify(cards, null, 2), "utf8");
  return card;
}

export async function updateCard(
  id: string,
  input: Omit<VisitingCard, "id" | "createdAt">
): Promise<VisitingCard | undefined> {
  const cards = await getCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return undefined;

  const updatedCard: VisitingCard = {
    ...input,
    id,
    createdAt: cards[index].createdAt,
  };
  cards[index] = updatedCard;
  await fs.writeFile(dataFile, JSON.stringify(cards, null, 2), "utf8");
  return updatedCard;
}

export async function deleteCard(id: string): Promise<boolean> {
  const cards = await getCards();
  const remainingCards = cards.filter((card) => card.id !== id);
  if (remainingCards.length === cards.length) return false;
  await fs.writeFile(dataFile, JSON.stringify(remainingCards, null, 2), "utf8");
  return true;
}
