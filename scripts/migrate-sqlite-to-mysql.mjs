import { DatabaseSync } from "node:sqlite";

import mysql from "mysql2/promise";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 未配置`);
  }

  return value;
}

function readAll(database, tableName) {
  return database.prepare(`SELECT * FROM "${tableName}"`).all();
}

const dateColumns = new Set(["createdAt", "updatedAt", "expiresAt"]);
const booleanColumns = new Set(["published", "isActive"]);

function normalizeValue(column, value) {
  if (value == null) {
    return null;
  }

  if (dateColumns.has(column)) {
    if (typeof value === "number") {
      return new Date(value);
    }

    if (typeof value === "string" && /^\d+$/.test(value)) {
      return new Date(Number(value));
    }
  }

  if (booleanColumns.has(column)) {
    return Boolean(value);
  }

  return value;
}

async function insertRows(connection, tableName, columns, rows) {
  if (rows.length === 0) {
    return;
  }

  const quotedColumns = columns.map((column) => `\`${column}\``).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO \`${tableName}\` (${quotedColumns}) VALUES (${placeholders})`;

  for (const row of rows) {
    await connection.execute(
      sql,
      columns.map((column) => normalizeValue(column, row[column])),
    );
  }
}

async function main() {
  const database = new DatabaseSync(process.env.SQLITE_PATH || "prisma/prisma/blog.db");
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || "3306"),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
    charset: "utf8mb4",
  });

  try {
    const users = readAll(database, "User");
    const categories = readAll(database, "Category");
    const friendLinks = readAll(database, "FriendLink");
    const posts = readAll(database, "Post");
    const comments = readAll(database, "Comment");
    const reactions = readAll(database, "Reaction");
    const visits = readAll(database, "Visit");
    const passwordResetTokens = readAll(database, "PasswordResetToken");

    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.beginTransaction();

    for (const table of ["Visit", "Reaction", "Comment", "PasswordResetToken", "Post", "FriendLink", "Category", "User"]) {
      await connection.query(`DELETE FROM \`${table}\``);
    }

    await insertRows(connection, "User", ["id", "name", "email", "passwordHash", "avatar", "bio", "role", "createdAt", "updatedAt"], users);
    await insertRows(connection, "Category", ["id", "name", "slug", "description", "createdAt", "updatedAt"], categories);
    await insertRows(connection, "FriendLink", ["id", "name", "url", "description", "avatar", "sortOrder", "isActive", "createdAt", "updatedAt"], friendLinks);
    await insertRows(connection, "Post", ["id", "title", "slug", "excerpt", "content", "contentFormat", "coverImage", "tags", "categoryId", "published", "authorId", "createdAt", "updatedAt"], posts);
    await insertRows(connection, "Comment", ["id", "content", "postId", "authorId", "status", "createdAt"], comments);
    await insertRows(connection, "Reaction", ["id", "postId", "userId", "createdAt"], reactions);
    await insertRows(connection, "Visit", ["id", "path", "visitorKey", "postId", "userId", "createdAt"], visits);
    await insertRows(connection, "PasswordResetToken", ["id", "tokenHash", "userId", "expiresAt", "createdAt"], passwordResetTokens);

    await connection.commit();
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(
      JSON.stringify({
        users: users.length,
        categories: categories.length,
        friendLinks: friendLinks.length,
        posts: posts.length,
        comments: comments.length,
        reactions: reactions.length,
        visits: visits.length,
        passwordResetTokens: passwordResetTokens.length,
      }),
    );
  } catch (error) {
    await connection.rollback();
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    throw error;
  } finally {
    await connection.end();
    database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
