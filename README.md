# custopolis
An interactive game for many players.

Player Experience
===
The players are all employees at Pod, a company which historically selling EV chargers, and which is now transforming itself into a "service" organisation, reflecting the understanding that it is the lifetime value of the customer which matters (LTV), not the hardware sale (since hardware is commoditised). The game is fun, fast-paced, and educates the players about the need to constantly anticipate and serve the customer throughout the long lifecycle of the service relationship.

Around 35 people play the game at once, all in the same space, over 15 minutes.

Welcome screen
---
Players arrive in a room where a QR code is displayed on the projector (this is being driven by a laptop running one of the clients - see "Game Logic" below).
As each player scans the QR code they are taken to a screen which shows their Team affiliation and colour, and the word "READY" (i.e. they are running the second of the two clients).
There are 5 teams, and each team has a colour and an animated mascot. The 5 colours (to be colourblind-friendly) are: dark red, mid-green, blue, bright orange, pink.
Each player is (persistently) allocated to one team, apparently at random. The count of players ready in each team is shown next to the animated mascot,
The screen has a backdrop saying "Welcome to Custopolis" with a backdrop showing a village name in front of a winding road down to a hamlet.
The controller presses a button on the laptop and the screen changes to...

Introduction screen
---
This screen explains how the game works, i.e.:
  * The 5 teams are laid-out horizontally, i.e. team 1 on the left
  * Each team has 5 customers (we'll tweak the exact number as we work-out how to make the most of the screen real estate).
  * Around each customer are cards which show their experience as they consider buying an EV and then start living the EV lifestyle.
  * They might have thoughts of their own, or be influenced by the media, or competitors.
  * Your job is to try to maximise the value that they perceive from Pod, and therefore their lifetime value to us, and you can do this in one of 3 ways:
  + Educate - explain what having an EV is like, counter FUD, answer questions
  + Offer - offer something of value to them 
  + Act - take action to solve a problem for them.
  * Money earned from the customer adds to your team score
  * Every member of the team with the highest score wins £5 in cash!
  * There are 3 rounds

Round screen
---
The screen shows the 5 x 5 array as above, with per-team score at the top of each team.
As money is earned by each team it "flies" from a customer into the pot, with noise.
Customers who have signed-up to a repeating payment will continually send money to the pot.
The customer "card" and the 5 cards around them are rounded rectangles (like playing cards).
There is space for 5(?) "cards" around each customer, representing their experience. At first these are blank, but then they get filled either with customer spontaneous thoughts, or the responses of "attention competitors".
Attention competitors are:
1) Octopus
2) Hive
3) Daily Fail newspaper
and the first two of these have their own animated mascots too.
At the top of the screen is a Round number (starts at 1), and a timer, which counts down 3 minutes for each round.
At the end of each round, a trumpet blares and the winning team gets animated.
At the end of the final round, "Game Over" appears in front.

The 25 customer names & descriptions are listed in CUSTOMERS.md

Each customer has various "state" variables which are reflected in little badges which appear at the bottom of their icon.
. Have an EV? (starts without)
. Have a Pod charger? (starts without)
. Loyalty: This has a value from 0..10 which corresponds to the alpha channel (10=fully non-transparent), and an affiliation which is either Pod, or Octopus, or Hive. So if the customer has an early Octopus affiliation (translucent Octopus) then with effort they can be "won round" to Pod, through stages where their loyalty to Octopus decreases, then switches to Pod, then increases.
. Education - either a dunce's cap if they've been anti-educated, or a mortarboard if educated

In order to influence a customer, each player sees on their screen their 5 customers in a vertical row, and can click on one of them.
Then to the right are 3 buttons:
  * Educate [answer a question in their mind, or counter FUD (Fear, Uncertainty, Doubt) spread by evil media]
  * Offer [s
  * Fix [fix a problem, e.g. a broken charger]

To win, players must keep an eye on what's going on with their customers, and take the right action at the right time.
The exact card that gets played is chosen automatically in response to what else is going on. So if for example the customers is thinking "Should I buy an EV?" and there's a headline from the Daily Mail saying "EVs catch fire" then if a player chooses that customer number and then hits "Educate", the game might automatically choose to display the "EVs catch fire 20 times less than ICE cars" card.

"MOMENTS.json" contains an array of possible 'moments' that a customer can experience, and Pod's possible responses in each case. The very first entry also contains a "_comment" entry explaining possible fields within each entry and their meaning.

The "rules" are never completely explained, but learned by context and experience. Basically:
  * “Too many bad cards = trouble”
  * “Education stabilises things and predisposes the customer to whoever educated them". Education doesn't sell things, but if you educated them they they are naturally more loyal.
  * “Fix clears space, wins loyalty and trust"
  * “Offers work when the space is clean and the customer is feeling good"

Round themes
---
The successive rounds develop in themes:

  * Round 1 — EVs & Chargers
    * Customers activate with EV curiosity
    * Only Educate + Offer really matter
    * No recurring £ yet (or very small)
  * Round 2 — Tariffs & Smart Charging
    * Existing customers surface bill shocks
    * SCR introduced
    * Recurring £ begins
    * Education suddenly feels important retroactively
  * Round 3 — Flex / Smart Home / V2G
    * Peaks, shocks, competitors intensify
    * Recurring £ dominates score
    * Teams who ignored education/support struggle badly

Implementation
===
There are two clients: the "laptop" one which shows the big screen and does audio, and the "mobile" one used by players.
Assets specific to each client are kept in separate directories, to minimise the assets loaded by the mobile client (to avoid local WiFi congestion). 
Each client is a single-page web app. There is no server-side code - the "laptop" client is effectively the server, but all clients (laptop and mobile) use Firebase Realtime to communicate.
So essentially it's a "real-time shooter" messaging setup, with common state shared by Firebase.
The codebase uses Vite + TypeScript with vanilla DOM (no framework) and separate entry points for `/laptop/` and `/mobile/`.
The architecture and code should minimise bandwidth use to keep the experience reliable for large groups on shared or cellular networks.

The QR code takes the player to the mobile client site, with credentials for the Firebase app.
Once all assets are loaded the screen displays "Ready".
Mascots are .PNG files with transparency, numbered X_001, X_002 etc., which are displayed in sequence (bouncing from first to last and back again).

The backdrops of the 3 screens should be easily-editable PNGs.
The screen is 16:9 ratio.

Randomly-assigning players to teams will lead to teams with different numbers - can we create a mechanism which is fairer (but still has the property that a player will consistently belong to the same team, even if they restart the app?)
All screens should show the original QR code in the corner in case of late-comers etc.

Runtime notes
===
Firebase Realtime Database holds all shared state. A single `activeSessionId` points at the current cohort so the laptop can reset safely between groups.
Player assignment uses a Firebase transaction to keep round-robin team counts fair even under simultaneous joins.

Setup
===
1) Copy `.env.example` to `.env` and fill the Firebase config values.
2) `npm install`
3) `npm run dev` then open `/laptop/` for the host view and `/mobile/` for player devices.

Deploy to GitHub Pages
===
1) Edit `package.json` and replace the `homepage` placeholder with your real GitHub username.
2) `npm run deploy`
3) Enable GitHub Pages for the repo and set it to deploy from the `gh-pages` branch.

Firebase setup (Realtime Database)
===
1) Go to the Firebase console and create a new project.
2) Add a Web App to the project and copy the config values into `.env`.
3) Create a Realtime Database (start in test mode for now).
4) Copy the database URL into `VITE_FIREBASE_DATABASE_URL` in `.env`.
