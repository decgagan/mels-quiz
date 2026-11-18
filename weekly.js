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
          { q: "Which band had the 1983 hit \"Karma Chameleon\"?", options: ["Culture Club", "Wham!", "Duran Duran", "Spandau Ballet"], answer: "Culture Club", level: "easy" },
          { q: "Which singer had the 1984 hit \"Like a Virgin\"?", options: ["Cyndi Lauper", "Kylie Minogue", "Madonna", "Whitney Houston"], answer: "Madonna", level: "easy" },
          { q: "Which pop duo was made up of George Michael and Andrew Ridgeley?", options: ["Wham!", "Eurythmics", "Pet Shop Boys", "Tears for Fears"], answer: "Wham!", level: "easy" },
          { q: "Which Michael Jackson album from 1982 includes \"Billie Jean\" and \"Beat It\"?", options: ["Bad", "Thriller", "Off the Wall", "Dangerous"], answer: "Thriller", level: "easy" },
          { q: "Which charity single, written by Bob Geldof and Midge Ure, was released in December 1984?", options: ["We Are the World", "Last Christmas", "Merry Christmas Everyone", "Do They Know It's Christmas?"], answer: "Do They Know It's Christmas?", level: "easy" },
          { q: "Which singer had a 1980s hit with \"Girls Just Want to Have Fun\"?", options: ["Madonna", "Debbie Harry", "Tina Turner", "Cyndi Lauper"], answer: "Cyndi Lauper", level: "easy" },
          { q: "Which Norwegian band had the 1985 hit \"Take On Me\"?", options: ["Roxette", "Europe", "ABBA", "a-ha"], answer: "a-ha", level: "medium" },
          { q: "Which band, led by singer Simon Le Bon, had the 1982 hit \"Hungry Like the Wolf\"?", options: ["Spandau Ballet", "Duran Duran", "Culture Club", "ABC"], answer: "Duran Duran", level: "medium" },
          { q: "Which band had the 1985 hit \"Don't You (Forget About Me)\"?", options: ["Simple Minds", "Tears for Fears", "A Flock of Seagulls", "Level 42"], answer: "Simple Minds", level: "medium" },
          { q: "Who had a number one in 1987 with \"Never Gonna Give You Up\"?", options: ["Rick Astley", "Jason Donovan", "Bros", "Brother Beyond"], answer: "Rick Astley", level: "medium" },
        ]
      },
      {
        id: "british-food", title: "British Food and Drink", emoji: "🍽️",
        blurb: "Pies, puddings and a proper cuppa.",
        questions: [
          { q: "Which traditional British pudding is a suet pastry spread with jam, then rolled up?", options: ["Jam roly-poly", "Eton mess", "Bakewell tart", "Spotted dick"], answer: "Jam roly-poly", level: "easy" },
          { q: "Haggis is the traditional national dish of which country?", options: ["Wales", "Ireland", "Scotland", "England"], answer: "Scotland", level: "easy" },
          { q: "Wensleydale cheese, loved by Wallace and Gromit, comes from which county?", options: ["Yorkshire", "Cornwall", "Devon", "Kent"], answer: "Yorkshire", level: "easy" },
          { q: "Which Cornish food is a pastry case filled with beef, potato, swede and onion?", options: ["Pie", "Sausage roll", "Samosa", "Pasty"], answer: "Pasty", level: "easy" },
          { q: "A Scotch egg is wrapped in sausage meat and then coated in what?", options: ["Breadcrumbs", "Pastry", "Batter", "Oats"], answer: "Breadcrumbs", level: "easy" },
          { q: "Which British dessert has layers of sponge, fruit, jelly, custard and cream?", options: ["Crumble", "Eton mess", "Sticky toffee pudding", "Trifle"], answer: "Trifle", level: "easy" },
          { q: "Melton Mowbray, famous for its pork pies, is in which English county?", options: ["Lincolnshire", "Norfolk", "Leicestershire", "Somerset"], answer: "Leicestershire", level: "medium" },
          { q: "Which Welsh dish is a rich cheese sauce poured over toast?", options: ["Cawl", "Welsh rarebit", "Bara brith", "Laverbread"], answer: "Welsh rarebit", level: "medium" },
          { q: "A kipper is a smoked version of which fish?", options: ["Cod", "Haddock", "Salmon", "Herring"], answer: "Herring", level: "medium" },
          { q: "Which Scottish dessert is made with oats, whisky, cream and raspberries?", options: ["Clootie dumpling", "Tablet", "Cranachan", "Shortbread"], answer: "Cranachan", level: "medium" },
        ]
      },
      {
        id: "manchester", title: "Manchester", emoji: "🐝",
        blurb: "Bees, bands and Old Trafford.",
        questions: [
          { q: "Which insect is the symbol of Manchester?", options: ["Ant", "Butterfly", "Bee", "Ladybird"], answer: "Bee", level: "easy" },
          { q: "Manchester United share their city with which other big football club?", options: ["Everton", "Bolton Wanderers", "Manchester City", "Liverpool"], answer: "Manchester City", level: "easy" },
          { q: "Which band, fronted by brothers Liam and Noel Gallagher, formed in Manchester in 1991?", options: ["Blur", "Pulp", "The Verve", "Oasis"], answer: "Oasis", level: "easy" },
          { q: "Which is Manchester's busiest railway station?", options: ["Piccadilly", "Victoria", "Oxford Road", "Deansgate"], answer: "Piccadilly", level: "easy" },
          { q: "Which football ground is nicknamed the \"Theatre of Dreams\"?", options: ["Etihad Stadium", "Anfield", "Old Trafford", "Goodison Park"], answer: "Old Trafford", level: "easy" },
          { q: "In which part of England is Manchester?", options: ["The North West", "Yorkshire", "The West Midlands", "The North East"], answer: "The North West", level: "easy" },
          { q: "The Hacienda nightclub in Manchester was linked with which record label?", options: ["Rough Trade", "Stiff Records", "Factory Records", "Island Records"], answer: "Factory Records", level: "medium" },
          { q: "Which Manchester band was fronted by Ian Curtis and recorded \"Love Will Tear Us Apart\"?", options: ["The Smiths", "The Stone Roses", "Joy Division", "Happy Mondays"], answer: "Joy Division", level: "medium" },
          { q: "The Manchester Ship Canal reaches the sea through the estuary of which river?", options: ["Thames", "Severn", "Humber", "Mersey"], answer: "Mersey", level: "medium" },
          { q: "In which year did the Liverpool and Manchester Railway, the world's first inter-city passenger railway, open?", options: ["1801", "1830", "1865", "1901"], answer: "1830", level: "medium" },
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
          { q: "In which soap would you find the Rovers Return pub?", options: ["EastEnders", "Emmerdale", "Coronation Street", "Brookside"], answer: "Coronation Street", level: "easy" },
          { q: "Which soap has a village pub called the Woolpack?", options: ["Emmerdale", "EastEnders", "Hollyoaks", "Coronation Street"], answer: "Emmerdale", level: "easy" },
          { q: "What is the name of the pub in EastEnders?", options: ["The Rovers Return", "The Woolpack", "The Queen Victoria", "The Dog in the Pond"], answer: "The Queen Victoria", level: "easy" },
          { q: "Which soap is set in Erinsborough and features Ramsay Street?", options: ["Home and Away", "Hollyoaks", "Neighbours", "Brookside"], answer: "Neighbours", level: "easy" },
          { q: "Which EastEnders family includes brothers Phil and Grant?", options: ["The Beales", "The Slaters", "The Fowlers", "The Mitchells"], answer: "The Mitchells", level: "easy" },
          { q: "Which soap, set on a Liverpool cul-de-sac, ran on Channel 4 from 1982 to 2003?", options: ["Crossroads", "Emmerdale", "Family Affairs", "Brookside"], answer: "Brookside", level: "easy" },
          { q: "Home and Away is set in which fictional seaside town?", options: ["Summer Bay", "Erinsborough", "Sunny Cove", "Bondi Bay"], answer: "Summer Bay", level: "medium" },
          { q: "Hollyoaks is set in a fictional suburb of which English city?", options: ["Liverpool", "Leeds", "Bristol", "Chester"], answer: "Chester", level: "medium" },
          { q: "Which actor has played Ken Barlow in Coronation Street since it began in 1960?", options: ["Johnny Briggs", "Roy Barraclough", "Anthony Valentine", "William Roache"], answer: "William Roache", level: "medium" },
          { q: "In which year was the first episode of EastEnders shown?", options: ["1985", "1979", "1982", "1990"], answer: "1985", level: "medium" },
        ]
      },
      {
        id: "animals", title: "Animals", emoji: "🐾",
        blurb: "Vixens, calves and a parliament of owls.",
        questions: [
          { q: "What is a baby cow called?", options: ["A foal", "A kid", "A lamb", "A calf"], answer: "A calf", level: "easy" },
          { q: "How many legs does an insect have?", options: ["Four", "Eight", "Ten", "Six"], answer: "Six", level: "easy" },
          { q: "What is a group of wolves called?", options: ["A pride", "A herd", "A flock", "A pack"], answer: "A pack", level: "easy" },
          { q: "Which flightless bird is found in Antarctica?", options: ["Ostrich", "Emu", "Penguin", "Kiwi"], answer: "Penguin", level: "easy" },
          { q: "What is a female pig called?", options: ["A vixen", "A doe", "A jenny", "A sow"], answer: "A sow", level: "easy" },
          { q: "What do koalas mainly eat?", options: ["Bamboo", "Grass", "Fruit", "Eucalyptus leaves"], answer: "Eucalyptus leaves", level: "easy" },
          { q: "What is a group of owls called?", options: ["A parliament", "A murder", "A gaggle", "A colony"], answer: "A parliament", level: "medium" },
          { q: "Which of these mammals lays eggs?", options: ["Hedgehog", "Platypus", "Otter", "Armadillo"], answer: "Platypus", level: "medium" },
          { q: "How many humps does a Bactrian camel have?", options: ["One", "Two", "Three", "Four"], answer: "Two", level: "medium" },
          { q: "What is a male swan called?", options: ["A cob", "A pen", "A cygnet", "A drake"], answer: "A cob", level: "medium" },
        ]
      },
      {
        id: "uk-geography", title: "Around Britain", emoji: "🗺️",
        blurb: "Cities, coasts and countryside.",
        questions: [
          { q: "Which English city is nicknamed the Steel City?", options: ["Sheffield", "Newcastle", "Leeds", "Birmingham"], answer: "Sheffield", level: "easy" },
          { q: "Which seaside resort is famous for its Pleasure Beach, tower and illuminations?", options: ["Brighton", "Skegness", "Scarborough", "Blackpool"], answer: "Blackpool", level: "easy" },
          { q: "The famous white cliffs are at which English port?", options: ["Plymouth", "Hull", "Southampton", "Dover"], answer: "Dover", level: "easy" },
          { q: "In which county is Land's End?", options: ["Devon", "Cornwall", "Dorset", "Kent"], answer: "Cornwall", level: "easy" },
          { q: "Which northern English city is famous for its Minster and the Shambles?", options: ["Durham", "Lincoln", "Carlisle", "York"], answer: "York", level: "easy" },
          { q: "Which famous prehistoric stone circle stands on Salisbury Plain?", options: ["Avebury", "Stonehenge", "Callanish", "Castlerigg"], answer: "Stonehenge", level: "easy" },
          { q: "Which Scottish city is nicknamed the Granite City?", options: ["Aberdeen", "Dundee", "Inverness", "Perth"], answer: "Aberdeen", level: "medium" },
          { q: "Which is the largest national park in the United Kingdom?", options: ["The Lake District", "Snowdonia", "The Peak District", "The Cairngorms"], answer: "The Cairngorms", level: "medium" },
          { q: "The village with the very long name Llanfairpwllgwyngyll is on which island?", options: ["Skye", "The Isle of Wight", "Lundy", "Anglesey"], answer: "Anglesey", level: "medium" },
          { q: "Skye, Mull and Islay are part of which Scottish island group?", options: ["The Orkneys", "The Shetlands", "The Hebrides", "The Channel Islands"], answer: "The Hebrides", level: "medium" },
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
          { q: "On what surface is the Wimbledon tennis tournament played?", options: ["Clay", "Concrete", "Carpet", "Grass"], answer: "Grass", level: "easy" },
          { q: "Which sport is played at Lord's in London?", options: ["Football", "Tennis", "Cricket", "Rugby"], answer: "Cricket", level: "easy" },
          { q: "In golf, what is a score of one stroke under par on a hole called?", options: ["An eagle", "A bogey", "An albatross", "A birdie"], answer: "A birdie", level: "easy" },
          { q: "Which London football club is nicknamed the Gunners?", options: ["Chelsea", "Tottenham", "West Ham", "Arsenal"], answer: "Arsenal", level: "easy" },
          { q: "What colour jersey does the leader of the Tour de France wear?", options: ["Green", "Red", "White", "Yellow"], answer: "Yellow", level: "easy" },
          { q: "The Grand National horse race is run at which racecourse?", options: ["Ascot", "Aintree", "Epsom", "Cheltenham"], answer: "Aintree", level: "easy" },
          { q: "Who scored a hat-trick for England in the 1966 World Cup final?", options: ["Bobby Charlton", "Bobby Moore", "Geoff Hurst", "Nobby Stiles"], answer: "Geoff Hurst", level: "medium" },
          { q: "Which team did England's Lionesses beat in the Euro 2022 final at Wembley?", options: ["Spain", "Sweden", "Germany", "France"], answer: "Germany", level: "medium" },
          { q: "How many players are in a rugby union team on the pitch?", options: ["Fifteen", "Eleven", "Thirteen", "Eighteen"], answer: "Fifteen", level: "medium" },
          { q: "In snooker, how many points is the blue ball worth?", options: ["Five", "Three", "Four", "Six"], answer: "Five", level: "medium" },
        ]
      },
      {
        id: "films", title: "Films", emoji: "🎬",
        blurb: "Big screen favourites.",
        questions: [
          { q: "Which 1997 film, directed by James Cameron, tells the story of a ship that hit an iceberg?", options: ["Poseidon", "Titanic", "The Abyss", "Pearl Harbor"], answer: "Titanic", level: "easy" },
          { q: "Which Disney film features the song \"Let It Go\"?", options: ["Tangled", "Moana", "Encanto", "Frozen"], answer: "Frozen", level: "easy" },
          { q: "In \"The Lion King\", what is the young lion cub called?", options: ["Mufasa", "Scar", "Nala", "Simba"], answer: "Simba", level: "easy" },
          { q: "Which animated film is about a clownfish who is lost and found by his dad?", options: ["Shark Tale", "The Little Mermaid", "Finding Nemo", "Moana"], answer: "Finding Nemo", level: "easy" },
          { q: "Which 1984 comedy asks \"Who you gonna call?\"", options: ["Gremlins", "Ghostbusters", "Beetlejuice", "Poltergeist"], answer: "Ghostbusters", level: "easy" },
          { q: "Which 1993 film is about a theme park full of cloned dinosaurs?", options: ["King Kong", "Godzilla", "Jurassic Park", "The Land Before Time"], answer: "Jurassic Park", level: "easy" },
          { q: "Which actor first played James Bond on the big screen, in \"Dr. No\" (1962)?", options: ["Roger Moore", "Pierce Brosnan", "Timothy Dalton", "Sean Connery"], answer: "Sean Connery", level: "medium" },
          { q: "Which actor voices Paddington Bear in the 2014 film?", options: ["Hugh Bonneville", "Hugh Grant", "Colin Firth", "Ben Whishaw"], answer: "Ben Whishaw", level: "medium" },
          { q: "Which actor played Dumbledore in the first two Harry Potter films?", options: ["Michael Gambon", "Ian McKellen", "Alan Rickman", "Richard Harris"], answer: "Richard Harris", level: "medium" },
          { q: "In \"The Matrix\", which colour pill does Neo take?", options: ["Blue", "Green", "Yellow", "Red"], answer: "Red", level: "medium" },
        ]
      },
      {
        id: "christmas", title: "Christmas in Britain", emoji: "🎄",
        blurb: "Mince pies, sprouts and the King's speech.",
        questions: [
          { q: "What do children traditionally leave out for Father Christmas on Christmas Eve?", options: ["A mince pie", "A sandwich", "A fish finger", "A bar of chocolate"], answer: "A mince pie", level: "easy" },
          { q: "What is the day after Christmas Day called in the UK?", options: ["New Year's Day", "Easter Monday", "Boxing Day", "Twelfth Night"], answer: "Boxing Day", level: "easy" },
          { q: "In the song, what did my true love give to me on the first day of Christmas?", options: ["Two turtle doves", "Three French hens", "A partridge in a pear tree", "A golden ring"], answer: "A partridge in a pear tree", level: "easy" },
          { q: "How many days of Christmas are there in the famous song?", options: ["Ten", "Eight", "Seven", "Twelve"], answer: "Twelve", level: "easy" },
          { q: "Which reindeer has a famously red nose?", options: ["Rudolph", "Dasher", "Prancer", "Comet"], answer: "Rudolph", level: "easy" },
          { q: "Which plant is hung up at Christmas for people to kiss under?", options: ["Holly", "Ivy", "Heather", "Mistletoe"], answer: "Mistletoe", level: "easy" },
          { q: "Who traditionally gives a speech to the nation on the TV at 3pm on Christmas Day?", options: ["The Prime Minister", "The Archbishop of Canterbury", "The King", "The Mayor of London"], answer: "The King", level: "medium" },
          { q: "In which year was the first commercial Christmas card sent, in London?", options: ["1750", "1901", "1920", "1843"], answer: "1843", level: "medium" },
          { q: "Which royal, husband of Queen Victoria, helped make Christmas trees popular in Britain?", options: ["Prince Philip", "Prince Albert", "Prince Edward", "Prince Henry"], answer: "Prince Albert", level: "medium" },
          { q: "In Charles Dickens's \"A Christmas Carol\", who is the miserly main character?", options: ["Bob Cratchit", "Fagin", "Mr Micawber", "Ebenezer Scrooge"], answer: "Ebenezer Scrooge", level: "medium" },
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
          { q: "Which girl group had a huge hit with \"Wannabe\" in 1996?", options: ["All Saints", "Atomic Kitten", "Bananarama", "Spice Girls"], answer: "Spice Girls", level: "easy" },
          { q: "Which 1990s craze involved looking after a tiny digital pet on a keyring?", options: ["Tamagotchi", "Furby", "Pokémon cards", "Beanie Babies"], answer: "Tamagotchi", level: "easy" },
          { q: "Which sheep, born in Scotland in 1996, was the first mammal cloned from an adult cell?", options: ["Shaun", "Molly", "Dolly", "Daisy"], answer: "Dolly", level: "easy" },
          { q: "Which TV show about six friends in New York began in 1994?", options: ["Seinfeld", "Frasier", "Cheers", "Friends"], answer: "Friends", level: "easy" },
          { q: "Which video game hero is a fast-running blue hedgehog?", options: ["Mario", "Crash Bandicoot", "Sonic", "Donkey Kong"], answer: "Sonic", level: "easy" },
          { q: "Which boy band had a hit in 1995 with \"Back for Good\"?", options: ["Take That", "Boyzone", "East 17", "Westlife"], answer: "Take That", level: "easy" },
          { q: "Which Britpop band released the album \"Parklife\" in 1994?", options: ["Pulp", "Blur", "Suede", "Elastica"], answer: "Blur", level: "medium" },
          { q: "In which year did the Channel Tunnel officially open?", options: ["1990", "1998", "1986", "1994"], answer: "1994", level: "medium" },
          { q: "Who became Prime Minister after the 1997 general election?", options: ["John Major", "Tony Blair", "Gordon Brown", "William Hague"], answer: "Tony Blair", level: "medium" },
          { q: "Which company launched the original PlayStation in Europe in 1995?", options: ["Nintendo", "Sega", "Microsoft", "Sony"], answer: "Sony", level: "medium" },
        ]
      },
      {
        id: "science", title: "Science and Nature", emoji: "🔬",
        blurb: "Planets, bodies and big ideas.",
        questions: [
          { q: "Which planet has a famous giant storm called the Great Red Spot?", options: ["Jupiter", "Mars", "Saturn", "Neptune"], answer: "Jupiter", level: "easy" },
          { q: "How many colours are there in a rainbow?", options: ["Seven", "Five", "Six", "Eight"], answer: "Seven", level: "easy" },
          { q: "What type of animal is a dolphin?", options: ["A mammal", "A fish", "A reptile", "An amphibian"], answer: "A mammal", level: "easy" },
          { q: "At what temperature does water boil at sea level, in degrees Celsius?", options: ["90", "80", "120", "100"], answer: "100", level: "easy" },
          { q: "What is the closest star to the Earth?", options: ["The Sun", "Polaris", "Sirius", "Betelgeuse"], answer: "The Sun", level: "easy" },
          { q: "What is a baby frog called?", options: ["A cub", "A tadpole", "A joey", "A fry"], answer: "A tadpole", level: "easy" },
          { q: "Which vitamin does our skin make when it is in sunlight?", options: ["Vitamin A", "Vitamin D", "Vitamin C", "Vitamin B"], answer: "Vitamin D", level: "medium" },
          { q: "How many teeth does a typical adult human have, including wisdom teeth?", options: ["32", "28", "30", "36"], answer: "32", level: "medium" },
          { q: "What is the name of the thigh bone, the longest bone in the human body?", options: ["Femur", "Tibia", "Humerus", "Fibula"], answer: "Femur", level: "medium" },
          { q: "Which organs in the body filter the blood and make urine?", options: ["The lungs", "The liver", "The kidneys", "The spleen"], answer: "The kidneys", level: "medium" },
        ]
      },
      {
        id: "world", title: "Inventions and Discoveries", emoji: "💡",
        blurb: "Clever Britons and big breakthroughs.",
        questions: [
          { q: "Which Scottish inventor is famous for demonstrating the first working television system in 1926?", options: ["Alexander Fleming", "James Watt", "John Logie Baird", "Charles Babbage"], answer: "John Logie Baird", level: "easy" },
          { q: "Which inventor is credited with the first practical telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Guglielmo Marconi", "Samuel Morse"], answer: "Alexander Graham Bell", level: "easy" },
          { q: "Who made the first powered aeroplane flight in 1903?", options: ["The Wright brothers", "Louis Blériot", "Amy Johnson", "The Montgolfier brothers"], answer: "The Wright brothers", level: "easy" },
          { q: "Which codebreaker worked at Bletchley Park during the Second World War?", options: ["Isaac Newton", "Charles Darwin", "Alan Turing", "Tim Berners-Lee"], answer: "Alan Turing", level: "easy" },
          { q: "Which British scientist invented the World Wide Web?", options: ["Bill Gates", "Alan Turing", "Stephen Hawking", "Tim Berners-Lee"], answer: "Tim Berners-Lee", level: "easy" },
          { q: "Which Scottish scientist discovered penicillin in 1928?", options: ["Joseph Lister", "Alexander Fleming", "Edward Jenner", "James Watt"], answer: "Alexander Fleming", level: "easy" },
          { q: "Which engineer designed the Clifton Suspension Bridge and the SS Great Britain?", options: ["George Stephenson", "Isambard Kingdom Brunel", "Thomas Telford", "James Watt"], answer: "Isambard Kingdom Brunel", level: "medium" },
          { q: "Which engineer built the famous steam locomotive called Rocket?", options: ["Isambard Kingdom Brunel", "Richard Trevithick", "Thomas Newcomen", "George Stephenson"], answer: "George Stephenson", level: "medium" },
          { q: "In 1796, Edward Jenner developed the first vaccine against which disease?", options: ["Polio", "Smallpox", "Measles", "Cholera"], answer: "Smallpox", level: "medium" },
          { q: "Which Italian inventor sent the first radio signals across the Atlantic in 1901?", options: ["Nikola Tesla", "Enrico Fermi", "Guglielmo Marconi", "Alessandro Volta"], answer: "Guglielmo Marconi", level: "medium" },
        ]
      },
    ]
  },
};
