import fs from "fs";
import path from "path";
import "dotenv/config";

import Oracle from "../libs/oracle";

// ─── Helpers ───────────────────────────────────────────────────────

function parseFileName(fileName: string): { appId: number; sqlNo: number } | null {
    const m = fileName.match(/^(\d+)_([0-9]+)\.sql$/);
    if (!m) return null;
    const appId = Number(m[1]);
    const sqlNo = Number(m[2]);
    if (Number.isNaN(appId) || Number.isNaN(sqlNo)) return null;
    return { appId, sqlNo };
}

function getOnlyArg(): string | null {
    const raw = process.argv.find((a) => a.startsWith("--only="));
    if (!raw) return null;
    const value = raw.slice("--only=".length).trim();
    return value.length > 0 ? value : null;
}

function parseOnlyList(value: string): {
    sqlNoSet: Set<number>;
    appSqlSet: Set<string>;
} {
    const sqlNoSet = new Set<number>();
    const appSqlSet = new Set<string>();

    value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((token) => {
            if (token.includes("_")) {
                const [app, no] = token.split("_");
                const appId = Number(app);
                const sqlNo = Number(no);
                if (!Number.isNaN(appId) && !Number.isNaN(sqlNo))
                    appSqlSet.add(`${appId}_${sqlNo}`);
                return;
            }
            const sqlNo = Number(token);
            if (!Number.isNaN(sqlNo)) sqlNoSet.add(sqlNo);
        });

    return { sqlNoSet, appSqlSet };
}

// ─── Flags ─────────────────────────────────────────────────────────

