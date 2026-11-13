import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "../../lib/db";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("SQLite bootstrap", () => {
  it("creates the schema, defaults and WAL mode", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "profile-card-"));
    temporaryDirectories.push(directory);
    const database = createDatabase(path.join(directory, "card.sqlite"));
    const sqlite = database.sqlite;

    expect(
      sqlite.prepare("SELECT mode FROM settings WHERE id = 1").get(),
    ).toEqual({ mode: "public" });
    expect(
      sqlite.prepare("SELECT login FROM profiles WHERE is_default = 1").get(),
    ).toEqual({ login: "DearLicy" });
    expect(
      sqlite.prepare("SELECT slug FROM image_categories ORDER BY sort_order").all(),
    ).toEqual([{ slug: "photo" }, { slug: "anime" }]);
    expect(sqlite.pragma("journal_mode", { simple: true })).toBe("wal");

    sqlite.close();
  });

  it("is idempotent when the same database is opened twice", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "profile-card-"));
    temporaryDirectories.push(directory);
    const file = path.join(directory, "card.sqlite");
    const first = createDatabase(file);
    first.sqlite.close();
    const second = createDatabase(file);
    expect(
      (second.sqlite.prepare("SELECT COUNT(*) AS count FROM settings").get() as {
        count: number;
      }).count,
    ).toBe(1);
    second.sqlite.close();
  });
});
