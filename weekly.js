// Mel's Quiz - the WEEKLY CHALLENGE questions.
//
// Each week has THREE topics of TEN questions. A week is named by the date of its MONDAY (UK date),
// written like "2026-11-16". The game works out the current week itself (in UK time, Monday 00:00 to
// the next Monday 00:00), then looks for it here. If there's no entry for the current week the
// weekly challenge says "no challenge this week", so add new weeks before they start!
//
// HOW TO ADD A WEEK: copy a whole week block below (from its date line to its closing `},`), paste it
// at the end, and change the date, the three topics and the questions. Then run
//     node tests/check-questions.js
// to check you haven't made a typo. (README.md has the same instructions with more detail.)
//
// Rules for each topic:
//   - id: a short unique name with no spaces (for example "80s-music"). title, emoji and blurb show on the picker.
//   - Exactly 10 questions, in the order they are asked. Each has level "easy" (worth £100) or "medium"
//     (worth £250). Start with the easy ones. A wrong answer or running out of time loses HALF the prize.
//   - Exactly 4 options, all different, and `answer` written exactly the same as one of them.
//   - A `hint` for the Hint lifeline: a nudge that doesn't give the answer away (and never contains it).
//   - `spares`: exactly 2 extra questions (one easy, one medium), written the same way. They're only asked
//     if a player uses the "Swap the question" lifeline.
//   - The game shuffles the options every time, so their order here doesn't matter.
//   - Don't repeat a question anywhere in this file or in questions.js.
//   - A double quote inside text is written as \" (single quotes are fine).

