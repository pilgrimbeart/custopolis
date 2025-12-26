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

In order to influence a customer, each player sees on their screen their 5 customers in a vertical row, and can click on one of them.
Then to the right are 3 buttons: Educate, Offer, Act.
So to win, players must keep an eye on what's going on with their customers, and do the appropriate thing.
The exact card that gets played is chosen automatically in response to what else is going on. So if for example the customers is thinking "Should I buy an EV?" and there's a headline from the Daily Mail saying "EVs catch fire" then if a player chooses that customer number and then hits "Educate", the game might automatically choose to display the "EVs catch fire 20 times less than ICE cars" card.

The set of thoughts and responses is dealt with in another file.


Implementation
===
There are two clients: the "laptop" one which shows the big screen and does audio, and the "mobile" one used by players. We keep these in separate directories, in order to minimise the assets loaded by the mobile one (to avoid local WiFi congestion). 
Each client is a single-page web app. There is no server-side code - the "laptop" client is effectively the server, but all clients (laptop and mobile) use Firebase Realtime to communicate.
So essentially it's a "real-time shooter" setup, with common state shared by Firebase.

The QR code takes the player to the mobile client site, with credentials for the Firebase app.
Once all assets are loaded the screen displays "Ready".
Mascots are .PNG files with transparency, numbered X_001, X_002 etc., which are displayed in sequence (bouncing from first to last and back again).

The backdrops of the 3 screens should be easily-editable PNGs.
The screen is 16:9 ratio.

Randomly-assigning players to teams will lead to teams with different numbers - can we create a mechanism which is fairer (but still has the property that a player will consistently belong to the same team, even if they restart the app?)
All screens should show the original QR code in the corner in case of late-comers etc.



