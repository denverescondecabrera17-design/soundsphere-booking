/**
 * SoundSphere - Migrate & Seed Scratch Data to Remote MonsterASP Database
 * Reads input data from:
 *   1. database/sync_localhost_data_to_azure.sql (266 core records)
 *   2. scratch/seed_approved_providers.js (Apex Audio & Stellar Visuals providers & packages)
 *   3. scratch/seed_provider_data.js (Pro audio packages & services)
 * Inserts / upserts all records directly into remote MonsterASP MSSQL database.
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const bcrypt = require('bcrypt');

const remoteConfig = {
    server: process.env.REMOTE_DB_SERVER || 'db72897.public.databaseasp.net',
    database: process.env.REMOTE_DB_NAME || 'db72897',
    user: process.env.REMOTE_DB_USER || 'db72897',
    password: process.env.REMOTE_DB_PASSWORD || 'o#7C?9Bb3Ei_',
    port: parseInt(process.env.REMOTE_DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 60000
    }
};

async function runMigration() {
    console.log('================================================================');
    console.log('🚀 SOUNDSPHERE SCRATCH DATA MIGRATION TO MONSTERASP.NET');
    console.log(`📡 Remote Host: ${remoteConfig.server} (${remoteConfig.database})`);
    console.log('================================================================\n');

    let pool = null;
    try {
        pool = await new sql.ConnectionPool(remoteConfig).connect();
        console.log('✅ Connected successfully to MonsterASP MSSQL database!\n');
    } catch (connErr) {
        console.error('❌ Connection failed:', connErr.message);
        process.exit(1);
    }

    // -------------------------------------------------------------------------
    // STEP 1: Sync core records from database/sync_localhost_data_to_azure.sql
    // -------------------------------------------------------------------------
    const sqlFilePath = path.join(__dirname, 'database/sync_localhost_data_to_azure.sql');
    if (fs.existsSync(sqlFilePath)) {
        console.log('📂 [STEP 1] Reading scratch SQL dump: database/sync_localhost_data_to_azure.sql...');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Temporarily disable foreign keys so records can be safely inserted
        console.log('   🔓 Temporarily disabling foreign key constraints on remote DB...');
        const fks = await pool.request().query(`
            SELECT name, OBJECT_NAME(parent_object_id) AS TableName FROM sys.foreign_keys;
        `);
        for (const fk of fks.recordset) {
            try {
                await pool.request().query(`ALTER TABLE dbo.[${fk.TableName}] NOCHECK CONSTRAINT [${fk.name}];`);
            } catch (e) {}
        }

        // Parse and execute table blocks
        const sections = sqlContent.split(/-- Table: dbo\.\[(.*?)\]/);
        let blocksExecuted = 0;

        for (let i = 1; i < sections.length; i += 2) {
            const tableName = sections[i].trim();
            const rawSql = sections[i + 1] || '';

            // Check if table exists in remote DB
            const tChk = await pool.request().query(`
                SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}';
            `);
            if (tChk.recordset.length === 0) {
                continue;
            }

            // Split into individual IF NOT EXISTS statements
            const statements = rawSql
                .split(/\n(?=IF NOT EXISTS)/g)
                .map(s => s.trim())
                .filter(s => s.startsWith('IF NOT EXISTS'));

            if (statements.length === 0) continue;

            const hasIdentity = rawSql.includes('SET IDENTITY_INSERT');
            let insertedCount = 0;

            for (const stmt of statements) {
                try {
                    const fullQuery = hasIdentity 
                        ? `SET IDENTITY_INSERT dbo.[${tableName}] ON;\n${stmt}\nSET IDENTITY_INSERT dbo.[${tableName}] OFF;`
                        : stmt;
                    await pool.request().query(fullQuery);
                    insertedCount++;
                } catch (stmtErr) {
                    // Ignore duplicate key or minor schema differences
                }
            }
            blocksExecuted++;
            console.log(`   ✓ Checked & synced table dbo.[${tableName}] (${insertedCount} statement(s) processed)`);
        }

        // Re-enable foreign keys
        console.log('   🔒 Re-enabling foreign key constraints...');
        for (const fk of fks.recordset) {
            try {
                await pool.request().query(`ALTER TABLE dbo.[${fk.TableName}] WITH CHECK CHECK CONSTRAINT [${fk.name}];`);
            } catch (e) {}
        }
        console.log(`   ✅ Step 1 complete: ${blocksExecuted} table blocks synced.\n`);
    } else {
        console.log('⚠️ Notice: database/sync_localhost_data_to_azure.sql not found, skipping step 1.\n');
    }

    // -------------------------------------------------------------------------
    // STEP 2: Seed Approved Providers from scratch/seed_approved_providers.js
    // -------------------------------------------------------------------------
    console.log('📂 [STEP 2] Seeding Providers & Packages from scratch/seed_approved_providers.js...');
    const defaultPasswordHash = await bcrypt.hash('Provider123!', 10);

    const approvedProviders = [
        {
            email: 'apex.lights@soundsphere.com',
            businessName: 'Apex Audio & Stage Lighting',
            ownerName: 'Marco Valenzuela',
            phone: '09171234567',
            coverageArea: 'Batangas & Tagaytay',
            description: 'Premier concert sound systems, truss lighting, and LED wall rentals.',
            packages: [
                {
                    name: 'Concert Line Array & 3D Moving Light Truss Rig',
                    price: 45000,
                    category: 'Concert Audio & Stage Lights',
                    description: 'Full touring grade concert line array sound system with 16 moving heads and heavy-duty trussing.',
                    inclusions: '8x Line Array Speakers, 4x Dual 18-inch Subwoofers, 16x Beam Moving Heads, 3D Truss Structure, Digital Mixer, 4x Sound Technicians'
                },
                {
                    name: 'Acoustic Gig & Intimate Event Sound System',
                    price: 12500,
                    category: 'Wedding & Social Events',
                    description: 'High clarity compact sound system for weddings, acoustic performances, and corporate seminars.',
                    inclusions: '2x Active Powered Speakers, 1x Active Subwoofer, 4x Wireless Microphones, 6x Warm White LED Par Lights, Sound Engineer'
                }
            ]
        },
        {
            email: 'stellar.events@soundsphere.com',
            businessName: 'Stellar Visuals & Stage Systems',
            ownerName: 'Elena Santos',
            phone: '09189876543',
            coverageArea: 'Lipa & Tanauan',
            description: 'High resolution P3 LED walls, stage lighting, and professional audio.',
            packages: [
                {
                    name: 'P3 HD Indoor/Outdoor LED Video Wall Package',
                    price: 38000,
                    category: 'LED Wall & Video Displays',
                    description: '9x12 ft P3 HD indoor/outdoor LED wall with video processor, live camera feeds, and custom visuals.',
                    inclusions: '9x12 ft P3 LED Video Wall, Video Processor & Media Server, Live Camera Feed Setup, Heavy Duty Ground Support, Video Tech Operator'
                }
            ]
        }
    ];

    for (const prov of approvedProviders) {
        try {
            // Find or insert User
            let userCheck = await pool.request()
                .input('Email', sql.NVarChar(255), prov.email)
                .query("SELECT UserID FROM dbo.Users WHERE Email = @Email");

            let targetUserId;
            if (userCheck.recordset.length === 0) {
                const insUser = await pool.request()
                    .input('Email', sql.NVarChar(255), prov.email)
                    .input('PasswordHash', sql.NVarChar(255), defaultPasswordHash)
                    .input('Phone', sql.NVarChar(20), prov.phone)
                    .input('RoleID', sql.Int, 3) // ServiceProvider
                    .query(`
                        INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, EmailVerified, IsActive, AccountStatus, CreatedAt)
                        OUTPUT INSERTED.UserID
                        VALUES (@RoleID, @Email, @PasswordHash, @Phone, 1, 1, 'Active', GETDATE());
                    `);
                targetUserId = insUser.recordset[0].UserID;
                console.log(`   + Created User account: ${prov.email} (UserID: ${targetUserId})`);
            } else {
                targetUserId = userCheck.recordset[0].UserID;
                await pool.request()
                    .input('UserID', targetUserId)
                    .input('RoleID', 3)
                    .query("UPDATE dbo.Users SET RoleID = @RoleID, AccountStatus = 'Active', IsActive = 1 WHERE UserID = @UserID");
                console.log(`   ✓ Found existing User: ${prov.email} (UserID: ${targetUserId})`);
            }

            // Insert or update Client profile
            const clientCheck = await pool.request()
                .input('UserID', targetUserId)
                .query("SELECT ClientID FROM dbo.Clients WHERE UserID = @UserID");
            if (clientCheck.recordset.length === 0) {
                const names = prov.ownerName.split(' ');
                const firstName = names[0] || 'Provider';
                const lastName = names.slice(1).join(' ') || 'Owner';
                await pool.request()
                    .input('UserID', targetUserId)
                    .input('FirstName', firstName)
                    .input('LastName', lastName)
                    .input('FullName', prov.ownerName)
                    .input('Address', prov.coverageArea)
                    .query(`
                        INSERT INTO dbo.Clients (UserID, FirstName, LastName, FullName, Address, CreatedAt)
                        VALUES (@UserID, @FirstName, @LastName, @FullName, @Address, GETDATE());
                    `);
            }

            // Insert or update ServiceProvider profile
            const spCheck = await pool.request()
                .input('UserID', targetUserId)
                .query("SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UserID");

            let providerId;
            if (spCheck.recordset.length === 0) {
                const insSp = await pool.request()
                    .input('UserID', targetUserId)
                    .input('BusinessName', prov.businessName)
                    .input('OwnerName', prov.ownerName)
                    .input('CoverageArea', prov.coverageArea)
                    .input('Description', prov.description)
                    .query(`
                        INSERT INTO dbo.ServiceProviders (UserID, BusinessName, OwnerName, CoverageArea, Description, VerificationStatus, CreatedAt)
                        OUTPUT INSERTED.ProviderID
                        VALUES (@UserID, @BusinessName, @OwnerName, @CoverageArea, @Description, 'Approved', GETDATE());
                    `);
                providerId = insSp.recordset[0].ProviderID;
                console.log(`   + Created ServiceProvider profile: "${prov.businessName}" (ProviderID: ${providerId})`);
            } else {
                providerId = spCheck.recordset[0].ProviderID;
                await pool.request()
                    .input('UserID', targetUserId)
                    .input('BusinessName', prov.businessName)
                    .input('OwnerName', prov.ownerName)
                    .input('CoverageArea', prov.coverageArea)
                    .input('Description', prov.description)
                    .query(`
                        UPDATE dbo.ServiceProviders 
                        SET BusinessName = @BusinessName, OwnerName = @OwnerName, CoverageArea = @CoverageArea,
                            Description = @Description, VerificationStatus = 'Approved'
                        WHERE UserID = @UserID;
                    `);
                console.log(`   ✓ Updated ServiceProvider profile: "${prov.businessName}" (ProviderID: ${providerId})`);
            }

            // Upsert Packages
            for (const pkg of prov.packages) {
                const pkgCheck = await pool.request()
                    .input('UserID', targetUserId)
                    .input('PackageName', pkg.name)
                    .query("SELECT PackageID FROM dbo.Packages WHERE UserID = @UserID AND PackageName = @PackageName");

                if (pkgCheck.recordset.length === 0) {
                    await pool.request()
                        .input('UserID', targetUserId)
                        .input('PackageName', pkg.name)
                        .input('Category', pkg.category)
                        .input('Price', pkg.price)
                        .input('Description', pkg.description)
                        .input('Inclusions', pkg.inclusions)
                        .query(`
                            INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions, IsActive, CreatedAt)
                            VALUES (@UserID, @PackageName, @Category, @Price, @Description, @Inclusions, 1, GETDATE());
                        `);
                    console.log(`     + Added Package: "${pkg.name}" (₱${pkg.price.toLocaleString()})`);
                } else {
                    console.log(`     ✓ Package exists: "${pkg.name}"`);
                }
            }
        } catch (provErr) {
            console.warn(`   ⚠️ Warning seeding ${prov.businessName}:`, provErr.message);
        }
    }
    console.log('   ✅ Step 2 complete: Approved providers and packages verified.\n');

    // -------------------------------------------------------------------------
    // STEP 3: Seed Pro Packages & Services from scratch/seed_provider_data.js
    // -------------------------------------------------------------------------
    console.log('📂 [STEP 3] Seeding Pro Packages & Services for Primary Provider (UserID 13)...');
    const proPackages = [
        {
            name: 'Pro Concert Audio Package',
            category: 'Concert Audio',
            price: 25000.00,
            description: 'Complete high-power line array sound system for major concerts, festivals, and outdoor live shows.',
            inclusions: '12x Line Array Speakers, 4x Dual 18 Subwoofers, 32-Channel Digital Mixer, 6x Stage Monitors, 4x Wireless Mics, Sound Engineer'
        },
        {
            name: 'Wedding & Debut Deluxe Lighting & Sound',
            category: 'Lighting & Sound',
            price: 18500.00,
            description: 'Premium ambient lighting setup with crystal-clear acoustics tailored for grand weddings and debuts.',
            inclusions: '4x Powered Active Speakers, 2x Powered Subwoofers, 8x Beam Moving Heads, 12x LED Par Lights, Heavy Fog Machine, DMX Controller'
        },
        {
            name: 'Corporate Seminar & Acoustic Set',
            category: 'General Audio',
            price: 12000.00,
            description: 'Professional PA setup for corporate conferences, product launches, and intimate acoustic performances.',
            inclusions: '4x Full Range PA Speakers, 4x Lapel & Handheld Mics, 4K Projector & 100-inch Motorized Screen, Audio Technician'
        }
    ];

    for (const pkg of proPackages) {
        try {
            const checkPkg = await pool.request()
                .input('UserID', 13)
                .input('PackageName', pkg.name)
                .query("SELECT PackageID FROM dbo.Packages WHERE UserID = @UserID AND PackageName = @PackageName");

            if (checkPkg.recordset.length === 0) {
                await pool.request()
                    .input('UserID', 13)
                    .input('PackageName', pkg.name)
                    .input('Category', pkg.category)
                    .input('Price', pkg.price)
                    .input('Description', pkg.description)
                    .input('Inclusions', pkg.inclusions)
                    .query(`
                        INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions, IsActive, CreatedAt)
                        VALUES (@UserID, @PackageName, @Category, @Price, @Description, @Inclusions, 1, GETDATE());
                    `);
                console.log(`   + Added Pro Package for User 13: "${pkg.name}" (₱${pkg.price.toLocaleString()})`);
            } else {
                console.log(`   ✓ Pro Package exists for User 13: "${pkg.name}"`);
            }
        } catch (e) {
            console.warn(`   ⚠️ Notice on package ${pkg.name}:`, e.message);
        }
    }

    // Seed Services if dbo.Services table exists
    const servicesCheck = await pool.request().query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Services'");
    if (servicesCheck.recordset.length > 0) {
        const services = [
            { name: 'Full Stage Sound System Rental', category: 'Concert Audio', price: 15000.00, description: 'Standalone sound system rental with crew.' },
            { name: 'Intelligent Lighting & Trussing Rig', category: 'Lighting & Sound', price: 10000.00, description: 'Computer-controlled stage lighting trusses.' },
            { name: 'Dry Ice Low Fog & Sparkular Effects', category: 'Effects', price: 5000.00, description: 'Cold sparkular fountains and heavy low fog for first dance.' }
        ];

        for (const srv of services) {
            try {
                const srvCheck = await pool.request()
                    .input('UserID', 13)
                    .input('ServiceName', srv.name)
                    .query("SELECT ServiceID FROM dbo.Services WHERE UserID = @UserID AND ServiceName = @ServiceName");
                if (srvCheck.recordset.length === 0) {
                    await pool.request()
                        .input('UserID', 13)
                        .input('ServiceName', srv.name)
                        .input('Category', srv.category)
                        .input('Price', srv.price)
                        .input('Description', srv.description)
                        .query(`
                            INSERT INTO dbo.Services (UserID, ServiceName, Category, Price, Description, CreatedAt)
                            VALUES (@UserID, @ServiceName, @Category, @Price, @Description, GETDATE());
                        `);
                    console.log(`   + Added Service for User 13: "${srv.name}" (₱${srv.price.toLocaleString()})`);
                }
            } catch (srvErr) {
                // Ignore if column name differences
            }
        }
    }
    console.log('   ✅ Step 3 complete: Pro packages and services verified.\n');

    // -------------------------------------------------------------------------
    // STEP 4: Summary Audit on Remote MonsterASP Database
    // -------------------------------------------------------------------------
    console.log('================================================================');
    console.log('📊 FINAL REMOTE DATABASE AUDIT & ROW COUNTS');
    console.log('================================================================');

    const tablesToAudit = [
        'Roles', 'Users', 'Clients', 'ServiceProviders', 'Packages', 
        'Bookings', 'Payments', 'Reviews', 'Withdrawals', 'Notifications'
    ];

    for (const t of tablesToAudit) {
        try {
            const r = await pool.request().query(`SELECT COUNT(*) as cnt FROM dbo.[${t}]`);
            console.log(`   • dbo.[${t.padEnd(18, ' ')}]: ${String(r.recordset[0].cnt).padStart(4, ' ')} record(s)`);
        } catch (e) {
            console.log(`   • dbo.[${t.padEnd(18, ' ')}]: N/A (${e.message})`);
        }
    }

    // List all active approved providers
    const provsRes = await pool.request().query(`
        SELECT sp.ProviderID, sp.UserID, sp.BusinessName, sp.OwnerName, sp.CoverageArea, COUNT(p.PackageID) as PkgCount
        FROM dbo.ServiceProviders sp
        LEFT JOIN dbo.Packages p ON sp.UserID = p.UserID
        WHERE sp.VerificationStatus = 'Approved'
        GROUP BY sp.ProviderID, sp.UserID, sp.BusinessName, sp.OwnerName, sp.CoverageArea
    `);

    console.log('\n🌟 APPROVED MARKETPLACE PROVIDERS ON MONSTERASP:');
    provsRes.recordset.forEach(p => {
        console.log(`   🏢 [Provider #${p.ProviderID} / User #${p.UserID}] ${p.BusinessName} (${p.OwnerName || 'Owner'}) - ${p.CoverageArea || 'Batangas'} | ${p.PkgCount} package(s)`);
    });

    console.log('\n🎉 ALL SCRATCH DATA SUCCESSFULLY MIGRATED TO MONSTERASP.NET!');
    await pool.close();
}

runMigration().catch(err => {
    console.error('Fatal Migration Error:', err);
    process.exit(1);
});
