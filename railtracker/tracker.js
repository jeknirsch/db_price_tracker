import Database from 'better-sqlite3';
import { createClient } from 'db-vendo-client';
import { profile as dbProfile } from 'db-vendo-client/p/db/index.js';

// --- CONFIGURATION ---
const DB_FILE = 'railtracker.db';
const FROM_STATION = '8000191'; // Karlsruhe Hbf
const TO_STATION = '8096013';   // Your specific Munich station
const CONTACT = 'jeknirsch+railtracker@gmail.com';

// --- DATABASE SETUP ---
const db = new Database(DB_FILE);
// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetch_timestamp TEXT,
    journey_date TEXT,
    train_name TEXT,
    departure_time TEXT,
    arrival_time TEXT,
    price_amount REAL,
    currency TEXT
  )
`);

const insertStmt = db.prepare(`
  INSERT INTO prices (fetch_timestamp, journey_date, train_name, departure_time, arrival_time, price_amount, currency)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// --- HELPER: Get Next Specific Weekday ---
function getNextDayOfWeek(date, dayOfWeek) {
    // dayOfWeek: 0 (Sun) to 6 (Sat). Friday is 5.
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

    // If today is Friday, and we want next Friday, add 7 days (optional, depends on preference)
    // Currently, if today is Friday, it returns today. Let's force it to be *next* week if it's too close.
    if (resultDate.getTime() <= date.getTime()) {
        resultDate.setDate(resultDate.getDate() + 7);
    }

    // Set time to morning (e.g., 08:00)
    resultDate.setHours(8, 0, 0, 0);
    return resultDate;
}

// --- MAIN LOGIC ---
async function runTracker() {
    const client = createClient(dbProfile, CONTACT);

    // Calculate "Next Friday at 08:00" dynamically
    const targetDate = getNextDayOfWeek(new Date(), 5);

    console.log(`[${new Date().toISOString()}] Starting check for Friday: ${targetDate.toISOString()}`);

    try {
        const result = await client.journeys(FROM_STATION, TO_STATION, {
            departure: targetDate,
            results: 5,
            bestprice: true, //
            class: 2,
            transfers: 0,
        });

        if (!result.journeys || result.journeys.length === 0) {
            console.log("No journeys found.");
            return;
        }

        let savedCount = 0;

        // Use a transaction for safer/faster multiple inserts
        const transaction = db.transaction((journeys) => {
            for (const journey of journeys) {
                // Skip if no price (sometimes happens with partially booked trains)
                if (!journey.price) continue;

                // Extract clean data
                const leg = journey.legs[0]; // Since direct train, we only care about leg 0
                const trainName = leg.line ? leg.line.name : 'Unknown';

                insertStmt.run(
                    new Date().toISOString(),      // fetch_timestamp
                    targetDate.toISOString(),      // journey_date (target)
                    trainName,                     // train_name
                    leg.departure,                 // departure_time
                    leg.arrival,                   // arrival_time
                    journey.price.amount,          // price_amount
                    journey.price.currency         // currency
                );
                savedCount++;
                console.log(`Saved: ${trainName} at ${new Date(leg.departure).toLocaleTimeString()} - ${journey.price.amount} ${journey.price.currency}`);
            }
        });

        transaction(result.journeys);
        console.log(`Success! Saved ${savedCount} entries to ${DB_FILE}.`);

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
    }
}

runTracker();