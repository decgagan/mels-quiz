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
          { q: "Which Christmas carol was first performed in 1818 in the village of Oberndorf, Austria?", options: ["O Come, All Ye Faithful", "Silent Night", "Hark! The Herald Angels Sing", "Away in a Manger"], answer: "Silent Night", hint: "Its words were written by a young priest, Joseph Mohr, and it was first played on a guitar.", level: "medium" },
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
  "2026-12-14": {
    topics: [
      {
        id: "tv-comedy", title: "Classic TV Comedy", emoji: "😂",
        blurb: "Catchphrases, sitcoms and much-loved double acts.",
        questions: [
          { q: "In 'Dad's Army', which member of the Home Guard platoon often shouted 'Don't panic!'?", options: ["Lance Corporal Jones", "Private Pike", "Sergeant Wilson", "Private Godfrey"], answer: "Lance Corporal Jones", hint: "He was the platoon's elderly butcher.", level: "easy" },
          { q: "Which accident-prone sitcom character, played by Michael Crawford, was famous for saying 'Ooh, Betty!'?", options: ["Mr Bean", "Frank Spencer", "Victor Meldrew", "Basil Fawlty"], answer: "Frank Spencer", hint: "He starred in 'Some Mothers Do 'Ave 'Em'.", level: "easy" },
          { q: "Which comedian played the title role in 'The Vicar of Dibley'?", options: ["Julie Walters", "Jennifer Saunders", "Dawn French", "Victoria Wood"], answer: "Dawn French", hint: "Her long-time comedy partner starred in 'Absolutely Fabulous'.", level: "easy" },
          { q: "Which sitcom was set in the Grace Brothers department store?", options: ["Dinnerladies", "Open All Hours", "Hi-de-Hi!", "Are You Being Served?"], answer: "Are You Being Served?", hint: "Mrs Slocombe and Mr Humphries worked on the clothing floor.", level: "easy" },
          { q: "In which sitcom did Ronnie Barker play the shopkeeper Arkwright, with David Jason as his nephew Granville?", options: ["Open All Hours", "Porridge", "The Two Ronnies", "Only Fools and Horses"], answer: "Open All Hours", hint: "The till in the corner shop had a mind of its own.", level: "easy" },
          { q: "Which double act ended their shows by singing 'Bring Me Sunshine'?", options: ["The Two Ronnies", "Morecambe and Wise", "Cannon and Ball", "Little and Large"], answer: "Morecambe and Wise", hint: "Think of Eric and Ernie.", level: "easy" },
          { q: "In 'Steptoe and Son', what did Albert and Harold Steptoe do for a living?", options: ["They were coal merchants", "They were chimney sweeps", "They were rag-and-bone men", "They were milkmen"], answer: "They were rag-and-bone men", hint: "They went round the streets with a horse and cart, collecting junk.", level: "medium" },
          { q: "In 'Hi-de-Hi!', what was the name of the holiday camp?", options: ["Warners", "Butlins", "Pontins", "Maplins"], answer: "Maplins", hint: "It was a made-up name, and its entertainers wore yellow coats.", level: "medium" },
          { q: "In 'Yes Minister', what was the name of the crafty top civil servant?", options: ["Sir Humphrey Appleby", "Captain Mainwaring", "Jim Hacker", "Bernard Woolley"], answer: "Sir Humphrey Appleby", hint: "He was played by Nigel Hawthorne.", level: "medium" },
          { q: "'Last of the Summer Wine' was filmed in and around which Yorkshire town?", options: ["Hebden Bridge", "Holmfirth", "Haworth", "Harrogate"], answer: "Holmfirth", hint: "It's in the Holme Valley, near Huddersfield.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "In 'Only Fools and Horses', what did Del Boy and Rodney drive?", options: ["A black London taxi", "A blue Mini", "A yellow three-wheeled van", "A red double-decker bus"], answer: "A yellow three-wheeled van", hint: "It said 'Trotters Independent Trading Co' on the side.", level: "easy" },
          { q: "Which sitcom, set in Barry Island and Billericay, featured Nessa and Smithy?", options: ["Men Behaving Badly", "The Royle Family", "Benidorm", "Gavin & Stacey"], answer: "Gavin & Stacey", hint: "The couple in its title were from Essex and Wales.", level: "medium" },
        ]
      },
      {
        id: "dancing", title: "Dancing", emoji: "💃",
        blurb: "Ballroom, ballet and the hokey cokey.",
        questions: [
          { q: "Which ballroom dance comes from Argentina?", options: ["The tango", "The foxtrot", "The quickstep", "The waltz"], answer: "The tango", hint: "As the saying goes, it takes two.", level: "easy" },
          { q: "Which party dance is done in a long line, everyone holding the waist of the person in front?", options: ["The limbo", "The conga", "The twist", "The macarena"], answer: "The conga", hint: "It comes from Cuba, and there's a kick every few steps.", level: "easy" },
          { q: "In which dance do you 'put your left arm in, your left arm out'?", options: ["The Lambeth Walk", "The conga", "The hokey cokey", "The Birdie Song"], answer: "The hokey cokey", hint: "'Knees bend, arms stretch, ra-ra-ra!'", level: "easy" },
          { q: "Which lively dance is Brazil famous for at its carnival?", options: ["The tango", "The polka", "The flamenco", "The samba"], answer: "The samba", hint: "Rio's carnival parades are led by schools named after it.", level: "easy" },
          { q: "Which English folk dancers wear bells on their legs and wave hankies and sticks?", options: ["Morris dancers", "Clog dancers", "Maypole dancers", "Line dancers"], answer: "Morris dancers", hint: "You often see them outside a country pub on May Day.", level: "easy" },
          { q: "Which 1987 film has the line 'Nobody puts Baby in a corner'?", options: ["Grease", "Dirty Dancing", "Footloose", "Flashdance"], answer: "Dirty Dancing", hint: "Patrick Swayze plays the dance teacher Johnny Castle.", level: "easy" },
          { q: "Which 1920s dance craze was named after a city in South Carolina?", options: ["The lindy hop", "The jitterbug", "The Charleston", "The twist"], answer: "The Charleston", hint: "Flappers swung their knees in and out while crossing their hands over them.", level: "medium" },
          { q: "Which ballet has the characters Odette and Odile?", options: ["Sleeping Beauty", "The Nutcracker", "Giselle", "Swan Lake"], answer: "Swan Lake", hint: "The heroine is turned into a beautiful white bird.", level: "medium" },
          { q: "Which ballroom dance has three beats to the bar, counted 'one, two, three'?", options: ["The waltz", "The cha-cha-cha", "The samba", "The jive"], answer: "The waltz", hint: "Johann Strauss wrote lots of music for it in Vienna.", level: "medium" },
          { q: "Which Latin dance is based on a Spanish bullfight?", options: ["The mambo", "The paso doble", "The rumba", "The salsa"], answer: "The paso doble", hint: "The man plays the bullfighter, and the woman his swirling cape.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which Spanish dance is famous for stamping feet, clapping and swirling dresses?", options: ["The tango", "The Highland fling", "Flamenco", "The polka"], answer: "Flamenco", hint: "It comes from Andalusia, in the south of Spain.", level: "easy" },
          { q: "Which Irish dance show began as the interval act at the 1994 Eurovision Song Contest?", options: ["Feet of Flames", "Celtic Woman", "Lord of the Dance", "Riverdance"], answer: "Riverdance", hint: "It made stars of Michael Flatley and Jean Butler.", level: "medium" },
        ]
      },
      {
        id: "pantomime", title: "Pantomime", emoji: "🎭",
        blurb: "Oh yes it is! Dames, villains and a lot of shouting.",
        questions: [
          { q: "At the pantomime, what do the audience shout back when someone on stage says 'Oh no it isn't!'?", options: ["Oh yes it is!", "He's behind you!", "Boo, hiss!", "Hello, Buttons!"], answer: "Oh yes it is!", hint: "It's the exact opposite of what was said on stage.", level: "easy" },
          { q: "Who traditionally plays the pantomime dame?", options: ["A child", "A man", "A puppet", "A woman"], answer: "A man", hint: "It's the opposite of the principal boy.", level: "easy" },
          { q: "In 'Dick Whittington', which animal goes everywhere with Dick?", options: ["A horse", "A dog", "A cat", "A goose"], answer: "A cat", hint: "It's very good at catching the rats in London.", level: "easy" },
          { q: "Which pantomime features Widow Twankey and her son Wishee Washee?", options: ["Cinderella", "Mother Goose", "Puss in Boots", "Aladdin"], answer: "Aladdin", hint: "There's a magic lamp and a genie.", level: "easy" },
          { q: "In 'Jack and the Beanstalk', what does Jack swap for the magic beans?", options: ["A cow", "A horse", "A pig", "A goat"], answer: "A cow", hint: "In the pantomime she's often called Daisy, and she gives milk.", level: "easy" },
          { q: "In 'Cinderella', what does the Fairy Godmother turn into a coach?", options: ["A marrow", "A pumpkin", "A watermelon", "A turnip"], answer: "A pumpkin", hint: "It's a big, round, orange vegetable.", level: "easy" },
          { q: "In 'Cinderella', what is the name of the cheerful servant who loves Cinderella?", options: ["Wishee Washee", "Dandini", "Buttons", "Baron Hardup"], answer: "Buttons", hint: "His name comes from the shiny fasteners on his page boy's uniform.", level: "medium" },
          { q: "What is the name of the wicked sorcerer in the pantomime 'Aladdin'?", options: ["King Rat", "Fleshcreep", "Captain Hook", "Abanazar"], answer: "Abanazar", hint: "He wants the magic lamp for himself.", level: "medium" },
          { q: "In 'Puss in Boots', the clever cat passes off his poor master as which made-up nobleman?", options: ["The Marquis of Carabas", "Lord Fauntleroy", "The Duke of Dandini", "The Earl of Hardup"], answer: "The Marquis of Carabas", hint: "The tale comes from France, so it's a French title.", level: "medium" },
          { q: "In which pantomime is the villain King Rat?", options: ["Snow White", "Dick Whittington", "Aladdin", "Peter Pan"], answer: "Dick Whittington", hint: "Its hero becomes Lord Mayor of London.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "In the pantomime 'Mother Goose', what does the goose lay?", options: ["Chocolate eggs", "Diamond eggs", "Golden eggs", "Silver eggs"], answer: "Golden eggs", hint: "They make her owner very rich.", level: "easy" },
          { q: "In 'Aladdin', where is the magic lamp hidden?", options: ["At the bottom of a well", "In a laundry", "In a palace", "In a cave"], answer: "In a cave", hint: "The wicked sorcerer can't go in himself, so he sends Aladdin.", level: "medium" },
        ]
      },
    ]
  },
  "2026-12-21": {
    topics: [
      {
        id: "christmas-songs", title: "Christmas Songs", emoji: "🎶",
        blurb: "Sleigh bells, Christmas number ones and festive favourites.",
        questions: [
          { q: "Which duo released 'Last Christmas' in 1984?", options: ["Wham!", "Erasure", "Eurythmics", "Pet Shop Boys"], answer: "Wham!", hint: "It was kept off the 1984 number one spot by the Band Aid single.", level: "easy" },
          { q: "Who sang 'All I Want for Christmas Is You'?", options: ["Celine Dion", "Mariah Carey", "Kylie Minogue", "Whitney Houston"], answer: "Mariah Carey", hint: "She's an American singer famous for her very high notes.", level: "easy" },
          { q: "Which Welsh singer had the 1985 Christmas number one with 'Merry Christmas Everyone'?", options: ["Aled Jones", "Tom Jones", "Shakin' Stevens", "Bonnie Tyler"], answer: "Shakin' Stevens", hint: "His earlier hits included 'This Ole House' and 'Green Door'.", level: "easy" },
          { q: "Who sang 'Mistletoe and Wine', the Christmas number one of 1988?", options: ["Elton John", "Chris Rea", "Rod Stewart", "Cliff Richard"], answer: "Cliff Richard", hint: "He started out in the 1950s, singing with the Shadows.", level: "easy" },
          { q: "Which Chris Rea song is about the long journey home at Christmas?", options: ["Driving Home for Christmas", "Fairytale of New York", "Walking in the Air", "Stop the Cavalry"], answer: "Driving Home for Christmas", hint: "He's said he wrote it while stuck in traffic.", level: "easy" },
          { q: "Which former Beatle released 'Wonderful Christmastime' in 1979?", options: ["George Harrison", "Paul McCartney", "Ringo Starr", "John Lennon"], answer: "Paul McCartney", hint: "He also wrote 'Mull of Kintyre'.", level: "easy" },
          { q: "Which band sang 'Fairytale of New York' with Kirsty MacColl?", options: ["The Waterboys", "U2", "The Pogues", "The Dubliners"], answer: "The Pogues", hint: "Their singer was Shane MacGowan.", level: "medium" },
          { q: "Which song from the cartoon 'The Snowman' was a hit for the choirboy Aled Jones in 1985?", options: ["Winter Wonderland", "Frosty the Snowman", "Let It Snow", "Walking in the Air"], answer: "Walking in the Air", hint: "It's sung as the boy and the Snowman fly over the snowy countryside.", level: "medium" },
          { q: "Which pink and yellow spotty character had the Christmas number one in 1993?", options: ["Mr Blobby", "Postman Pat", "Bob the Builder", "Pudsey Bear"], answer: "Mr Blobby", hint: "He was the clumsy star of Noel Edmonds's 'House Party'.", level: "medium" },
          { q: "Which East 17 song was the Christmas number one in 1994?", options: ["Babe", "Stay Another Day", "Back for Good", "Love Me for a Reason"], answer: "Stay Another Day", hint: "In its video the band wore white coats with furry hoods.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which band had a 1973 Christmas hit with 'I Wish It Could Be Christmas Everyday'?", options: ["The Sweet", "Slade", "Wizzard", "Mud"], answer: "Wizzard", hint: "It was led by Roy Wood, who had been in The Move.", level: "easy" },
          { q: "Which Greg Lake song, a 1975 Christmas hit, begins 'They said there'll be snow at Christmas'?", options: ["Lonely This Christmas", "Stop the Cavalry", "Happy Xmas (War Is Over)", "I Believe in Father Christmas"], answer: "I Believe in Father Christmas", hint: "Its title is about believing in the man who brings the presents.", level: "medium" },
        ]
      },
      {
        id: "christmas-films", title: "Christmas Films", emoji: "⛄",
        blurb: "Festive films to watch with a mince pie.",
        questions: [
          { q: "In 'Elf', what is the name of Will Ferrell's character?", options: ["Buddy", "Jack", "Kevin", "Scott"], answer: "Buddy", hint: "It's also a friendly word for a pal.", level: "easy" },
          { q: "Which film features George Bailey and the town of Bedford Falls?", options: ["The Bishop's Wife", "It's a Wonderful Life", "Miracle on 34th Street", "White Christmas"], answer: "It's a Wonderful Life", hint: "An angel called Clarence earns his wings.", level: "easy" },
          { q: "In 'The Muppet Christmas Carol', which Muppet plays Bob Cratchit?", options: ["Gonzo", "Miss Piggy", "Kermit the Frog", "Fozzie Bear"], answer: "Kermit the Frog", hint: "He's green.", level: "easy" },
          { q: "Which actor played the Prime Minister in 'Love Actually'?", options: ["Alan Rickman", "Liam Neeson", "Colin Firth", "Hugh Grant"], answer: "Hugh Grant", hint: "He also starred in 'Four Weddings and a Funeral' and 'Notting Hill'.", level: "easy" },
          { q: "In 'The Polar Express', where is the magical train going?", options: ["The North Pole", "Lapland", "The South Pole", "Greenland"], answer: "The North Pole", hint: "The train heads for the very top of the world.", level: "easy" },
          { q: "In the 1947 film 'Miracle on 34th Street', at which New York department store does Kris Kringle work?", options: ["Harrods", "Macy's", "Selfridges", "Bloomingdale's"], answer: "Macy's", hint: "It's famous for its Thanksgiving Day Parade.", level: "easy" },
          { q: "Who wrote and illustrated the book 'The Snowman'?", options: ["Judith Kerr", "Quentin Blake", "Raymond Briggs", "Roald Dahl"], answer: "Raymond Briggs", hint: "He also created 'Fungus the Bogeyman' and 'Father Christmas'.", level: "medium" },
          { q: "In 'Die Hard', John McClane takes on robbers at a Christmas party in which building?", options: ["Trump Tower", "The Empire State Building", "Sears Tower", "Nakatomi Plaza"], answer: "Nakatomi Plaza", hint: "It's the office tower of a Japanese company in Los Angeles.", level: "medium" },
          { q: "In 'Home Alone', which city is the McCallister family flying to when they leave Kevin behind?", options: ["Paris", "London", "Rome", "New York"], answer: "Paris", hint: "Think of the Eiffel Tower.", level: "medium" },
          { q: "Which actor plays the man who becomes Father Christmas in 'The Santa Clause' (1994)?", options: ["Robin Williams", "Tim Allen", "Steve Martin", "Chevy Chase"], answer: "Tim Allen", hint: "He's also the voice of Buzz Lightyear in 'Toy Story'.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "In the song and the cartoon, what brings Frosty the Snowman to life?", options: ["A carrot nose", "A broomstick", "A magic hat", "A magic scarf"], answer: "A magic hat", hint: "There must have been some magic in that old silk...", level: "easy" },
          { q: "Which comedian plays a modern-day Scrooge, a TV boss, in the 1988 film 'Scrooged'?", options: ["Steve Martin", "Dan Aykroyd", "John Candy", "Bill Murray"], answer: "Bill Murray", hint: "He also starred in 'Ghostbusters' and 'Groundhog Day'.", level: "medium" },
        ]
      },
      {
        id: "sweets", title: "Sweets and Chocolate", emoji: "🍫",
        blurb: "Selection boxes, pick 'n' mix and old favourites.",
        questions: [
          { q: "What was the chocolate bar Snickers called in the UK until 1990?", options: ["Marathon", "Picnic", "Lion", "Topic"], answer: "Marathon", hint: "It shared its name with a 26.2-mile race.", level: "easy" },
          { q: "Which sweets were called Opal Fruits until 1998?", options: ["Chewits", "Starburst", "Skittles", "Fruit Pastilles"], answer: "Starburst", hint: "They were 'made to make your mouth water'.", level: "easy" },
          { q: "Which tin of Christmas chocolates includes the Green Triangle and the Purple One?", options: ["Celebrations", "Heroes", "Quality Street", "Roses"], answer: "Quality Street", hint: "It was first made in Halifax in 1936.", level: "easy" },
          { q: "Which chocolate is shaped like a fruit, and you 'tap it and unwrap it'?", options: ["After Eight", "Toblerone", "Ferrero Rocher", "Terry's Chocolate Orange"], answer: "Terry's Chocolate Orange", hint: "It splits into segments, and the firm behind it was based in York.", level: "easy" },
          { q: "Which chocolate bar, first made in Bern in 1908, is famous for its triangular shape?", options: ["Toblerone", "Lindt", "Milka", "Kinder"], answer: "Toblerone", hint: "It comes in a long box with peaks like little mountains.", level: "easy" },
          { q: "Which white mints are famous as 'the mint with the hole'?", options: ["Softmints", "Polo", "Tic Tac", "Murray Mints"], answer: "Polo", hint: "They're little white rings, sold in a paper tube.", level: "easy" },
          { q: "In which English city were Cadbury's chocolates first made, with its Bournville factory opening in 1879?", options: ["York", "Bristol", "Birmingham", "Manchester"], answer: "Birmingham", hint: "It's the city at the heart of the West Midlands.", level: "medium" },
          { q: "Which York chocolate maker created the KitKat and the Aero?", options: ["Fry's", "Terry's", "Cadbury", "Rowntree's"], answer: "Rowntree's", hint: "The same firm also made Fruit Pastilles and Fruit Gums.", level: "medium" },
          { q: "Which Bristol firm made the first chocolate bar for eating, in 1847?", options: ["Fry's", "Cadbury", "Rowntree's", "Thorntons"], answer: "Fry's", hint: "It's famous for its Chocolate Cream and Turkish Delight bars.", level: "medium" },
          { q: "Which chocolate bar's adverts promised to help you 'get that Friday feeling'?", options: ["Double Decker", "Crunchie", "Wispa", "Twirl"], answer: "Crunchie", hint: "It has a golden honeycomb centre.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which sweets are shaped like little babies?", options: ["Midget Gems", "Dolly Mixtures", "Jelly Babies", "Wine Gums"], answer: "Jelly Babies", hint: "Tom Baker's Doctor Who loved offering them to people.", level: "easy" },
          { q: "Bertie Bassett, the little man made of sweets, is the mascot for which sweets?", options: ["Wine Gums", "Pontefract Cakes", "Black Jacks", "Liquorice Allsorts"], answer: "Liquorice Allsorts", hint: "They're a colourful mix of coconut, fondant and black chewy layers.", level: "medium" },
        ]
      },
    ]
  },
  "2026-12-28": {
    topics: [
      {
        id: "games-toys", title: "Board Games and Toys", emoji: "♟️",
        blurb: "Rainy-day favourites, from Monopoly to Operation.",
        questions: [
          { q: "Which board game has counters that jump over each other, and get 'crowned' when they reach the far side?", options: ["Draughts", "Chess", "Backgammon", "Ludo"], answer: "Draughts", hint: "Americans call it 'checkers'.", level: "easy" },
          { q: "In the game Cluedo, what colour is Colonel Mustard?", options: ["Blue", "Yellow", "Red", "Green"], answer: "Yellow", hint: "Think of what you'd squeeze on a hot dog.", level: "easy" },
          { q: "In Scrabble, how many letter tiles does each player keep on their rack?", options: ["Five", "Six", "Seven", "Ten"], answer: "Seven", hint: "Using all of them in one go earns a 50-point bonus.", level: "easy" },
          { q: "Which toy bricks from Denmark take their name from the Danish for 'play well'?", options: ["Meccano", "Stickle Bricks", "K'Nex", "Lego"], answer: "Lego", hint: "Treading on one in bare feet really hurts.", level: "easy" },
          { q: "In which game do you remove bits from 'Cavity Sam' without touching the sides?", options: ["Operation", "Buckaroo", "Twister", "Hungry Hippos"], answer: "Operation", hint: "A buzzer goes off and his red nose lights up if you slip.", level: "easy" },
          { q: "Which game has you pull wooden blocks out of a tower, one at a time, without it falling?", options: ["KerPlunk", "Jenga", "Mousetrap", "Connect 4"], answer: "Jenga", hint: "Its name comes from a Swahili word meaning 'build'.", level: "easy" },
          { q: "In Scrabble, how many points is the letter Z worth?", options: ["5", "8", "10", "12"], answer: "10", hint: "Only Q is worth as much.", level: "medium" },
          { q: "Which British doll was launched in 1963 as a rival to Barbie?", options: ["Polly Pocket", "Cabbage Patch Kid", "Tiny Tears", "Sindy"], answer: "Sindy", hint: "She was 'the doll you love to dress'.", level: "medium" },
          { q: "In Monopoly, what do you need to throw to get out of jail without paying?", options: ["A double", "An odd number", "A six", "A seven"], answer: "A double", hint: "Throw one three times in a row and you're sent to jail in the first place.", level: "medium" },
          { q: "In Trivial Pursuit, what do you collect to fill up your round playing piece?", options: ["Counters", "Wedges", "Cards", "Coins"], answer: "Wedges", hint: "Lots of people call them 'cheeses'.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which colourful puzzle cube was invented in 1974?", options: ["Magic Square", "Etch A Sketch", "Rubik's Cube", "Tangram"], answer: "Rubik's Cube", hint: "It's named after its Hungarian inventor.", level: "easy" },
          { q: "Which Cluedo suspect is a vicar in the British version of the game?", options: ["Mrs Peacock", "Professor Plum", "Colonel Mustard", "Reverend Green"], answer: "Reverend Green", hint: "His surname is also the colour of grass.", level: "medium" },
        ]
      },
      {
        id: "game-shows", title: "TV Game Shows", emoji: "❓",
        blurb: "Come on down! Catchphrases and big prizes.",
        questions: [
          { q: "On which game show did the host say 'Our survey said...'?", options: ["Family Fortunes", "Blankety Blank", "Catchphrase", "Bullseye"], answer: "Family Fortunes", hint: "Two families tried to guess the most popular answers.", level: "easy" },
          { q: "On which game show were contestants told to 'Come on down!'?", options: ["Play Your Cards Right", "The Price Is Right", "Deal or No Deal", "Bullseye"], answer: "The Price Is Right", hint: "Contestants had to guess what the prizes cost.", level: "easy" },
          { q: "In 'Who Wants to Be a Millionaire?', which lifeline let you ring someone for help?", options: ["50:50", "Ask the Host", "Phone a Friend", "Ask the Audience"], answer: "Phone a Friend", hint: "You had 30 seconds on the telephone.", level: "easy" },
          { q: "Which darts game show had a cartoon bull called Bully as its mascot?", options: ["Blankety Blank", "The Golden Shot", "Big Break", "Bullseye"], answer: "Bullseye", hint: "Its host, Jim Bowen, said 'Super, smashing, great!'", level: "easy" },
          { q: "Which game show asked contestants to 'say what you see'?", options: ["Catchphrase", "Pointless", "Blockbusters", "Countdown"], answer: "Catchphrase", hint: "Its little gold robot was called Mr Chips.", level: "easy" },
          { q: "Who was the first host of 'The Weakest Link', famous for telling players 'You are the weakest link, goodbye!'?", options: ["Sue Perkins", "Anne Robinson", "Esther Rantzen", "Davina McCall"], answer: "Anne Robinson", hint: "She was known for giving a little wink at the end of each show.", level: "easy" },
          { q: "Which entertainer's catchphrase was 'Nice to see you, to see you nice!'?", options: ["Les Dennis", "Larry Grayson", "Bruce Forsyth", "Bob Monkhouse"], answer: "Bruce Forsyth", hint: "He hosted 'The Generation Game' and 'Play Your Cards Right'.", level: "medium" },
          { q: "Which quiz show has teams of students answering a 'starter for ten'?", options: ["Mastermind", "Fifteen to One", "Going for Gold", "University Challenge"], answer: "University Challenge", hint: "Bamber Gascoigne was its first host.", level: "medium" },
          { q: "On 'Blockbusters', what did contestants famously ask Bob Holness for?", options: ["A letter", "A drink", "A lifeline", "A clue"], answer: "A letter", hint: "The board was made of hexagons, and you had to pick one.", level: "medium" },
          { q: "Which game show had a mascot called Dusty Bin?", options: ["Wheel of Fortune", "3-2-1", "The Golden Shot", "Bullseye"], answer: "3-2-1", hint: "Ted Rogers hosted it, flicking his fingers as he said its name.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "On 'The Generation Game', what carried the prizes past the winner, who then had to remember them?", options: ["A toy train", "A glass cabinet", "A conveyor belt", "A carousel"], answer: "A conveyor belt", hint: "Viewers at home shouted 'cuddly toy!' at the screen.", level: "easy" },
          { q: "Which game show had four zones called Aztec, Medieval, Futuristic and Industrial?", options: ["Fort Boyard", "The Krypton Factor", "Knightmare", "The Crystal Maze"], answer: "The Crystal Maze", hint: "Its first host, Richard O'Brien, played the harmonica.", level: "medium" },
        ]
      },
      {
        id: "seventies", title: "The 1970s", emoji: "🕺",
        blurb: "Flares, glam rock and Space Hoppers.",
        questions: [
          { q: "What happened to Britain's money on 'Decimal Day', 15 February 1971?", options: ["The pound was split into 100 new pence", "The pound was replaced by the euro", "Banknotes were replaced by coins", "The shilling became worth a pound"], answer: "The pound was split into 100 new pence", hint: "Before then, a pound was 240 old pennies.", level: "easy" },
          { q: "Which bouncy orange toy with two 'horns' to hold on to was a 1970s craze?", options: ["The Pogo Stick", "The Space Hopper", "Clackers", "The Slinky"], answer: "The Space Hopper", hint: "You sat on it and bounced along.", level: "easy" },
          { q: "Which supersonic passenger plane began carrying passengers in 1976?", options: ["The Jumbo Jet", "The Comet", "Concorde", "The Airbus A380"], answer: "Concorde", hint: "It was built by Britain and France together.", level: "easy" },
          { q: "Which 1978 film musical starred John Travolta and Olivia Newton-John?", options: ["Saturday Night Fever", "Xanadu", "Fame", "Grease"], answer: "Grease", hint: "It's set at Rydell High School.", level: "easy" },
          { q: "Which Scottish pop band had fans dressed in tartan in the 1970s?", options: ["The Bay City Rollers", "Slade", "Showaddywaddy", "Mud"], answer: "The Bay City Rollers", hint: "Their hits included 'Bye Bye Baby' and 'Shang-a-Lang'.", level: "easy" },
          { q: "Which furry TV creatures lived on Wimbledon Common and tidied up people's rubbish?", options: ["The Clangers", "The Wombles", "The Herbs", "The Flumps"], answer: "The Wombles", hint: "They included Orinoco, Tobermory and Great Uncle Bulgaria.", level: "easy" },
          { q: "In which English seaside town did ABBA win the Eurovision Song Contest in 1974?", options: ["Blackpool", "Bournemouth", "Brighton", "Harrogate"], answer: "Brighton", hint: "It's on the south coast, with a famous pier and a pebbly beach.", level: "medium" },
          { q: "Which Queen song spent nine weeks at number one in 1975 and 1976?", options: ["Don't Stop Me Now", "We Will Rock You", "Killer Queen", "Bohemian Rhapsody"], answer: "Bohemian Rhapsody", hint: "It asks 'Is this the real life? Is this just fantasy?'", level: "medium" },
          { q: "Why did Britain go on to a 'three-day week' in early 1974?", options: ["To save electricity during a miners' dispute", "Because of a flu epidemic", "Because of heavy snow", "To save petrol during a war"], answer: "To save electricity during a miners' dispute", hint: "Coal was running short at the power stations.", level: "medium" },
          { q: "Which year's long, hot summer led to a drought, and a 'Minister for Drought'?", options: ["1972", "1976", "1979", "1970"], answer: "1976", hint: "Denis Howell was given the job, and soon afterwards it poured with rain.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "What did Britain celebrate with street parties in June 1977?", options: ["The Coronation", "The end of rationing", "The Queen's Silver Jubilee", "A royal wedding"], answer: "The Queen's Silver Jubilee", hint: "It marked 25 years on the throne.", level: "easy" },
          { q: "Which glam rock band, led by Marc Bolan, had hits with 'Get It On' and 'Metal Guru'?", options: ["Roxy Music", "Sweet", "Slade", "T. Rex"], answer: "T. Rex", hint: "It's named after a fearsome dinosaur.", level: "medium" },
        ]
      },
    ]
  },
  "2027-01-04": {
    topics: [
      {
        id: "gardening", title: "Gardening", emoji: "🌷",
        blurb: "Bulbs, borders and things that munch in the night.",
        questions: [
          { q: "Which slimy garden pest leaves a silvery trail behind it?", options: ["A slug", "A worm", "A beetle", "A woodlouse"], answer: "A slug", hint: "It's like a snail without its shell.", level: "easy" },
          { q: "Which famous flower show is held each May in the grounds of the Royal Hospital in London?", options: ["The Hampton Court Garden Festival", "The Chelsea Flower Show", "The Harrogate Flower Show", "The Southport Flower Show"], answer: "The Chelsea Flower Show", hint: "The Royal Hospital is home to the scarlet-coated Pensioners.", level: "easy" },
          { q: "What do gardeners call snipping off faded flowers so that the plant makes more?", options: ["Pruning", "Pricking out", "Deadheading", "Mulching"], answer: "Deadheading", hint: "It's often done to roses and sweet peas all through the summer.", level: "easy" },
          { q: "Which world-famous botanic gardens in south-west London have a Palm House and a Great Pagoda?", options: ["Wisley", "Hyde Park", "Sissinghurst", "Kew Gardens"], answer: "Kew Gardens", hint: "They're near Richmond, beside the Thames.", level: "easy" },
          { q: "Which Cornish attraction has giant bubble-like 'biomes' full of plants?", options: ["The Eden Project", "Trebah Garden", "St Michael's Mount", "The Lost Gardens of Heligan"], answer: "The Eden Project", hint: "It was built in an old clay pit near St Austell.", level: "easy" },
          { q: "Which gardener presented 'Ground Force' with Charlie Dimmock and Tommy Walsh?", options: ["Geoff Hamilton", "Alan Titchmarsh", "Percy Thrower", "Monty Don"], answer: "Alan Titchmarsh", hint: "He also presented 'Gardeners' World' in the 1990s and writes novels.", level: "easy" },
          { q: "What do we call a plant that grows leaves in its first year, then flowers and dies in its second?", options: ["An evergreen", "An annual", "A biennial", "A perennial"], answer: "A biennial", hint: "Foxgloves and wallflowers are often grown this way.", level: "medium" },
          { q: "Which garden designer, nicknamed 'Capability', landscaped the park at Blenheim Palace?", options: ["Gertrude Jekyll", "Humphry Repton", "Joseph Paxton", "Lancelot Brown"], answer: "Lancelot Brown", hint: "He got his nickname by telling owners their land had 'capability'.", level: "medium" },
          { q: "What do gardeners call letting seed potatoes sprout before planting them?", options: ["Chitting", "Hardening off", "Earthing up", "Pricking out"], answer: "Chitting", hint: "You stand them in egg boxes on a cool, light windowsill.", level: "medium" },
          { q: "Which crop is famously grown in the dark in Yorkshire's 'Triangle', between Wakefield, Morley and Rothwell?", options: ["Celery", "Rhubarb", "Chicory", "Asparagus"], answer: "Rhubarb", hint: "Its pink stalks make a lovely crumble.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which garden tool has a long handle and a row of metal teeth for gathering leaves?", options: ["A hoe", "A spade", "A rake", "A trowel"], answer: "A rake", hint: "Step on its teeth and the handle might hit you on the nose!", level: "easy" },
          { q: "What is a dibber used for in the garden?", options: ["Trimming hedges", "Testing the soil", "Catching slugs", "Making holes for seeds and seedlings"], answer: "Making holes for seeds and seedlings", hint: "It's a short, pointed stick, often made of wood.", level: "medium" },
        ]
      },
      {
        id: "musicals", title: "Musicals", emoji: "🎼",
        blurb: "Show tunes from the West End and the big screen.",
        questions: [
          { q: "Which musical, full of ABBA songs, is set on a Greek island?", options: ["Mamma Mia!", "Chess", "Evita", "Hair"], answer: "Mamma Mia!", hint: "It shares its name with an ABBA hit from 1975.", level: "easy" },
          { q: "In which Andrew Lloyd Webber musical do the actors race around on roller skates, playing trains?", options: ["Cats", "Starlight Express", "Evita", "Aspects of Love"], answer: "Starlight Express", hint: "The steam engine Rusty is the hero.", level: "easy" },
          { q: "Which musical, based on a Charles Dickens story, features the song 'Food, Glorious Food'?", options: ["Annie", "Bugsy Malone", "Oliver!", "Scrooge"], answer: "Oliver!", hint: "A hungry orphan dares to ask for more.", level: "easy" },
          { q: "In 'The Phantom of the Opera', what does the Phantom wear over his face?", options: ["A hood", "A veil", "A bandage", "A mask"], answer: "A mask", hint: "It covers half of his face.", level: "easy" },
          { q: "Which musical features 'I Dreamed a Dream', which Susan Boyle sang on 'Britain's Got Talent' in 2009?", options: ["Les Misérables", "The Phantom of the Opera", "Chess", "Miss Saigon"], answer: "Les Misérables", hint: "It's set in France, and Fantine sings it.", level: "easy" },
          { q: "In 'Joseph and the Amazing Technicolor Dreamcoat', what does Jacob give his favourite son?", options: ["A silver cup", "A coat of many colours", "A magic ring", "A golden crown"], answer: "A coat of many colours", hint: "It's in the show's title.", level: "easy" },
          { q: "Which musical features the song 'Don't Cry for Me Argentina'?", options: ["Aspects of Love", "Sunset Boulevard", "Evita", "Chess"], answer: "Evita", hint: "It tells the life story of Argentina's First Lady, Eva Perón.", level: "medium" },
          { q: "Which musical features the songs 'All That Jazz' and 'Razzle Dazzle'?", options: ["Cabaret", "Sweet Charity", "A Chorus Line", "Chicago"], answer: "Chicago", hint: "Roxie Hart and Velma Kelly are both on trial for murder.", level: "medium" },
          { q: "Which Willy Russell musical is about twins separated at birth and raised in Liverpool?", options: ["Blood Brothers", "Fame", "Our House", "Billy Elliot"], answer: "Blood Brothers", hint: "It ends with the song 'Tell Me It's Not True'.", level: "medium" },
          { q: "In 'Wicked', what is the name of the green-skinned witch?", options: ["Dorothy", "Elphaba", "Glinda", "Nessarose"], answer: "Elphaba", hint: "Her name comes from the initials of the 'Oz' author L. Frank Baum.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which musical features an orphan who sings 'Tomorrow' and has a dog called Sandy?", options: ["Gypsy", "Hello, Dolly!", "Annie", "Matilda"], answer: "Annie", hint: "She's taken in by the very rich Daddy Warbucks.", level: "easy" },
          { q: "Who wrote the music for 'Billy Elliot the Musical'?", options: ["Tim Rice", "Gary Barlow", "Andrew Lloyd Webber", "Elton John"], answer: "Elton John", hint: "He also wrote the songs for the film 'The Lion King' with Tim Rice.", level: "medium" },
        ]
      },
      {
        id: "dogs", title: "Dogs", emoji: "🐕",
        blurb: "Famous dogs, favourite breeds and the odd sausage dog.",
        questions: [
          { q: "What breed of dog is Scooby-Doo?", options: ["A Great Dane", "A Labrador", "A bloodhound", "A boxer"], answer: "A Great Dane", hint: "It's one of the tallest breeds of all.", level: "easy" },
          { q: "Which breed of dog is often called a 'sausage dog'?", options: ["The beagle", "The dachshund", "The corgi", "The basset hound"], answer: "The dachshund", hint: "It comes from Germany, where it was bred to hunt badgers.", level: "easy" },
          { q: "Which big mountain-rescue dog is often pictured with a little barrel round its neck?", options: ["The Bernese mountain dog", "The Newfoundland", "The Saint Bernard", "The husky"], answer: "The Saint Bernard", hint: "It's named after a monastery high in the Swiss Alps.", level: "easy" },
          { q: "What is the name of the famous dog show held each year by the Kennel Club, with a 'Best in Show' prize?", options: ["The Great Dog Show", "The Westminster Show", "Discover Dogs", "Crufts"], answer: "Crufts", hint: "It's named after Charles, the dog-biscuit salesman who started it in 1891.", level: "easy" },
          { q: "What breed of dog is Snoopy, in the 'Peanuts' cartoons?", options: ["A beagle", "A terrier", "A poodle", "A spaniel"], answer: "A beagle", hint: "It's a hound bred for hunting hares.", level: "easy" },
          { q: "What breed of dog was the puppy in the Andrex toilet roll adverts?", options: ["A poodle", "A Labrador", "A Dalmatian", "A spaniel"], answer: "A Labrador", hint: "When grown up, these golden dogs often become guide dogs.", level: "easy" },
          { q: "Which breed of dog has a blue-black tongue?", options: ["The pug", "The husky", "The Chow Chow", "The poodle"], answer: "The Chow Chow", hint: "It's a fluffy, lion-like dog from China.", level: "medium" },
          { q: "What breed was Greyfriars Bobby, the loyal little dog of Edinburgh?", options: ["A West Highland terrier", "A Cairn terrier", "A Scottish terrier", "A Skye terrier"], answer: "A Skye terrier", hint: "The breed is named after a Scottish island.", level: "medium" },
          { q: "Which tiny dog breed is named after a state in Mexico?", options: ["The Chihuahua", "The Pomeranian", "The Pekingese", "The Yorkshire terrier"], answer: "The Chihuahua", hint: "It's usually said to be the smallest breed in the world.", level: "medium" },
          { q: "Which breed of dog is usually seen at sheepdog trials, like those on 'One Man and His Dog'?", options: ["The Welsh corgi", "The Border collie", "The German shepherd", "The Old English sheepdog"], answer: "The Border collie", hint: "It's a black-and-white working dog from the hills between England and Scotland.", level: "medium" },
        ],
        // Spare questions, only used by the "Swap the question" lifeline (one easy, one medium).
        spares: [
          { q: "Which spotty breed of dog stars in a Disney film with Pongo and Perdita?", options: ["The beagle", "The bull terrier", "The Dalmatian", "The pointer"], answer: "The Dalmatian", hint: "There are 101 of them in the title.", level: "easy" },
          { q: "Which short-legged breed of dog was Queen Elizabeth II famous for keeping?", options: ["The Jack Russell", "The basset hound", "The dachshund", "The corgi"], answer: "The corgi", hint: "The breed comes from Wales and was first used to herd cattle.", level: "medium" },
        ]
      },
    ]
  },
};
