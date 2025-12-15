// probe.js
import { createClient } from 'db-vendo-client';
import { profile as dbProfile } from 'db-vendo-client/p/db/index.js';

// 1. Configure the client
const client = createClient(dbProfile, 'jeknirsch+railtracker@gmail.com');

async function checkPrices() {
    // 2. Define our trip
    // Station IDs: Karlsruhe Hbf (8000191), München Hbf (8000261)
    // 8000191 & zoei=8096013
    const from = '8000191';
    const to = '8096013';

    // Date: Next Friday at 08:00 (Adjust this date to be a real Friday in the future!)
    const targetDate = new Date('2025-12-20T08:00:00');

    console.log(`Checking prices for ${targetDate.toISOString()}...`);

    try {
        // 3. Fetch Journeys with 'bestprice' enabled to find the cheapest options
        // Reference: db-vendo-client/docs/journeys.md
        const result = await client.journeys(from, to, {
            departure: targetDate,
            results: 5,            // Top 5 results
            bestprice: true,       // Search for best prices
            class: 2,              // 2nd Class
            transfers: 0,          // Direct trains only
        });

        // 4. Print results (robust against missing fields)
        for (const [idx, journey] of (result.journeys || []).entries()) {
            const price = journey && journey.price ? `${journey.price.amount} ${journey.price.currency}` : 'No Price';

            // Ensure legs exist
            if (!journey || !Array.isArray(journey.legs) || journey.legs.length === 0) {
                console.log(`Journey ${idx + 1}: (no legs) | Price: ${price}`);
                continue;
            }

            const firstLeg = journey.legs[0];
            const depart = firstLeg && firstLeg.departure ? new Date(firstLeg.departure).toLocaleTimeString() : 'Unknown departure';
            const train = firstLeg && firstLeg.line && firstLeg.line.name ? firstLeg.line.name : (firstLeg && firstLeg.line ? JSON.stringify(firstLeg.line) : 'Unknown train');

            for (const [lidx, leg] of journey.legs.entries()) {
                const lineName = leg && leg.line && leg.line.name ? leg.line.name : (leg && leg.line ? JSON.stringify(leg.line) : 'Unknown line');
                const originName = leg && leg.origin && leg.origin.name ? leg.origin.name : (leg && leg.origin ? JSON.stringify(leg.origin) : 'Unknown origin');
                const destName = leg && leg.destination && leg.destination.name ? leg.destination.name : (leg && leg.destination ? JSON.stringify(leg.destination) : 'Unknown destination');
                console.log(`  Leg ${lidx + 1}: ${lineName} from ${originName} to ${destName}`);
            }

            console.log(`Journey ${idx + 1} | Train: ${train} | Departs: ${depart} | Price: ${price}`);
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

checkPrices();