const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
const download =
    process.argv.includes("--download") ||
    process.argv.includes("--pull") ||
    process.env.DOWNLOAD === "1";

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
    try {
        const onlyArg = getOnlyArg();
        const only = onlyArg ? parseOnlyList(onlyArg) : null;
        const baseDir = path.resolve(process.cwd(), "src", "sqltabs");

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        const oracle = new Oracle(process.env.ORACLE_DB_NAME || "");

        // ═══════════════════════════════════════════════════════════
        // ─── DOWNLOAD MODE ─────────────────────────────────────────
        // ═══════════════════════════════════════════════════════════

        if (download) {
            const appIdFromEnv = Number(process.env.APP_ID);

            const explicitAppIds = only?.appSqlSet
                ? Array.from(
                      new Set(
                          Array.from(only.appSqlSet)
                              .map((x) => Number(x.split("_")[0]))
                              .filter((x) => !Number.isNaN(x)),
                      ),
                  )
                : [];

            const appIds =
                explicitAppIds.length > 0
                    ? explicitAppIds
                    : !Number.isNaN(appIdFromEnv)
                      ? [appIdFromEnv]
                      : ([] as number[]);

            if (appIds.length === 0) {
                console.error("Download requires APP_ID env or --only=<appId_sqlNo,...>");
                process.exit(1);
            }

            const rows = (
                await Promise.all(
                    appIds.map(async (appId) => {
                        const sql = `
                            SELECT APP_ID, SQL_NO, SQL_STMT
                            FROM KPDBA.SQL_TAB_OPPN
                            WHERE APP_ID = :appId
                            ORDER BY SQL_NO
                        `;
                        return oracle.query<{
                            APP_ID: number;
                            SQL_NO: number;
                            SQL_STMT: string;
                        }>(sql, { appId }, {
                            fetchInfo: {
                                SQL_STMT: { type: "STRING" },
                            },
                        } as any);
                    }),
                )
            ).flat();

            const filtered = rows.filter((r) => {
                if (!only) return true;
                if (only.appSqlSet.size > 0 && only.appSqlSet.has(`${r.APP_ID}_${r.SQL_NO}`))
                    return true;
                if (only.sqlNoSet.size > 0 && only.sqlNoSet.has(Number(r.SQL_NO))) return true;
                return false;
            });

            if (filtered.length === 0) {
                console.error(
                    onlyArg
                        ? `No matching rows found in SQL_TAB_OPPN for --only=${onlyArg}`
                        : "No rows found in SQL_TAB_OPPN",
                );
                process.exit(1);
            }

            const plan = filtered.map((r) => {
                const fileName = `${r.APP_ID}_${r.SQL_NO}.sql`;
                const filePath = path.join(baseDir, fileName);
                const nextContent = (r.SQL_STMT ?? "").toString();
                const existed = fs.existsSync(filePath);
                const prevContent = existed ? fs.readFileSync(filePath, "utf-8") : "";
                const action = existed ? (prevContent === nextContent ? "SAME" : "WRITE") : "WRITE";
                return { fileName, filePath, action, content: nextContent };
            });

            const toWrite = plan.filter((p) => p.action === "WRITE");

            if (dryRun) {
                console.log("DRY-RUN download plan:");
                toWrite.forEach((p) => console.log(`- WRITE ${p.fileName}`));
                console.log(`Total changes: ${toWrite.length}`);
                process.exit(0);
            }

            toWrite.forEach((p) => fs.writeFileSync(p.filePath, p.content, "utf-8"));
            console.log("SQL_TAB_OPPN downloaded to src/sqltabs");
            toWrite.forEach((p) => console.log(`- ${p.fileName}`));
            process.exit(0);
        }

        // ═══════════════════════════════════════════════════════════
        // ─── UPLOAD MODE (default) ─────────────────────────────────
        // ═══════════════════════════════════════════════════════════

        const files = fs
            .readdirSync(baseDir)
            .filter((f) => f.endsWith(".sql"))
            .filter((f) => {
                if (!only) return true;
                const parsed = parseFileName(f);
                if (!parsed) return false;
                if (
                    only.appSqlSet.size > 0 &&
                    only.appSqlSet.has(`${parsed.appId}_${parsed.sqlNo}`)
                )
                    return true;
                if (only.sqlNoSet.size > 0 && only.sqlNoSet.has(parsed.sqlNo)) return true;
                return false;
            });

        if (files.length === 0) {
            console.error(
                onlyArg
                    ? `No matching .sql files found for --only=${onlyArg}`
                    : "No .sql files found in src/sqltabs",
            );
            process.exit(1);
        }

        const paramsArr = files
            .map((fileName) => {
                const parsed = parseFileName(fileName);
                if (!parsed) return null;
                const { appId, sqlNo } = parsed;
                const filePath = path.join(baseDir, fileName);
                const sqlStmt = fs.readFileSync(filePath, "utf-8");
                return { appId, sqlNo, sqlStmt };
            })
            .filter(Boolean) as {
            appId: number;
            sqlNo: number;
            sqlStmt: string;
        }[];

        if (paramsArr.length === 0) {
            console.error("No valid <APP_ID>_<sql_no>.sql files found");
            process.exit(1);
        }

        // ─── Dry Run ──────────────────────────────────────────────

        if (dryRun) {
            const checks = await Promise.all(
                paramsArr.map(async (p) => {
                    const diffSql = `
                        SELECT CASE
                          WHEN EXISTS (SELECT 1 FROM KPDBA.SQL_TAB_OPPN WHERE APP_ID = :appId AND SQL_NO = :sqlNo) THEN
                            CASE NVL(DBMS_LOB.COMPARE(
                              (SELECT REGEXP_REPLACE(SQL_STMT, '\\s+', ' ') FROM KPDBA.SQL_TAB_OPPN WHERE APP_ID = :appId AND SQL_NO = :sqlNo),
                              REGEXP_REPLACE(TO_CLOB(:sqlStmt), '\\s+', ' ')
                            ), 1)
                              WHEN 0 THEN 'SAME'
                              ELSE 'UPDATE'
                            END
                          ELSE 'INSERT'
                        END AS ACTION
                        FROM DUAL
                    `;
                    const res = await oracle.query<{ ACTION: string }>(diffSql, {
                        appId: p.appId,
                        sqlNo: p.sqlNo,
                        sqlStmt: p.sqlStmt,
                    });
                    const action = res[0]?.ACTION || "UNKNOWN";
                    return { appId: p.appId, sqlNo: p.sqlNo, action };
                }),
            );

            const toApply = checks.filter((x) => x.action === "UPDATE" || x.action === "INSERT");

            console.log("DRY-RUN plan:");
            toApply.forEach((x) => console.log(`- ${x.action} ${x.appId}_${x.sqlNo}.sql`));
            console.log(`Total changes: ${toApply.length}`);
            process.exit(0);
        }

        // ─── Execute MERGE ────────────────────────────────────────

        const mergeSql = `
            MERGE INTO KPDBA.SQL_TAB_OPPN T
            USING (SELECT :appId AS APP_ID, :sqlNo AS SQL_NO, TO_CLOB(:sqlStmt) AS SQL_STMT FROM DUAL) S
            ON (T.APP_ID = S.APP_ID AND T.SQL_NO = S.SQL_NO)
            WHEN MATCHED THEN
              UPDATE SET T.SQL_STMT = S.SQL_STMT
              WHERE NVL(DBMS_LOB.COMPARE(
                REGEXP_REPLACE(T.SQL_STMT, '\\s+', ' '),
                REGEXP_REPLACE(S.SQL_STMT, '\\s+', ' ')
              ), 1) <> 0
            WHEN NOT MATCHED THEN
              INSERT (APP_ID, SQL_NO, SQL_STMT)
              VALUES (S.APP_ID, S.SQL_NO, S.SQL_STMT)
        `;

        await oracle.commandMany(
            mergeSql,
            paramsArr as any,
            {
                appId: { type: "NUMBER" },
                sqlNo: { type: "NUMBER" },
                sqlStmt: { type: "CLOB" },
            } as any,
        );

        console.log("SQL_TAB_OPPN synced from src/sqltabs");
        files.forEach((f) => console.log(`- ${f}`));
        process.exit(0);
    } catch (error: any) {
        console.error("Sync failed:", error?.message || error);
        process.exit(1);
    }
}

void main();
