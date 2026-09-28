const { connectDB } = require('../server/config/db');
const bookingModel = require('../server/models/bookingModel');

async function testPricingCalculations() {
    console.log("=== Testing Pricing Calculations (1-day, 2-day, 3-day & 50% Downpayment / 100% Full Payment) ===");
    await connectDB();

    // Test Package
    const packagePrice = 10000.00;
    const additionalDayPct = 20.00; // 20%

    // Haversine distance function helper
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((R * c) * 10) / 10;
    }

    // Distance fee lookup function
    function getTransportFee(distKm, feeTiers) {
        for (const tier of feeTiers) {
            if (distKm >= parseFloat(tier.MinDistanceKm) && distKm <= parseFloat(tier.MaxDistanceKm)) {
                return parseFloat(tier.ServiceFee);
            }
        }
        return 2000.00;
    }

    const feeTiers = await bookingModel.getTransportationFees();
    console.log(`Fetched ${feeTiers.length} transportation fee tiers from DB:`, feeTiers.map(t => `${t.MinDistanceKm}-${t.MaxDistanceKm}km: ₱${t.ServiceFee}`));

    // Test cases:
    // Lian (13.8402, 120.6558) to Balayan (13.9388, 120.7308) -> ~13.8 km (Tier 10.01-20km -> ₱750)
    const providerLat = 13.8402;
    const providerLng = 120.6558;
    const eventLat = 13.9388;
    const eventLng = 120.7308;

    const distKm = calculateHaversineDistance(providerLat, providerLng, eventLat, eventLng);
    const transportFee = getTransportFee(distKm, feeTiers);

    console.log(`\nCalculated distance: ${distKm} km | Applied Transport Fee: ₱${transportFee}`);

    const testDays = [1, 2, 3];
    const paymentPlans = ['downpayment', 'full'];

    for (const days of testDays) {
        const additionalDayRate = packagePrice * (additionalDayPct / 100);
        const additionalDayCharges = days > 1 ? additionalDayRate * (days - 1) : 0;
        const totalBookingPrice = packagePrice + additionalDayCharges + transportFee;

        console.log(`\n--- Test Case: ${days} Service Hire Day(s) ---`);
        console.log(`Package Base Price:       ₱${packagePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        console.log(`Additional Day Charges:   ₱${additionalDayCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${days > 1 ? `${days - 1} add'l day(s) @ ${additionalDayPct}%` : 'None'})`);
        console.log(`Transport / Service Fee:  ₱${transportFee.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${distKm} km)`);
        console.log(`TOTAL BOOKING PRICE:      ₱${totalBookingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

        for (const plan of paymentPlans) {
            const dueNow = plan === 'downpayment' ? Math.round(totalBookingPrice * 0.5) : totalBookingPrice;
            const remaining = totalBookingPrice - dueNow;
            console.log(`  > ${plan === 'downpayment' ? '50% Down Payment' : '100% Full Payment'}: Due Now = ₱${dueNow.toLocaleString()}, Remaining = ₱${remaining.toLocaleString()}`);
        }

        // Expected assertions check
        if (days === 1) {
            if (additionalDayCharges !== 0) throw new Error("1-day booking should have 0 additional day charge");
            if (totalBookingPrice !== 10750) throw new Error(`Expected 1-day total ₱10,750, got ₱${totalBookingPrice}`);
        } else if (days === 2) {
            if (additionalDayCharges !== 2000) throw new Error("2-day booking should have ₱2,000 additional day charge");
            if (totalBookingPrice !== 12750) throw new Error(`Expected 2-day total ₱12,750, got ₱${totalBookingPrice}`);
        } else if (days === 3) {
            if (additionalDayCharges !== 4000) throw new Error("3-day booking should have ₱4,000 additional day charge");
            if (totalBookingPrice !== 14750) throw new Error(`Expected 3-day total ₱14,750, got ₱${totalBookingPrice}`);
        }
    }

    console.log("\n✅ ALL TEST CALCULATIONS PASSED EMPIRICAL VERIFICATION!");
    process.exit(0);
}

testPricingCalculations();
