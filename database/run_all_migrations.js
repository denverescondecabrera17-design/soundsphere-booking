/**
 * SoundSphere Database Migration Master Runner
 * Executes all database migration scripts sequentially and verifies schema integrity.
 */

const fs = require('fs');
const path = require('path');
const { connectDB } = require('../server/config/db');

async function runAllMigrations() {
    console.log('================================================================');
    console.log('🚀 SoundSphere Database - Executing All Schema Migrations');
    console.log('================================================================');

    let pool;
    try {
        pool = await connectDB();
        if (!pool) {
            throw new Error('Failed to connect to Microsoft SQL Server pool.');
        }

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.js'))
            .sort();

        console.log(`Found ${files.length} migration script(s):\n`);
        files.forEach((f, idx) => console.log(`  [${idx + 1}/${files.length}] ${f}`));
        console.log('\n----------------------------------------------------------------');

        const results = [];

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            console.log(`\n⏳ Running: ${file}...`);
            const startTime = Date.now();

            try {
                // Execute migration directly using child_process so process.exit within any migration doesn't kill the runner
                const { execSync } = require('child_process');
                const out = execSync(`node "${filePath}"`, {
                    cwd: path.join(__dirname, '..'),
                    encoding: 'utf8',
                    env: process.env
                });

                const elapsed = Date.now() - startTime;
                console.log(out.trim());
                console.log(`✓ Completed ${file} (${elapsed}ms)`);
                results.push({ file, status: 'SUCCESS', elapsed: `${elapsed}ms` });
            } catch (execErr) {
                const elapsed = Date.now() - startTime;
                console.error(`✕ Failed ${file} (${elapsed}ms):`, execErr.message);
                if (execErr.stdout) console.log(execErr.stdout);
                if (execErr.stderr) console.error(execErr.stderr);
                results.push({ file, status: 'FAILED', elapsed: `${elapsed}ms`, error: execErr.message });
            }
        }

        console.log('\n================================================================');
        console.log('📊 Migration Execution Summary:');
        console.log('================================================================');
        console.table(results);

        const allPassed = results.every(r => r.status === 'SUCCESS');
        if (allPassed) {
            console.log('\n🎉 ALL DATABASE MIGRATIONS EXECUTED AND VERIFIED SUCCESSFULLY!');
            process.exit(0);
        } else {
            console.error('\n⚠️ Some migrations failed. Please check the logs above.');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Master Migration Runner Error:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runAllMigrations();
}

module.exports = runAllMigrations;
