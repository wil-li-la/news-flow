import 'dotenv/config';
import { summarizeNews } from './aiSummary.js';

(async () => {
try {
    const result = await summarizeNews({
        title: 'Sample: NASA anounces new mission',
        text: `NASA announced today that it will launch the Artemis II mission in November 2024, marking the first crewed flight to orbit the Moon in over 50 years. The mission will carry four astronauts — including the first woman and first person of color to travel beyond low Earth orbit — aboard the Orion spacecraft.
Artemis II is a key milestone in NASA’s broader Artemis program, which aims to establish a sustainable human presence on the Moon by the end of the decade. During the roughly 10-day mission, the crew will test life support systems, conduct communications checks, and evaluate Orion’s performance on its lunar trajectory.
NASA officials say the mission will pave the way for Artemis III, planned for no earlier than 2026, which will attempt the first lunar landing since Apollo 17 in 1972. The program is seen as a critical step toward preparing for eventual crewed missions to Mars.`,
        maxWords: 120
    });
    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.error('aiSummaryTest failed:', e.message);
    process.exit(1);
}
})();

// aiSummary appears to work 8-11, 3:11 AM