const WEEKLY = {
  "2026-11-16": {
    topics: [
      {
        id: "eighties-music", title: "80s Music", emoji: "🎤",
        blurb: "Big hair, big synths and big hits.",
        questions: [
          { q: "Which band had the 1983 hit \"Karma Chameleon\"?", options: ["Culture Club", "Wham!", "Duran Duran", "Spandau Ballet"], answer: "Culture Club", hint: "Boy George was their singer.", level: "easy" },
          { q: "Which singer had the 1984 hit \"Like a Virgin\"?", options: ["Cyndi Lauper", "Kylie Minogue", "Madonna", "Whitney Houston"], answer: "Madonna", hint: "She's known as the Queen of Pop.", level: "easy" },
          { q: "Which pop duo was made up of George Michael and Andrew Ridgeley?", options: ["Wham!", "Eurythmics", "Pet Shop Boys", "Tears for Fears"], answer: "Wham!", hint: "They also sang 'Wake Me Up Before You Go-Go'.", level: "easy" },
          { q: "Which Michael Jackson album from 1982 includes \"Billie Jean\" and \"Beat It\"?", options: ["Bad", "Thriller", "Off the Wall", "Dangerous"], answer: "Thriller", hint: "It's the best-selling album of all time.", level: "easy" },
          { q: "Which charity single, written by Bob Geldof and Midge Ure, was released in December 1984?", options: ["We Are the World", "Last Christmas", "Merry Christmas Everyone", "Do They Know It's Christmas?"], answer: "Do They Know It's Christmas?", hint: "It was recorded by Band Aid.", level: "easy" },
          { q: "Which singer had a 1980s hit with \"Girls Just Want to Have Fun\"?", options: ["Madonna", "Debbie Harry", "Tina Turner", "Cyndi Lauper"], answer: "Cyndi Lauper", hint: "She had red-orange hair and a big 1983 debut album, 'She's So Unusual'.", level: "easy" },
          { q: "Which Norwegian band had the 1985 hit \"Take On Me\"?", options: ["Roxette", "Europe", "ABBA", "a-ha"], answer: "a-ha", hint: "Its video used pencil-sketch animation.", level: "medium" },
          { q: "Which band, led by singer Simon Le Bon, had the 1982 hit \"Hungry Like the Wolf\"?", options: ["Spandau Ballet", "Duran Duran", "Culture Club", "ABC"], answer: "Duran Duran", hint: "They were named after a character in the film 'Barbarella'.", level: "medium" },
          { q: "Which band had the 1985 hit \"Don't You (Forget About Me)\"?", options: ["Simple Minds", "Tears for Fears", "A Flock of Seagulls", "Level 42"], answer: "Simple Minds", hint: "Jim Kerr is their singer, and the song was in 'The Breakfast Club'.", level: "medium" },
          { q: "Who had a number one in 1987 with \"Never Gonna Give You Up\"?", options: ["Rick Astley", "Jason Donovan", "Bros", "Brother Beyond"], answer: "Rick Astley", hint: "He's from Newton-le-Willows, has a deep voice, and the song became a famous internet prank.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which singer, known as 'the King of Pop', moonwalked to fame in the 1980s?", options: ["Lionel Richie", "Stevie Wonder", "Michael Jackson", "Prince"], answer: "Michael Jackson", hint: "He was the youngest member of the Jackson 5.", level: "easy" },
          { q: "Which band had a 1984 hit with 'Relax'?", options: ["Frankie Goes to Hollywood", "Tears for Fears", "Bronski Beat", "Soft Cell"], answer: "Frankie Goes to Hollywood", hint: "They were a Liverpool band whose T-shirts said 'Frankie Say'.", level: "medium" },
        ]
      },
      {
        id: "british-food", title: "British Food and Drink", emoji: "🍽️",
        blurb: "Pies, puddings and a proper cuppa.",
        questions: [
          { q: "Which traditional British pudding is a suet pastry spread with jam, then rolled up?", options: ["Jam roly-poly", "Eton mess", "Bakewell tart", "Spotted dick"], answer: "Jam roly-poly", hint: "It's often served with custard at school dinners.", level: "easy" },
          { q: "Haggis is the traditional national dish of which country?", options: ["Wales", "Ireland", "Scotland", "England"], answer: "Scotland", hint: "Think of Burns Night and bagpipes.", level: "easy" },
          { q: "Wensleydale cheese, loved by Wallace and Gromit, comes from which county?", options: ["Yorkshire", "Cornwall", "Devon", "Kent"], answer: "Yorkshire", hint: "It's England's biggest county.", level: "easy" },
          { q: "Which Cornish food is a pastry case filled with beef, potato, swede and onion?", options: ["Pie", "Sausage roll", "Samosa", "Pasty"], answer: "Pasty", hint: "It has a crimped edge.", level: "easy" },
          { q: "A Scotch egg is wrapped in sausage meat and then coated in what?", options: ["Breadcrumbs", "Pastry", "Batter", "Oats"], answer: "Breadcrumbs", hint: "They're golden and crunchy.", level: "easy" },
          { q: "Which British dessert has layers of sponge, fruit, jelly, custard and cream?", options: ["Crumble", "Eton mess", "Sticky toffee pudding", "Trifle"], answer: "Trifle", hint: "Think of a pudding with sherry-soaked sponge at Christmas.", level: "easy" },
          { q: "Melton Mowbray, famous for its pork pies, is in which English county?", options: ["Lincolnshire", "Norfolk", "Leicestershire", "Somerset"], answer: "Leicestershire", hint: "It's in the East Midlands, near Leicester.", level: "medium" },
          { q: "Which Welsh dish is a rich cheese sauce poured over toast?", options: ["Cawl", "Welsh rarebit", "Bara brith", "Laverbread"], answer: "Welsh rarebit", hint: "Its name sounds like 'Welsh rabbit'.", level: "medium" },
          { q: "A kipper is a smoked version of which fish?", options: ["Cod", "Haddock", "Salmon", "Herring"], answer: "Herring", hint: "It's a small, oily silver fish.", level: "medium" },
          { q: "Which Scottish dessert is made with oats, whisky, cream and raspberries?", options: ["Clootie dumpling", "Tablet", "Cranachan", "Shortbread"], answer: "Cranachan", hint: "Its name starts with 'Cran'.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which drink is traditionally served with scones and jam at a cream tea?", options: ["Tea", "Hot chocolate", "Coffee", "Lemonade"], answer: "Tea", hint: "The clue is in the name.", level: "easy" },
          { q: "Stilton cheese can only be made in Derbyshire, Nottinghamshire and which other county?", options: ["Lincolnshire", "Somerset", "Norfolk", "Leicestershire"], answer: "Leicestershire", hint: "It's the county of Melton Mowbray too.", level: "medium" },
        ]
      },
      {
        id: "manchester", title: "Manchester", emoji: "🐝",
        blurb: "Bees, bands and Old Trafford.",
        questions: [
          { q: "Which insect is the symbol of Manchester?", options: ["Ant", "Butterfly", "Bee", "Ladybird"], answer: "Bee", hint: "It's a busy, buzzing insect.", level: "easy" },
          { q: "Manchester United share their city with which other big football club?", options: ["Everton", "Bolton Wanderers", "Manchester City", "Liverpool"], answer: "Manchester City", hint: "They play at the Etihad Stadium.", level: "easy" },
          { q: "Which band, fronted by brothers Liam and Noel Gallagher, formed in Manchester in 1991?", options: ["Blur", "Pulp", "The Verve", "Oasis"], answer: "Oasis", hint: "They sang 'Wonderwall'.", level: "easy" },
          { q: "Which is Manchester's busiest railway station?", options: ["Piccadilly", "Victoria", "Oxford Road", "Deansgate"], answer: "Piccadilly", hint: "It shares its name with a famous London circus.", level: "easy" },
          { q: "Which football ground is nicknamed the \"Theatre of Dreams\"?", options: ["Etihad Stadium", "Anfield", "Old Trafford", "Goodison Park"], answer: "Old Trafford", hint: "It's Manchester United's home ground.", level: "easy" },
          { q: "In which part of England is Manchester?", options: ["The North West", "Yorkshire", "The West Midlands", "The North East"], answer: "The North West", hint: "It's on the same side of the country as Liverpool.", level: "easy" },
          { q: "The Hacienda nightclub in Manchester was linked with which record label?", options: ["Rough Trade", "Stiff Records", "Factory Records", "Island Records"], answer: "Factory Records", hint: "Tony Wilson ran it.", level: "medium" },
          { q: "Which Manchester band was fronted by Ian Curtis and recorded \"Love Will Tear Us Apart\"?", options: ["The Smiths", "The Stone Roses", "Joy Division", "Happy Mondays"], answer: "Joy Division", hint: "Bernard Sumner and Peter Hook later formed New Order.", level: "medium" },
          { q: "The Manchester Ship Canal reaches the sea through the estuary of which river?", options: ["Thames", "Severn", "Humber", "Mersey"], answer: "Mersey", hint: "It's the river that flows past Liverpool.", level: "medium" },
          { q: "In which year did the Liverpool and Manchester Railway, the world's first inter-city passenger railway, open?", options: ["1801", "1830", "1865", "1901"], answer: "1830", hint: "It was the year King George IV died.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "What colour do Manchester United play in at home?", options: ["White", "Green", "Blue", "Red"], answer: "Red", hint: "Think of their nickname, the ... Devils.", level: "easy" },
          { q: "Which scientist is famous for 'splitting the atom' at the University of Manchester in 1917?", options: ["James Joule", "John Dalton", "Ernest Rutherford", "Alan Turing"], answer: "Ernest Rutherford", hint: "He came from New Zealand.", level: "medium" },
        ]
      },
    ]
  },
  "2026-11-23": {
    topics: [
      {
        id: "soaps", title: "TV Soaps", emoji: "📺",
        blurb: "Pubs, cobbles and catchphrases.",
        questions: [
          { q: "In which soap would you find the Rovers Return pub?", options: ["EastEnders", "Emmerdale", "Coronation Street", "Brookside"], answer: "Coronation Street", hint: "It's on a cobbled street in Weatherfield.", level: "easy" },
          { q: "Which soap has a village pub called the Woolpack?", options: ["Emmerdale", "EastEnders", "Hollyoaks", "Coronation Street"], answer: "Emmerdale", hint: "It's set in the Yorkshire Dales.", level: "easy" },
          { q: "What is the name of the pub in EastEnders?", options: ["The Rovers Return", "The Woolpack", "The Queen Victoria", "The Dog in the Pond"], answer: "The Queen Victoria", hint: "It's named after a famous queen.", level: "easy" },
          { q: "Which soap is set in Erinsborough and features Ramsay Street?", options: ["Home and Away", "Hollyoaks", "Neighbours", "Brookside"], answer: "Neighbours", hint: "It's an Australian soap.", level: "easy" },
          { q: "Which EastEnders family includes brothers Phil and Grant?", options: ["The Beales", "The Slaters", "The Fowlers", "The Mitchells"], answer: "The Mitchells", hint: "Think of Peggy, their mum, saying 'Get outta my pub!'", level: "easy" },
          { q: "Which soap, set on a Liverpool cul-de-sac, ran on Channel 4 from 1982 to 2003?", options: ["Crossroads", "Emmerdale", "Family Affairs", "Brookside"], answer: "Brookside", hint: "Its name sounds like a babbling stream.", level: "easy" },
          { q: "Home and Away is set in which fictional seaside town?", options: ["Summer Bay", "Erinsborough", "Sunny Cove", "Bondi Bay"], answer: "Summer Bay", hint: "It's on the coast near Sydney.", level: "medium" },
          { q: "Hollyoaks is set in a fictional suburb of which English city?", options: ["Liverpool", "Leeds", "Bristol", "Chester"], answer: "Chester", hint: "It's a Roman walled city near the Welsh border.", level: "medium" },
          { q: "Which actor has played Ken Barlow in Coronation Street since it began in 1960?", options: ["Johnny Briggs", "Roy Barraclough", "Anthony Valentine", "William Roache"], answer: "William Roache", hint: "His first name is the same as Shakespeare's.", level: "medium" },
          { q: "In which year was the first episode of EastEnders shown?", options: ["1985", "1979", "1982", "1990"], answer: "1985", hint: "It was the same year as Live Aid.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which long-running BBC radio soap is set in the village of Ambridge?", options: ["Casualty", "Emmerdale", "The Archers", "Doctors"], answer: "The Archers", hint: "It has been on the radio since 1951, and its theme tune is 'Barwick Green'.", level: "easy" },
          { q: "Which Australian soap made stars of Kylie Minogue and Jason Donovan?", options: ["The Sullivans", "Prisoner Cell Block H", "Neighbours", "Home and Away"], answer: "Neighbours", hint: "Think of Scott and Charlene's wedding.", level: "medium" },
        ]
      },
      {
        id: "animals", title: "Animals", emoji: "🐾",
        blurb: "Vixens, calves and a parliament of owls.",
        questions: [
          { q: "What is a baby cow called?", options: ["A foal", "A kid", "A lamb", "A calf"], answer: "A calf", hint: "It grows up to be a cow or a bull.", level: "easy" },
          { q: "How many legs does an insect have?", options: ["Four", "Eight", "Ten", "Six"], answer: "Six", hint: "The same as the number of sides on a hexagon.", level: "easy" },
          { q: "What is a group of wolves called?", options: ["A pride", "A herd", "A flock", "A pack"], answer: "A pack", hint: "Think of the leader of the... what?", level: "easy" },
          { q: "Which flightless bird is found in Antarctica?", options: ["Ostrich", "Emu", "Penguin", "Kiwi"], answer: "Penguin", hint: "It's black and white and waddles.", level: "easy" },
          { q: "What is a female pig called?", options: ["A vixen", "A doe", "A jenny", "A sow"], answer: "A sow", hint: "The word rhymes with 'cow'.", level: "easy" },
          { q: "What do koalas mainly eat?", options: ["Bamboo", "Grass", "Fruit", "Eucalyptus leaves"], answer: "Eucalyptus leaves", hint: "They come from gum trees.", level: "easy" },
          { q: "What is a group of owls called?", options: ["A parliament", "A murder", "A gaggle", "A colony"], answer: "A parliament", hint: "It's also the word for the place where MPs meet.", level: "medium" },
          { q: "Which of these mammals lays eggs?", options: ["Hedgehog", "Platypus", "Otter", "Armadillo"], answer: "Platypus", hint: "It has a bill like a duck.", level: "medium" },
          { q: "How many humps does a Bactrian camel have?", options: ["One", "Two", "Three", "Four"], answer: "Two", hint: "B for Bactrian: turn the letter on its side and count the bumps.", level: "medium" },
          { q: "What is a male swan called?", options: ["A cob", "A pen", "A cygnet", "A drake"], answer: "A cob", hint: "It's a short word that rhymes with 'Bob'.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "What is a baby goat called?", options: ["A calf", "A kid", "A cub", "A foal"], answer: "A kid", hint: "It's also a word for a child.", level: "easy" },
          { q: "What is a group of geese on the ground called?", options: ["A gaggle", "A shoal", "A pride", "A murder"], answer: "A gaggle", hint: "It sounds like the noise they make.", level: "medium" },
        ]
      },
      {
        id: "uk-geography", title: "Around Britain", emoji: "🗺️",
        blurb: "Cities, coasts and countryside.",
        questions: [
          { q: "Which English city is nicknamed the Steel City?", options: ["Sheffield", "Newcastle", "Leeds", "Birmingham"], answer: "Sheffield", hint: "Think of cutlery and the Crucible snooker theatre.", level: "easy" },
          { q: "Which seaside resort is famous for its Pleasure Beach, tower and illuminations?", options: ["Brighton", "Skegness", "Scarborough", "Blackpool"], answer: "Blackpool", hint: "It's in Lancashire.", level: "easy" },
          { q: "The famous white cliffs are at which English port?", options: ["Plymouth", "Hull", "Southampton", "Dover"], answer: "Dover", hint: "It's in Kent, the closest port to France.", level: "easy" },
          { q: "In which county is Land's End?", options: ["Devon", "Cornwall", "Dorset", "Kent"], answer: "Cornwall", hint: "It's the most south-westerly county in England.", level: "easy" },
          { q: "Which northern English city is famous for its Minster and the Shambles?", options: ["Durham", "Lincoln", "Carlisle", "York"], answer: "York", hint: "The Vikings called it Jorvik.", level: "easy" },
          { q: "Which famous prehistoric stone circle stands on Salisbury Plain?", options: ["Avebury", "Stonehenge", "Callanish", "Castlerigg"], answer: "Stonehenge", hint: "It's a ring of huge stones.", level: "easy" },
          { q: "Which Scottish city is nicknamed the Granite City?", options: ["Aberdeen", "Dundee", "Inverness", "Perth"], answer: "Aberdeen", hint: "Also the 'oil capital of Europe'.", level: "medium" },
          { q: "Which is the largest national park in the United Kingdom?", options: ["The Lake District", "Snowdonia", "The Peak District", "The Cairngorms"], answer: "The Cairngorms", hint: "It's in the Scottish Highlands, with ski slopes.", level: "medium" },
          { q: "The village with the very long name Llanfairpwllgwyngyll is on which island?", options: ["Skye", "The Isle of Wight", "Lundy", "Anglesey"], answer: "Anglesey", hint: "It's off the north-west coast of Wales.", level: "medium" },
          { q: "Skye, Mull and Islay are part of which Scottish island group?", options: ["The Orkneys", "The Shetlands", "The Hebrides", "The Channel Islands"], answer: "The Hebrides", hint: "They're off the west coast of Scotland.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which city is home to the Cavern Club, where the Beatles played?", options: ["Birmingham", "Manchester", "Liverpool", "Leeds"], answer: "Liverpool", hint: "Think of the Mersey.", level: "easy" },
          { q: "Which city, where the poet Dylan Thomas was born, is the second biggest in Wales?", options: ["Bangor", "Newport", "Swansea", "Wrexham"], answer: "Swansea", hint: "It sits on a big bay next to the Gower peninsula.", level: "medium" },
        ]
      },
    ]
  },
  "2026-11-30": {
    topics: [
      {
        id: "sport", title: "Sport", emoji: "⚽",
        blurb: "From Wimbledon to the snooker table.",
        questions: [
          { q: "On what surface is the Wimbledon tennis tournament played?", options: ["Clay", "Concrete", "Carpet", "Grass"], answer: "Grass", hint: "Think of green lawns in south-west London.", level: "easy" },
          { q: "Which sport is played at Lord's in London?", options: ["Football", "Tennis", "Cricket", "Rugby"], answer: "Cricket", hint: "Think of bats and wickets.", level: "easy" },
          { q: "In golf, what is a score of one stroke under par on a hole called?", options: ["An eagle", "A bogey", "An albatross", "A birdie"], answer: "A birdie", hint: "It's a bird's name.", level: "easy" },
          { q: "Which London football club is nicknamed the Gunners?", options: ["Chelsea", "Tottenham", "West Ham", "Arsenal"], answer: "Arsenal", hint: "They play at the Emirates Stadium.", level: "easy" },
          { q: "What colour jersey does the leader of the Tour de France wear?", options: ["Green", "Red", "White", "Yellow"], answer: "Yellow", hint: "It's the colour of the sun and of daffodils.", level: "easy" },
          { q: "The Grand National horse race is run at which racecourse?", options: ["Ascot", "Aintree", "Epsom", "Cheltenham"], answer: "Aintree", hint: "It's near Liverpool.", level: "easy" },
          { q: "Who scored a hat-trick for England in the 1966 World Cup final?", options: ["Bobby Charlton", "Bobby Moore", "Geoff Hurst", "Nobby Stiles"], answer: "Geoff Hurst", hint: "His first name is Geoff.", level: "medium" },
          { q: "Which team did England's Lionesses beat in the Euro 2022 final at Wembley?", options: ["Spain", "Sweden", "Germany", "France"], answer: "Germany", hint: "Their football team is known as Die Mannschaft.", level: "medium" },
          { q: "How many players are in a rugby union team on the pitch?", options: ["Fifteen", "Eleven", "Thirteen", "Eighteen"], answer: "Fifteen", hint: "Fourteen plus one.", level: "medium" },
          { q: "In snooker, how many points is the blue ball worth?", options: ["Five", "Three", "Four", "Six"], answer: "Five", hint: "It's between pink and brown in value.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "In snooker, what colour are the balls that are worth one point each?", options: ["Yellow", "Red", "Brown", "Green"], answer: "Red", hint: "There are fifteen of them on the table at the start.", level: "easy" },
          { q: "Which country hosted the 2010 men's football World Cup?", options: ["Germany", "Brazil", "South Africa", "Japan"], answer: "South Africa", hint: "Think of vuvuzelas.", level: "medium" },
        ]
      },
      {
        id: "films", title: "Films", emoji: "🎬",
        blurb: "Big screen favourites.",
        questions: [
          { q: "Which 1997 film, directed by James Cameron, tells the story of a ship that hit an iceberg?", options: ["Poseidon", "Titanic", "The Abyss", "Pearl Harbor"], answer: "Titanic", hint: "It starred Leonardo DiCaprio and Kate Winslet.", level: "easy" },
          { q: "Which Disney film features the song \"Let It Go\"?", options: ["Tangled", "Moana", "Encanto", "Frozen"], answer: "Frozen", hint: "It features Elsa and Anna.", level: "easy" },
          { q: "In \"The Lion King\", what is the young lion cub called?", options: ["Mufasa", "Scar", "Nala", "Simba"], answer: "Simba", hint: "His father is Mufasa.", level: "easy" },
          { q: "Which animated film is about a clownfish who is lost and found by his dad?", options: ["Shark Tale", "The Little Mermaid", "Finding Nemo", "Moana"], answer: "Finding Nemo", hint: "It's a Pixar film set under the sea.", level: "easy" },
          { q: "Which 1984 comedy asks \"Who you gonna call?\"", options: ["Gremlins", "Ghostbusters", "Beetlejuice", "Poltergeist"], answer: "Ghostbusters", hint: "Think of a ghostly logo.", level: "easy" },
          { q: "Which 1993 film is about a theme park full of cloned dinosaurs?", options: ["King Kong", "Godzilla", "Jurassic Park", "The Land Before Time"], answer: "Jurassic Park", hint: "Think of Isla Nublar and a T. rex.", level: "easy" },
          { q: "Which actor first played James Bond on the big screen, in \"Dr. No\" (1962)?", options: ["Roger Moore", "Pierce Brosnan", "Timothy Dalton", "Sean Connery"], answer: "Sean Connery", hint: "He was Scottish.", level: "medium" },
          { q: "Which actor voices Paddington Bear in the 2014 film?", options: ["Hugh Bonneville", "Hugh Grant", "Colin Firth", "Ben Whishaw"], answer: "Ben Whishaw", hint: "He also played Q in the James Bond films.", level: "medium" },
          { q: "Which actor played Dumbledore in the first two Harry Potter films?", options: ["Michael Gambon", "Ian McKellen", "Alan Rickman", "Richard Harris"], answer: "Richard Harris", hint: "He was an Irish actor, later replaced by Michael Gambon.", level: "medium" },
          { q: "In \"The Matrix\", which colour pill does Neo take?", options: ["Blue", "Green", "Yellow", "Red"], answer: "Red", hint: "It's not the blue one.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "What kind of animal is Dumbo?", options: ["An elephant", "A bear", "A giraffe", "A mouse"], answer: "An elephant", hint: "He flies with his huge ears.", level: "easy" },
          { q: "Which 1964 musical film stars Rex Harrison as Professor Higgins?", options: ["My Fair Lady", "The Sound of Music", "Oliver!", "Mary Poppins"], answer: "My Fair Lady", hint: "It's about a Cockney flower seller called Eliza.", level: "medium" },
        ]
      },
      {
        id: "christmas", title: "Christmas in Britain", emoji: "🎄",
        blurb: "Mince pies, sprouts and the King's speech.",
        questions: [
          { q: "What do children traditionally leave out for Father Christmas on Christmas Eve?", options: ["A mince pie", "A sandwich", "A fish finger", "A bar of chocolate"], answer: "A mince pie", hint: "It's a small sweet pie.", level: "easy" },
          { q: "What is the day after Christmas Day called in the UK?", options: ["New Year's Day", "Easter Monday", "Boxing Day", "Twelfth Night"], answer: "Boxing Day", hint: "It's the day for leftover turkey and football.", level: "easy" },
          { q: "In the song, what did my true love give to me on the first day of Christmas?", options: ["Two turtle doves", "Three French hens", "A partridge in a pear tree", "A golden ring"], answer: "A partridge in a pear tree", hint: "A small bird in a fruit tree.", level: "easy" },
          { q: "How many days of Christmas are there in the famous song?", options: ["Ten", "Eight", "Seven", "Twelve"], answer: "Twelve", hint: "It's a dozen.", level: "easy" },
          { q: "Which reindeer has a famously red nose?", options: ["Rudolph", "Dasher", "Prancer", "Comet"], answer: "Rudolph", hint: "He was the ninth reindeer, made famous by a song.", level: "easy" },
          { q: "Which plant is hung up at Christmas for people to kiss under?", options: ["Holly", "Ivy", "Heather", "Mistletoe"], answer: "Mistletoe", hint: "It's a plant with white berries.", level: "easy" },
          { q: "Who traditionally gives a speech to the nation on the TV at 3pm on Christmas Day?", options: ["The Prime Minister", "The Archbishop of Canterbury", "The King", "The Mayor of London"], answer: "The King", hint: "It's the monarch's Christmas broadcast.", level: "medium" },
          { q: "In which year was the first commercial Christmas card sent, in London?", options: ["1750", "1901", "1920", "1843"], answer: "1843", hint: "It was the same year 'A Christmas Carol' was published.", level: "medium" },
          { q: "Which royal, husband of Queen Victoria, helped make Christmas trees popular in Britain?", options: ["Prince Philip", "Prince Albert", "Prince Edward", "Prince Henry"], answer: "Prince Albert", hint: "He was a German prince.", level: "medium" },
          { q: "In Charles Dickens's \"A Christmas Carol\", who is the miserly main character?", options: ["Bob Cratchit", "Fagin", "Mr Micawber", "Ebenezer Scrooge"], answer: "Ebenezer Scrooge", hint: "He said 'Bah! Humbug!'", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "What is traditionally put on top of a Christmas tree?", options: ["A cracker", "A bauble", "A stocking", "A star or an angel"], answer: "A star or an angel", hint: "Something that would shine down from the top.", level: "easy" },
          { q: "In which country did the tradition of the Christmas tree start, before it came to Britain?", options: ["Norway", "France", "Italy", "Germany"], answer: "Germany", hint: "Prince Albert brought the custom from his homeland.", level: "medium" },
        ]
      },
    ]
  },
  "2026-12-07": {
    topics: [
      {
        id: "nineties", title: "The 1990s", emoji: "💿",
        blurb: "Britpop, Tamagotchis and Dolly the sheep.",
        questions: [
          { q: "Which girl group had a huge hit with \"Wannabe\" in 1996?", options: ["All Saints", "Atomic Kitten", "Bananarama", "Spice Girls"], answer: "Spice Girls", hint: "Scary, Sporty, Baby, Ginger and Posh.", level: "easy" },
          { q: "Which 1990s craze involved looking after a tiny digital pet on a keyring?", options: ["Tamagotchi", "Furby", "Pokémon cards", "Beanie Babies"], answer: "Tamagotchi", hint: "It was a Japanese toy egg.", level: "easy" },
          { q: "Which sheep, born in Scotland in 1996, was the first mammal cloned from an adult cell?", options: ["Shaun", "Molly", "Dolly", "Daisy"], answer: "Dolly", hint: "She was named after a country singer famous for 'Jolene'.", level: "easy" },
          { q: "Which TV show about six friends in New York began in 1994?", options: ["Seinfeld", "Frasier", "Cheers", "Friends"], answer: "Friends", hint: "Think of Rachel, Ross and the gang.", level: "easy" },
          { q: "Which video game hero is a fast-running blue hedgehog?", options: ["Mario", "Crash Bandicoot", "Sonic", "Donkey Kong"], answer: "Sonic", hint: "He's a SEGA character.", level: "easy" },
          { q: "Which boy band had a hit in 1995 with \"Back for Good\"?", options: ["Take That", "Boyzone", "East 17", "Westlife"], answer: "Take That", hint: "Gary Barlow and Robbie Williams were members.", level: "easy" },
          { q: "Which Britpop band released the album \"Parklife\" in 1994?", options: ["Pulp", "Blur", "Suede", "Elastica"], answer: "Blur", hint: "Damon Albarn was their singer.", level: "medium" },
          { q: "In which year did the Channel Tunnel officially open?", options: ["1990", "1998", "1986", "1994"], answer: "1994", hint: "It was the year the USA hosted the football World Cup.", level: "medium" },
          { q: "Who became Prime Minister after the 1997 general election?", options: ["John Major", "Tony Blair", "Gordon Brown", "William Hague"], answer: "Tony Blair", hint: "He was the Labour leader.", level: "medium" },
          { q: "Which company launched the original PlayStation in Europe in 1995?", options: ["Nintendo", "Sega", "Microsoft", "Sony"], answer: "Sony", hint: "It also makes the Walkman.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which children's TV show, first shown in 1997, featured Tinky Winky, Dipsy, Laa-Laa and Po?", options: ["Bob the Builder", "Teletubbies", "The Tweenies", "Rugrats"], answer: "Teletubbies", hint: "They had TV screens on their tummies.", level: "easy" },
          { q: "Which Harry Potter book was first published in the UK in 1997?", options: ["Harry Potter and the Goblet of Fire", "Harry Potter and the Philosopher's Stone", "Harry Potter and the Half-Blood Prince", "Harry Potter and the Chamber of Secrets"], answer: "Harry Potter and the Philosopher's Stone", hint: "It's the very first one.", level: "medium" },
        ]
      },
      {
        id: "science", title: "Science and Nature", emoji: "🔬",
        blurb: "Planets, bodies and big ideas.",
        questions: [
          { q: "Which planet has a famous giant storm called the Great Red Spot?", options: ["Jupiter", "Mars", "Saturn", "Neptune"], answer: "Jupiter", hint: "It's the biggest planet.", level: "easy" },
          { q: "How many colours are there in a rainbow?", options: ["Seven", "Five", "Six", "Eight"], answer: "Seven", hint: "Richard Of York Gave Battle In Vain.", level: "easy" },
          { q: "What type of animal is a dolphin?", options: ["A mammal", "A fish", "A reptile", "An amphibian"], answer: "A mammal", hint: "It breathes air and feeds its young on milk.", level: "easy" },
          { q: "At what temperature does water boil at sea level, in degrees Celsius?", options: ["90", "80", "120", "100"], answer: "100", hint: "It's a nice round number.", level: "easy" },
          { q: "What is the closest star to the Earth?", options: ["The Sun", "Polaris", "Sirius", "Betelgeuse"], answer: "The Sun", hint: "It's a star we see every day.", level: "easy" },
          { q: "What is a baby frog called?", options: ["A cub", "A tadpole", "A joey", "A fry"], answer: "A tadpole", hint: "It's what a frog is when it has a tail.", level: "easy" },
          { q: "Which vitamin does our skin make when it is in sunlight?", options: ["Vitamin A", "Vitamin D", "Vitamin C", "Vitamin B"], answer: "Vitamin D", hint: "It's the sunshine vitamin.", level: "medium" },
          { q: "How many teeth does a typical adult human have, including wisdom teeth?", options: ["32", "28", "30", "36"], answer: "32", hint: "Count four wisdom teeth on top of 28.", level: "medium" },
          { q: "What is the name of the thigh bone, the longest bone in the human body?", options: ["Femur", "Tibia", "Humerus", "Fibula"], answer: "Femur", hint: "It starts with an 'F'.", level: "medium" },
          { q: "Which organs in the body filter the blood and make urine?", options: ["The lungs", "The liver", "The kidneys", "The spleen"], answer: "The kidneys", hint: "They're bean-shaped.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which part of a plant takes in water from the soil?", options: ["The seeds", "The roots", "The petals", "The leaves"], answer: "The roots", hint: "They grow underground.", level: "easy" },
          { q: "What is the hardest natural substance on Earth?", options: ["Granite", "Quartz", "Diamond", "Gold"], answer: "Diamond", hint: "It's a girl's best friend.", level: "medium" },
        ]
      },
      {
        id: "world", title: "Inventions and Discoveries", emoji: "💡",
        blurb: "Clever Britons and big breakthroughs.",
        questions: [
          { q: "Which Scottish inventor is famous for demonstrating the first working television system in 1926?", options: ["Alexander Fleming", "James Watt", "John Logie Baird", "Charles Babbage"], answer: "John Logie Baird", hint: "He was from Helensburgh.", level: "easy" },
          { q: "Which inventor is credited with the first practical telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Guglielmo Marconi", "Samuel Morse"], answer: "Alexander Graham Bell", hint: "He was born in Edinburgh and moved to Canada and the USA.", level: "easy" },
          { q: "Who made the first powered aeroplane flight in 1903?", options: ["The Wright brothers", "Louis Blériot", "Amy Johnson", "The Montgolfier brothers"], answer: "The Wright brothers", hint: "They were American bicycle makers.", level: "easy" },
          { q: "Which codebreaker worked at Bletchley Park during the Second World War?", options: ["Isaac Newton", "Charles Darwin", "Alan Turing", "Tim Berners-Lee"], answer: "Alan Turing", hint: "His famous 'test' asks whether a machine can think.", level: "easy" },
          { q: "Which British scientist invented the World Wide Web?", options: ["Bill Gates", "Alan Turing", "Stephen Hawking", "Tim Berners-Lee"], answer: "Tim Berners-Lee", hint: "He built it while working at CERN in Switzerland in 1989.", level: "easy" },
          { q: "Which Scottish scientist discovered penicillin in 1928?", options: ["Joseph Lister", "Alexander Fleming", "Edward Jenner", "James Watt"], answer: "Alexander Fleming", hint: "It was the first antibiotic.", level: "easy" },
          { q: "Which engineer designed the Clifton Suspension Bridge and the SS Great Britain?", options: ["George Stephenson", "Isambard Kingdom Brunel", "Thomas Telford", "James Watt"], answer: "Isambard Kingdom Brunel", hint: "His first name is Isambard.", level: "medium" },
          { q: "Which engineer built the famous steam locomotive called Rocket?", options: ["Isambard Kingdom Brunel", "Richard Trevithick", "Thomas Newcomen", "George Stephenson"], answer: "George Stephenson", hint: "He's known as the 'Father of Railways'.", level: "medium" },
          { q: "In 1796, Edward Jenner developed the first vaccine against which disease?", options: ["Polio", "Smallpox", "Measles", "Cholera"], answer: "Smallpox", hint: "He used cowpox.", level: "medium" },
          { q: "Which Italian inventor sent the first radio signals across the Atlantic in 1901?", options: ["Nikola Tesla", "Enrico Fermi", "Guglielmo Marconi", "Alessandro Volta"], answer: "Guglielmo Marconi", hint: "He was Italian and won a Nobel Prize.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which British inventor is famous for vacuum cleaners that don't need a bag?", options: ["Trevor Baylis", "Clive Sinclair", "James Dyson", "Alan Sugar"], answer: "James Dyson", hint: "His company also makes bladeless fans and hand dryers.", level: "easy" },
          { q: "Which Scottish inventor developed waterproof fabric used for raincoats?", options: ["Alexander Fleming", "Charles Macintosh", "John Boyd Dunlop", "James Watt"], answer: "Charles Macintosh", hint: "His name is still used for a type of raincoat.", level: "medium" },
        ]
      },
    ]
  },
};
