const { getPool, connectDB } = require('../server/config/db');

async function seedApprovedProviders() {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }

    console.log("=== Seeding Approved Service Providers & Packages into MSSQL DB ===");

    // Provider 2: Apex Audio & Stage Lighting
    const apexEmail = 'apex.lights@soundsphere.com';
    let apexUser = await pool.request().query(`SELECT UserID FROM dbo.Users WHERE Email = '${apexEmail}'`);
    let apexUserId = apexUser.recordset[0]?.UserID;

    if (!apexUserId) {
        const createApexUser = await pool.request().query(`
            INSERT INTO dbo.Users (Email, PasswordHash, RoleID, AccountStatus, Phone, CreatedAt)
            VALUES ('${apexEmail}', 'Password123!', 3, 'Active', '09171234567', GETDATE());
            SELECT SCOPE_IDENTITY() AS UserID;
        `);
        apexUserId = createApexUser.recordset[0].UserID;
        console.log(`Created Apex User ID #${apexUserId}`);
    }

    // Insert or update dbo.ServiceProviders for Apex
    await pool.request().query(`
        IF EXISTS (SELECT 1 FROM dbo.ServiceProviders WHERE UserID = ${apexUserId})
            UPDATE dbo.ServiceProviders 
            SET BusinessName = 'Apex Audio & Stage Lighting', OwnerName = 'Marco Valenzuela', CoverageArea = 'Batangas & Tagaytay', Description = 'Premier concert sound systems, truss lighting, and LED wall rentals.', VerificationStatus = 'Approved'
            WHERE UserID = ${apexUserId};
        ELSE
            INSERT INTO dbo.ServiceProviders (UserID, BusinessName, OwnerName, CoverageArea, Description, VerificationStatus, CreatedAt)
            VALUES (${apexUserId}, 'Apex Audio & Stage Lighting', 'Marco Valenzuela', 'Batangas & Tagaytay', 'Premier concert sound systems, truss lighting, and LED wall rentals.', 'Approved', GETDATE());
    `);

    // Insert Packages for Apex Audio
    const apexPkgs = [
        {
            name: 'Concert Line Array & 3D Moving Light Truss Rig',
            price: 45000,
            cat: 'Concert Audio & Stage Lights',
            desc: 'Full touring grade concert line array sound system with 16 moving heads and heavy-duty trussing.',
            inc: '8x Line Array Speakers, 4x Dual 18-inch Subwoofers, 16x Beam Moving Heads, 3D Truss Structure, Digital Mixer, 4x Sound Technicians'
        },
        {
            name: 'Acoustic Gig & Intimate Event Sound System',
            price: 12500,
            cat: 'Wedding & Social Events',
            desc: 'High clarity compact sound system for weddings, acoustic performances, and corporate seminars.',
            inc: '2x Active Powered Speakers, 1x Active Subwoofer, 4x Wireless Microphones, 6x Warm White LED Par Lights, Sound Engineer'
        }
    ];

    for (const p of apexPkgs) {
        const checkPkg = await pool.request().query(`
            SELECT PackageID FROM dbo.Packages WHERE UserID = ${apexUserId} AND PackageName = '${p.name.replace(/'/g, "''")}';
        `);
        if (checkPkg.recordset.length === 0) {
            await pool.request().query(`
                INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions, IsActive, CreatedAt)
                VALUES (${apexUserId}, '${p.name.replace(/'/g, "''")}', '${p.cat}', ${p.price}, '${p.desc.replace(/'/g, "''")}', '${p.inc.replace(/'/g, "''")}', 1, GETDATE());
            `);
            console.log(`Added Apex Package: "${p.name}"`);
        }
    }

    // Provider 3: Stellar Visuals & Stage Systems
    const stellarEmail = 'stellar.events@soundsphere.com';
    let stellarUser = await pool.request().query(`SELECT UserID FROM dbo.Users WHERE Email = '${stellarEmail}'`);
    let stellarUserId = stellarUser.recordset[0]?.UserID;

    if (!stellarUserId) {
        const createStellarUser = await pool.request().query(`
            INSERT INTO dbo.Users (Email, PasswordHash, RoleID, AccountStatus, Phone, CreatedAt)
            VALUES ('${stellarEmail}', 'Password123!', 3, 'Active', '09189876543', GETDATE());
            SELECT SCOPE_IDENTITY() AS UserID;
        `);
        stellarUserId = createStellarUser.recordset[0].UserID;
        console.log(`Created Stellar User ID #${stellarUserId}`);
    }

    // Insert or update dbo.ServiceProviders for Stellar
    await pool.request().query(`
        IF EXISTS (SELECT 1 FROM dbo.ServiceProviders WHERE UserID = ${stellarUserId})
            UPDATE dbo.ServiceProviders 
            SET BusinessName = 'Stellar Visuals & Stage Systems', OwnerName = 'Elena Santos', CoverageArea = 'Lipa & Tanauan', Description = 'High resolution P3 LED walls, stage lighting, and professional audio.', VerificationStatus = 'Approved'
            WHERE UserID = ${stellarUserId};
        ELSE
            INSERT INTO dbo.ServiceProviders (UserID, BusinessName, OwnerName, CoverageArea, Description, VerificationStatus, CreatedAt)
            VALUES (${stellarUserId}, 'Stellar Visuals & Stage Systems', 'Elena Santos', 'Lipa & Tanauan', 'High resolution P3 LED walls, stage lighting, and professional audio.', 'Approved', GETDATE());
    `);

    // Insert Packages for Stellar Visuals
    const stellarPkgs = [
        {
            name: 'P3 HD Indoor/Outdoor LED Video Wall Package',
            price: 38000,
            cat: 'LED Wall & Video Displays',
            desc: '9x12 ft P3 HD indoor/outdoor LED wall with video processor, live camera feeds, and custom visuals.',
            inc: '9x12 ft P3 LED Video Wall, Video Processor & Media Server, Live Camera Feed Setup, Heavy Duty Ground Support, Video Tech Operator'
        }
    ];

    for (const p of stellarPkgs) {
        const checkPkg = await pool.request().query(`
            SELECT PackageID FROM dbo.Packages WHERE UserID = ${stellarUserId} AND PackageName = '${p.name.replace(/'/g, "''")}';
        `);
        if (checkPkg.recordset.length === 0) {
            await pool.request().query(`
                INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions, IsActive, CreatedAt)
                VALUES (${stellarUserId}, '${p.name.replace(/'/g, "''")}', '${p.cat}', ${p.price}, '${p.desc.replace(/'/g, "''")}', '${p.inc.replace(/'/g, "''")}', 1, GETDATE());
            `);
            console.log(`Added Stellar Package: "${p.name}"`);
        }
    }

    console.log("✅ Seed completed successfully!");
    process.exit(0);
}

seedApprovedProviders();
