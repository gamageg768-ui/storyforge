import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

const AUTHORS = [
  { username: 'ElenaVoss',     email: 'elena@sf.app',     avatarColor: '#ec4899', bio: 'Literary fiction writer with a love for unreliable narrators and moral complexity.' },
  { username: 'MarcusThorn',   email: 'marcus@sf.app',    avatarColor: '#3b82f6', bio: 'Sci-fi author obsessed with first contact scenarios and the philosophy of consciousness.' },
  { username: 'LilyMoon',      email: 'lily@sf.app',      avatarColor: '#10b981', bio: 'Writes whimsical fantasy that feels like a warm blanket on a rainy afternoon.' },
  { username: 'RavenBlack',    email: 'raven@sf.app',     avatarColor: '#6366f1', bio: 'Dark thriller specialist. Every chapter ends on a cliffhanger — sorry not sorry.' },
  { username: 'JadeWillow',    email: 'jade@sf.app',      avatarColor: '#14b8a6', bio: 'Historical fiction devotee. Researches for months just to get one scene right.' },
  { username: 'OwenStorm',     email: 'owen@sf.app',      avatarColor: '#f59e0b', bio: 'Adventure and horror hybrid — think Indiana Jones meets Lovecraft.' },
  { username: 'CassandraFire', email: 'cassandra@sf.app', avatarColor: '#ef4444', bio: 'Romance author who believes every love story deserves at least one impossible obstacle.' },
  { username: 'TheodorePen',   email: 'theodore@sf.app',  avatarColor: '#8b5cf6', bio: 'Literary essayist turned novelist. Writes long sentences that spiral into revelation.' },
]

const STORIES_DATA = [
  {
    title: 'The Glass Cartographer',
    description: 'A mapmaker who can draw lands that do not yet exist discovers her maps are beginning to come true — with consequences she never intended.',
    genre: 'Fantasy',
    authorUsername: 'ElenaVoss',
    status: 'ongoing',
    coverColor: '#7c3aed',
    tags: 'magic,maps,consequences',
    chapters: [
      {
        title: 'The First True Line',
        content: `The ink never lied. That was the first thing Mira's grandmother had told her, pressing the old brush into her seven-year-old hands with the gravity of a funeral. Every other art could deceive — oil could flatter, watercolour could soften, charcoal could obscure. But cartography ink, the kind made from ground obsidian and sea-salt and the burned tips of lightning-struck oak, that ink drew only truth.\n\nMira had not believed her then. She had spent twenty years since believing it less with every commission — noble estates rendered slightly more impressive, trade routes adjusted to favour the paying merchant, coastlines straightened where nature had been inconveniently jagged. The ink didn't care. It went where she guided it.\n\nBut the map she was making now was different.\n\nShe had started it in the margins of a dream, three weeks ago: a coastline she didn't recognise, an island chain arranged like knuckles on a fist, a mountain whose peak was described in the dream-logic of the ink as 'the place where questions go to become older.' She had woken at four in the morning and gone straight to her drafting table, still wearing her sleeping robe, and drawn it all down before the dream could leak away.\n\nNow she stood over the half-finished sheet with daylight coming through the high windows and felt the familiar unease that had followed her since she'd begun. The island chain was there. The mountain was there. A river delta she hadn't consciously designed had appeared overnight, branching and rebranching until it resembled a nerve diagram she'd once seen in a surgeon's textbook.\n\nAnd three mornings ago, she had opened a letter from a sailor she'd never met, enclosing a rough sketch he'd made of a coastline he'd discovered south of the Warden Straits. His sketch and her map matched in every particular.\n\nMira set down her brush. The ink — as always — did not lie. The question was whether it was recording something that existed, or whether it was recording something that would.`,
      },
      {
        title: 'The Country Without a Name',
        content: `She called it the Unnamed Territory in her working notes, a deliberately bureaucratic label meant to keep her from becoming attached. Cartographers who became attached to their subjects made errors. They softened difficult terrain, added roads that didn't exist yet, drew harbours where only mud flats stood. Attachment was the enemy of precision.\n\nBut she was already attached. She could feel it in the way her hand moved across the vellum — with the care you'd use lifting something fragile, something almost alive. The coastal cities she was adding this week had names she'd arrived at without conscious thought: Verenthis, for the headland city with the great lighthouse; Callow Bay, for the fishing settlement tucked into the crook of the southern peninsula; and simply the Mouth, for the vast harbour that dominated the western coast and whose waters she had rendered in graduated blue-grey washes so many times she'd worn a groove in the paper with her brush.\n\nShe told herself she was simply naming geographic features, the same as any cartographer assigned to a new commission. She told herself the names were arbitrary.\n\nThen a merchant arrived at her door — a red-faced, bewildered man named Aldous who apologised three times before he'd even sat down — and spread his own notes across her drafting table with shaking hands. He had been trying to establish a new shipping lane south of the Warden Straits. His pilot had found, three weeks prior, a headland with a lighthouse that the locals called Verenthi.\n\nThe merchant's accent dropped the final syllable. But Mira heard it clearly enough.\n\n"The lighthouse," she said carefully. "What colour is the beam?"\n\n"Green," said Aldous. "Strangest thing. Green as sea-glass."\n\nMira looked at her map. At the lighthouse she had drawn two weeks ago and annotated, in a moment of idle fancy, with the note: *the green light that guides the fishermen home.*\n\nShe had not invented that detail. She had simply known it.`,
      },
    ],
  },
  {
    title: 'Signal Decay',
    description: 'The last generation ship in a dying fleet receives a transmission that should be impossible — a message from Earth, 300 years after Earth went silent.',
    genre: 'Science Fiction',
    authorUsername: 'MarcusThorn',
    status: 'completed',
    coverColor: '#1d4ed8',
    tags: 'space,first-contact,mystery',
    chapters: [
      {
        title: 'The Impossible Frequency',
        content: `The signal came in on the funeral band.\n\nThat was what Commander Reyes noticed first — not the content, not even the fact of the transmission itself, but the carrier frequency. 435.7 megahertz, the frequency reserved by every spacefaring civilisation in the diaspora fleet for one purpose: to announce the death of a vessel. It was a practical matter of engineering as much as protocol. The frequency cut through interference cleanly, carried well across vast distances, and every communications array in the fleet was permanently tuned to receive it whether the operator wanted to or not.\n\nReyes had heard it eleven times in her thirty-two years aboard the *Continuance*. Eleven funerals conducted over static. Eleven ships that had gone dark between one watch rotation and the next. She had stopped flinching at the sound of 435.7 megahertz. It was simply the frequency of endings.\n\nWhich was why the message made no sense at all.\n\n"Play it again," she said.\n\nCommunications Officer Patel complied without comment. The ship's bridge was quiet except for the ventilation hum and the soft cycling of the navigation displays. The rest of the night crew had stopped pretending to work. They were all listening.\n\nThe voice on the transmission was a woman's. Unhurried, clear, with an accent that took Reyes a moment to place — not because it was unusual, but because it was old. An accent from home. From the recordings she'd studied in school, from the historical archives of a planet she'd never seen.\n\n*To any vessel receiving this transmission,* the voice said. *This is the Emergency Continuity Station, transmitting from Earth, Central Archive Network, timestamp unverified. We are alive. We don't know if anyone is left to hear this. If you are receiving this, please respond. We are alive. We are still here. Please come home.*\n\nEarth had been silent for three hundred and twelve years.\n\nReyes looked at Patel. Patel looked at the console. Neither of them said anything for a very long time.`,
      },
      {
        title: 'The Arithmetic of Hope',
        content: `The fleet council convened in the cramped conference room aboard the *Continuance*, seven commanders in various states of exhaustion and disbelief, with the transmission playing softly from the wall speakers as if repetition might eventually make it make sense.\n\nCommander Aldridge from the *Patience* spoke first. He was the eldest of them — seventy-nine, born in the third generation after departure, old enough to have known people who had known people who remembered Earth as a real place rather than a curriculum topic. "The signal delay analysis puts the origin point at Sol," he said. "There's no ambiguity in the triangulation. It came from Earth."\n\n"Or something near Earth," said Dr. Vasquez, the fleet's senior communications engineer, who had brought three tablets' worth of analysis to the meeting and looked like she hadn't slept since the signal arrived. "The frequency shift is consistent with a surface transmission or low-orbit station. It's not a relay from another vessel. Whatever sent this is either on Earth or very close to it."\n\n"Then Earth is not dead," said Commander Park.\n\n"Earth went quiet," Reyes corrected carefully. "We assumed that meant dead. We named the frequency of that assumption. We have been mourning for three centuries based on silence." She paused. "Silence is not the same as death."\n\nAldridge was quiet for a long moment. Outside the viewport, the stars moved almost imperceptibly — the fleet's slow drift through the dark, a journey that had begun before any of them were born and that none of them had ever expected to reverse.\n\n"What's the transit time?" he asked finally.\n\nVasquez pulled up the calculation she'd already run six times to make sure it was correct. "At our current velocity and bearing, with full thrust — everything we have — we could be back in Sol system in approximately forty-one years."\n\nForty-one years. The room absorbed this in silence.\n\n"We would not live to arrive," said Commander Park.\n\n"No," said Reyes. "But our children would."`,
      },
      {
        title: 'The Vote',
        content: `The vote was not close.\n\nReyes had expected resistance. She had prepared arguments, marshalled data, drafted the kind of careful presentation that might move a room of practical people toward an impractical decision. She had spent two days on it — two days in which the signal played on loop in her quarters as she worked, the woman's voice from Earth filling the small space with its three-hundred-year-old urgency.\n\nBut when she presented the proposal to the fleet population — not the council, the full population, every man and woman and child aboard all seven vessels, transmitted simultaneously through every screen and speaker in the diaspora — she found that no arguments were needed.\n\nThe response came in over six hours. Not the careful deliberation she'd anticipated. Not the risk analysis, the resource calculations, the heated debate about duty to the living versus obligation to the dead. Just people, across seven ships, pressing their consent through terminals and voting stations and — when those were occupied — writing their names on slips of actual paper and pressing them to the collection points like something from a century before digital records.\n\n91.3% in favour of turning around.\n\nThe dissenters were not angry. Many of them voted no and then signed the paper lists anyway. One woman, interviewed in the corridor outside the voting station on the *Mercy*, put it simply: "I voted against because I'm scared. But I signed the list because I know the answer."\n\nReyes sat with the numbers for a long time after the count closed. 91.3%. Three generations of drift, three centuries of silence, a journey none of the living had chosen — and when given the choice, nine out of ten of them chose to go back toward something that might not even be there anymore.\n\nHer own grandmother, who had been born on this ship and died on this ship, had once told her that hope was not an emotion. It was a calculation. You ran the numbers, you estimated the probabilities, and if the expected value came out positive, you called the result hope and you acted on it.\n\nReyes had always found that cold. Now she understood. The calculation was what made it real. The calculation was what made it brave.`,
      },
    ],
  },
  {
    title: 'The Apothecary of Uncertain Hours',
    description: 'A young apprentice discovers her master\'s shop sells more than remedies — it trades in lost hours, forgotten memories, and time that belongs to someone else.',
    genre: 'Fantasy',
    authorUsername: 'LilyMoon',
    status: 'ongoing',
    coverColor: '#059669',
    tags: 'magic,time,whimsy',
    chapters: [
      {
        title: 'What the Jars Contain',
        content: `The first thing Petra noticed about the Apothecary of Uncertain Hours was that it smelled wrong for a medicine shop.\n\nMost apothecaries smelled of sharp, purposeful things — vinegar and camphor, pine resin, the dry dusty smell of powdered herbs that had been catalogued and measured and stripped of any romance. The shop on Candle Street smelled different. It smelled of winter mornings and Tuesday afternoons and the particular heavy sweetness that precedes a thunderstorm. It smelled of things she couldn't quite name, only recognise — the smell of being seven years old, the smell of a decision not yet made, the smell of goodbye.\n\nShe stood in the doorway for a moment before entering, partly because the smell required adjustment and partly because she wanted to look at the jars.\n\nThere were hundreds of them. They lined every wall from floor to ceiling, arranged on shelves of dark honey-coloured wood, each one sealed with red wax and labelled in a careful slanted hand. Some held what looked like ordinary things — dried flowers, amber-coloured liquids, fine powders in various shades of grey and green. But others held things that shouldn't fit in jars. A small light that moved in slow circles, like a bored firefly. Something that looked like folded blue fabric but shifted when she turned her head. One jar near the door appeared to contain a sound — she could feel rather than hear it, a low resonance that settled in her back teeth.\n\n"The sound is a Wednesday in 1887," said a voice.\n\nPetra turned. The woman behind the counter was small and ancient and thoroughly alert, with bright eyes the colour of a compass needle and silver hair piled in a structure of improbable complexity. She was weighing something on a brass scale — something weightless, from the looks of it — and did not look up as she spoke.\n\n"A specific Wednesday?" Petra asked.\n\n"All Wednesdays are specific," said the woman. "That's what makes them Wednesdays. You're the girl from the apprenticeship board. Sit down. We'll see if you're suitable."`,
      },
      {
        title: 'The Customer Who Lost a Year',
        content: `The first customer of Petra's apprenticeship arrived the following Tuesday, which the apothecary — whose name, Petra had learned, was Thessaly Vorn — considered an auspicious day for difficult cases.\n\n"Tuesday is the day of small recoveries," Thessaly said, setting out the consultation ledger with the care of someone laying a table for an important dinner. "Not cures. Not transformations. Small recoveries. An hour retrieved from a river. A season found folded inside a coat lining. On Tuesdays, I can help people."\n\nThe customer's name was Arden. He was perhaps thirty, with the look of someone who had not been thirty for quite as long as he should have been — he moved like a man who had recently discovered that certain things he used to do without thinking now required deliberate effort. He sat in the consultation chair and turned his hat in his hands and explained that he had lost a year.\n\n"Not misplaced," he said carefully, as if he'd had to explain this distinction many times before and had learned to address it immediately. "Not forgotten. Lost. I went to sleep on my thirty-first birthday, and when I woke, it was my thirty-second, and everything that should have happened in between — it simply wasn't there. Not the memories. The year itself. I checked. The people who should have been in my life during that time don't remember me from those months. I found my appointment book from what should have been that year, and every page was blank. It isn't that I've forgotten. The year didn't happen to me."\n\nThessaly listened to all of this without interruption, which Petra was learning to recognise as a sign that she was taking something seriously. She reached under the counter and produced a small instrument like a pocket watch, but with too many hands and a face marked not with numbers but with symbols Petra didn't recognise.\n\n"The year isn't lost," Thessaly said, consulting the instrument. "It's been borrowed." She looked up at Arden with an expression of professional sympathy. "The question is whether you want it back, and if so, whether you're prepared for everything it contains."`,
      },
    ],
  },
  {
    title: 'Seventeen Seconds',
    description: 'A forensic analyst discovers she has exactly seventeen seconds of footage from the night a senator was murdered — and someone very dangerous wants her to lose it.',
    genre: 'Thriller',
    authorUsername: 'RavenBlack',
    status: 'ongoing',
    coverColor: '#1e1b4b',
    tags: 'thriller,conspiracy,forensics',
    chapters: [
      {
        title: 'The Gap in the File',
        content: `The footage should have been twenty-two minutes long.\n\nKira had checked the metadata three times, the way she always did when something didn't add up — once to see it, once to confirm it, and a third time to make absolutely sure she wasn't making the kind of mistake that would end her career. The camera in the hotel corridor on the fourth floor of the Meridian Grand had been recording continuously from 11:47 PM to 12:09 AM. The file said so. The header said so. The timestamp embedded in every frame said so.\n\nBut between 12:01:07 and 12:01:24, seventeen seconds of footage had been removed so cleanly that if she hadn't been running the file through the integrity analyser — standard procedure, nothing special, something she did to every file in every case — she would never have known it was gone.\n\nShe sat very still for a moment.\n\nSenator Harwick had been found dead in his suite on the fourth floor at 12:06 AM. The coroner put the time of death between midnight and 12:03. The corridor camera covered the only route to his suite from the elevators.\n\nSeventeen seconds.\n\n"Hey, Chen." Her colleague Marcus leaned over the partition. "You look like you found something."\n\n"I found a gap," she said carefully.\n\n"How big?"\n\n"Seventeen seconds." She looked at her screen, then back at Marcus. "But the interesting thing isn't the gap. The interesting thing is how clean it is. This wasn't taped over or recorded-to. This was surgically removed from the file by someone who knew exactly what they were doing."\n\nMarcus was quiet for a moment. "The Harwick case?"\n\n"The Harwick case."\n\n"Kira." He lowered his voice. "Be very careful what you do with that."\n\nShe looked at him — his expression, which she had read correctly for nine years and was reading correctly now: this was not concern for her career. This was fear.`,
      },
      {
        title: 'The Man Who Knew About the Gap',
        content: `She didn't tell her supervisor. She had planned to — had even opened his office door, the report folder in her hands, the words lined up in her head. Then she had seen the phone on his desk, the way he'd covered the receiver when she entered, and something she couldn't quite articulate had made her say "sorry, wrong door" and back out into the corridor.\n\nInstead she went home and spread the metadata on her kitchen table and spent four hours studying a seventeen-second deletion.\n\nThe technique was not standard. She had worked in digital forensics for twelve years and had seen every flavour of footage tampering — crude overwrites, clumsy format conversions meant to discard frames, the kind of amateur splice that left digital seams visible to anyone with the right software. What had been done to this file was different. It was professional. Whoever had removed those seventeen seconds had done it in a way that left the file's internal clock intact, left the surrounding footage undamaged, and would have been completely invisible without the integrity layer she ran as a matter of personal habit.\n\nPersonal habit. Not standard procedure. Just something she did.\n\nAt midnight, her phone rang. Withheld number. She almost didn't answer.\n\n"You found the gap in the Harwick footage," said the voice. Male, middle-aged, accent she couldn't place with precision — somewhere in the mid-Atlantic, cultivated to be regionless. The voice of someone who had worked very hard to belong nowhere in particular. "Don't submit the report."\n\n"Who is this?"\n\n"Someone who is telling you, for your benefit more than mine, that the Harwick case is not a forensics problem. It is a political problem. And people who treat political problems as forensics problems tend to create a different kind of forensics problem. Do you understand what I'm telling you?"\n\nKira looked at the metadata spread across her table. Seventeen clean seconds. A perfect silence where a senator's last movements should have been.\n\n"I understand exactly what you're telling me," she said. "I'm not going to do it."`,
      },
    ],
  },
  {
    title: 'The Silk Road Inheritance',
    description: 'When a historian inherits her grandmother\'s estate, she discovers letters that implicate their family in one of the most audacious thefts of the medieval Silk Road.',
    genre: 'Historical Fiction',
    authorUsername: 'JadeWillow',
    status: 'completed',
    coverColor: '#92400e',
    tags: 'history,mystery,family',
    chapters: [
      {
        title: 'The Cedar Chest',
        content: `The letters were in Arabic.\n\nThis should not have surprised Professor Maren Ashby, given that her grandmother had spent forty years as a specialist in medieval Islamic trade networks and had collected, over the course of a long and acquisitive career, approximately fourteen thousand objects, documents, and artefacts that had required three full days and a team of twelve archivists to catalogue after her death. Of course some of them were in Arabic.\n\nBut these were in Arabic and they were hidden.\n\nNot hidden in the sense of being stored in a locked cabinet or marked with a confidential notation — her grandmother had been too sophisticated for such obvious concealment. Hidden in the sense of being tucked inside the lining of a cedar chest that had been filled with what appeared to be household linens, buried under an estate inventory note describing it as "MISC TEXTILES (laundry)," and placed in the corner of a storage room in a house whose entire ground floor was devoted to scholarly material of obvious significance.\n\nMaren had only found them because one of the archivists, a conscientious graduate student named Dmitri, had decided that the cedar smell warranted closer examination of the chest, and had found a slight irregularity in the lining that — when investigated with the care of someone trained to treat every surface as potentially significant — yielded a sealed packet of papers wrapped in oilskin.\n\nThe papers were old. Not antiquarian-old — not the centuries-old documents her grandmother had studied professionally — but old in the sense of being aged and deliberately preserved. Perhaps a century. Perhaps a century and a half. Written, and hidden, within living generational memory.\n\n"Can you read them?" Dmitri asked.\n\n"Yes," said Maren, who had spent ten years studying medieval Arabic trade documents under a woman who had apparently been keeping a rather significant secret. "I can read them."`,
      },
      {
        title: 'What Was Taken',
        content: `The first letter was from someone identified only as "your cousin in Kashgar," addressed to a woman named Rahel Stein, dated — after careful analysis of the paper and the postal notation — to approximately 1887.\n\nMaren read it once quickly, the way you read something when you're afraid of what it might say. Then she read it again slowly, translating in her head with the particular care she gave to documents where precision mattered. Then she sat very still at her grandmother's desk — her desk now, technically, though it would take years before it stopped feeling like trespass — and stared at the far wall for a long moment.\n\nThe letter described a transaction. A sale, conducted in Kashgar in the summer of 1886, of a collection of manuscripts that the seller — Rahel Stein, apparently — had acquired from a monastery in the Taklamakan whose monks, the letter noted with an uncomfortable casualness, had not been entirely willing participants in the acquisition.\n\n*You will understand,* the cousin had written, *that the monks were given fair compensation for their time and inconvenience. You will also understand that what was taken was taken because it needed to be preserved, and that the alternative was its destruction by those who would not have treated it with the care it deserved. This is the story we tell ourselves. I have found, over time, that it is both true and insufficient, and that the discomfort of holding both of these things simultaneously is simply part of what it means to have done it.*\n\nMaren set the letter down.\n\nHer grandmother had built an entire career on the ethics of cultural patrimony. Had testified before parliament on the repatriation of looted artefacts. Had written three books on the moral obligations of institutions that held collections acquired under colonial conditions.\n\nMaren picked up the next letter. There were sixteen more.`,
      },
    ],
  },
  {
    title: 'The Drowned Compass',
    description: 'A salvage diver discovers a compass at the bottom of a lake that points not north, but toward something terrible that happened there decades ago.',
    genre: 'Mystery',
    authorUsername: 'OwenStorm',
    status: 'ongoing',
    coverColor: '#0f766e',
    tags: 'mystery,horror,diving',
    chapters: [
      {
        title: 'Forty Feet Down',
        content: `The compass was not supposed to be there.\n\nThat was the first thing Cal noticed when she brought it up — not the obvious strangeness of it, not the fact that the needle was spinning slowly in a way no compass needle should spin, not even the cold that seemed to emanate from the brass casing like something alive. Just the basic fact of its presence. She had dived the Orrick Lake wreck site fourteen times. She knew its inventory as well as she knew her own equipment room. The compass had not been there before.\n\nShe turned it over in her gloved hand, treading water twenty feet from the dive platform, and watched the needle continue its slow rotation. Clockwise. Even, unhurried, like a clock. Like something counting.\n\nHer dive partner Marco pulled himself onto the platform above her. "What've you got?"\n\n"Compass."\n\n"From the wreck?"\n\n"Couldn't have been. Wrong era — this is Victorian-era brass work, and the *Delilah* went down in 1972." She lifted it for him to see. The needle kept spinning. "And it shouldn't be doing that."\n\nMarco looked at it with the expression he used for things that were either fascinating or deeply concerning — an expression that covered considerable range in this job. "Maybe it's magnetised wrong. Maybe there's metal interference down there you haven't found yet."\n\n"I had my own compass with me. Working fine the whole dive." She pulled herself onto the platform and held the Victorian compass flat on her palm. North was clearly marked on the face with an elaborately engraved fleur-de-lis. The needle was not pointing to it. The needle was pointing — after its slow rotation, after its patient, rhythmic turning — always back to a point roughly twenty degrees east of north.\n\nToward the deepest part of the lake. Toward the part that pre-dated the wreck by sixty years. Toward the part of Orrick Lake that the old maps simply labelled, without further explanation, *The Drowned Town.*`,
      },
    ],
  },
  {
    title: 'Every Wrong Reason',
    description: 'Two architects competing for the same commission keep ending up in the same places — and the same arguments. Falling in love was definitely not in the brief.',
    genre: 'Romance',
    authorUsername: 'CassandraFire',
    status: 'ongoing',
    coverColor: '#be185d',
    tags: 'romance,slow-burn,rivals',
    chapters: [
      {
        title: 'The Wrong Presentation Room',
        content: `Nadia had rehearsed the presentation forty-seven times. She knew this precisely because she had marked each rehearsal in a small notebook she kept beside her laptop, a habit her therapist called "a slightly concerning relationship with quantification" and she called "knowing exactly where you stand."\n\nForty-seven rehearsals. The slides were clean. The model was perfect — laser-cut balsa wood and the kind of carefully considered material samples that could withstand the examination of the Ardmore Foundation's notoriously detail-oriented selection committee. She had arrived twenty minutes early. She had confirmed the room twice with the facilities desk.\n\nWhich was why it was so particularly irritating to open the door of Conference Room B at nine fifty-eight and find it already occupied.\n\nThe occupant was tall, annoyingly so, with the kind of presentation posture that suggested someone who had also rehearsed considerably and had perhaps fewer neuroses about it. His model was on the table — a different interpretation of the Ardmore site, she noted automatically, more vertical where hers was horizontal, more glass where hers favoured concrete and green space. He was adjusting something on his laptop and did not immediately look up.\n\n"This room is booked for ten o'clock," Nadia said.\n\n"I know. I booked it." He looked up then. Somewhere between thirty and thirty-five, dark eyes currently arranged in an expression that matched hers precisely: the expression of someone who had prepared for every possible complication except this exact one. "I confirmed it twice this morning."\n\n"So did I."\n\nThey regarded each other across the table.\n\n"Nadia Osei, Osei Design Group," she said.\n\n"Eli Rourke, Meridian Architecture." A pause. "You're pitching the Ardmore commission."\n\n"You're pitching the Ardmore commission." It wasn't a question. She looked at his model. He looked at hers. The morning light came through the conference room windows at a perfectly impartial angle, illuminating two completely different answers to the same problem. "I booked this room."\n\n"So did I." He tilted his head slightly. "I wonder which of us is wrong."\n\n"Based on available evidence," Nadia said, "both of us. Which I find completely unacceptable."`,
      },
      {
        title: 'Site Visit Protocol',
        content: `The Ardmore Foundation had, in its infinite administrative wisdom, scheduled both shortlisted candidates for a site visit on the same afternoon.\n\nThis fact was delivered to Nadia by email at seven forty-five in the morning, in a message that also contained the phrase "we hope you'll see this as an opportunity for collegial exchange of ideas" and a map attachment of the Ardmore site that she'd already memorised.\n\nShe showed the email to her colleague Priya, who made a sound that could charitably be described as a laugh.\n\n"Collegial," Priya repeated. "That's one word for it."\n\n"He had a good model," Nadia admitted, which was the kind of thing she could only say to Priya, who had known her for eight years and understood that professional honesty did not preclude competitive intent.\n\n"What's his approach?"\n\n"Vertical. Heavy on glazing. Landmark-focused — he's designing for the skyline view, which is compelling but ignores the fact that seventy percent of the site's users will be approaching from street level." She pulled up her own plans. "I'm working with the existing grade and the mature tree line. Less dramatic from a distance, but the experience inside the spaces is—"\n\n"You've already thought about how to counter his argument."\n\n"I've thought about the merits of different approaches to the problem."\n\nPriya looked at her with the expression that meant she was deciding not to say something. "Try to be collegial."\n\nThe site visit began at two o'clock. Eli Rourke arrived at one fifty-eight, which Nadia noted with the part of her brain that noticed everything. He had a different notebook than the last time — larger, with what looked like extensive sketching visible on the open page. He looked at her materials and then at her with the particular expression she was beginning to identify as his version of taking something seriously.\n\n"How do you want to do this?" he asked.\n\n"I assume we each need to see it independently."\n\n"Probably." He looked at the site, then back at her. "Though two sets of eyes sometimes catch things one set misses."\n\nNadia considered this. "That's a reasonable observation dressed up as an olive branch."\n\n"It's both," he said. "I'm allowed to be strategic about my olive branches."\n\nShe almost smiled. She turned it into a nod instead, which was safer.`,
      },
    ],
  },
  {
    title: 'The Architecture of Grief',
    description: 'A renowned architect loses his wife and finds himself designing her memorial — a commission he never agreed to and cannot refuse, in a city that holds every memory.',
    genre: 'Literary Fiction',
    authorUsername: 'TheodorePen',
    status: 'ongoing',
    coverColor: '#4c1d95',
    tags: 'grief,literary,architecture',
    chapters: [
      {
        title: 'The Commission',
        content: `The letter arrived on a Thursday, which seemed right. Grief, in his experience — and by now he had more experience with grief than any person requires — had a particular relationship with Thursdays: not the acute grief of Mondays, when the week's demands require you to function and the gap in your functioning becomes visible, nor the exhausted grief of Sundays, when the silence has nowhere left to go. Thursday grief was a different species. Quiet, capacious, arriving without announcement. Thursday grief was the kind that sat in the kitchen with you while the coffee went cold.\n\nThe letter was from the city. It was requesting — the language was carefully chosen; this was a request, not a commission, and the distinction was doing considerable diplomatic work — that he consider designing a public memorial to his wife. The site had been selected. The funding was secured. The timeline was generous, as timelines go: two years from groundbreaking. They would, of course, understand if he declined. They had considered other architects. None felt right.\n\nHe read the letter twice, as he had read everything twice in the fourteen months since Eleanor's death — once to absorb the content and once to check whether he had misunderstood it, a habit born from the way grief had made him unreliable at first reading. He had missed entire paragraphs of documents in the weeks immediately after. He had arrived at meetings for which he'd forgotten the purpose. He had designed, in an unhinged two-week sprint that his colleagues had watched with a combination of alarm and professional reverence, three buildings that could not be built — structurally sound, aesthetically coherent, and completely impossible to occupy without losing your mind, because the spaces were designed, though he hadn't known it at the time, not for people but for a single person who was no longer alive.\n\nHis assistant had quietly shelved all three projects. He hadn't asked her to. She had simply done it, with the practical compassion of someone who understood what he was making and why it needed to stop.\n\nNow the city wanted him to do it properly.`,
      },
      {
        title: 'Negative Space',
        content: `In architecture school, he had learned the concept of negative space from a professor who had the gift of explaining things in ways that appeared simple and revealed themselves, over time, to be inexhaustible. The negative space of a building was not the absence of building. It was the space that the building created by existing — the air between columns, the shadow thrown across a courtyard, the view that a window framed not by what it showed but by what it excluded. A great building, the professor had said, was as much defined by what it didn't contain as by what it did.\n\nMartin had spent thirty years applying this principle to public spaces, civic buildings, transit hubs — all the large-scale choreography of how people moved through shared environments. He had been good at it, if good was the word for something that had felt less like skill and more like perception: a sense of where the air needed to go, where the light needed to fall, what the empty space between two walls was quietly saying to anyone who stood inside it.\n\nHe had not known, when he learned it, that negative space was also the correct description for grief.\n\nEleanor had not been defined by absence while she lived, obviously. She had been defined by a great many things that were emphatically present: her opinions about brutalism, which were strong and frequently expressed; her habit of reading three books simultaneously and tracking all three plots without apparent effort; the particular quality of attention she brought to other people, which had the effect of making them feel simultaneously seen and inclined toward honesty. She had taken up space — physical, conversational, emotional — with the comfortable assurance of someone who had never once questioned her right to be there.\n\nAnd now the space she had occupied was empty, and the emptiness had a shape, and the shape was hers exactly, and every room he walked into he felt its outline.\n\nThis, he thought, was the memorial he had actually been asked to build. Not a garden or a tower or a symbolic fountain. A way for other people to feel the specific shape of what was gone.`,
      },
    ],
  },
]

async function main() {
  console.log('Seeding database...')

  // Create all authors
  const createdUsers: Record<string, number> = {}

  for (const author of AUTHORS) {
    const user = await prisma.user.upsert({
      where: { email: author.email },
      update: {},
      create: {
        username: author.username,
        email: author.email,
        passwordHash: hashPassword('demo1234'),
        avatarColor: author.avatarColor,
        bio: author.bio,
      },
    })
    createdUsers[author.username] = user.id
    console.log(`Created user: ${author.username}`)
  }

  // Create Demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@storyforge.app' },
    update: {},
    create: {
      username: 'DemoUser',
      email: 'demo@storyforge.app',
      passwordHash: hashPassword('demo1234'),
      avatarColor: '#10b981',
      bio: 'Just here to explore stories!',
    },
  })
  createdUsers['DemoUser'] = demoUser.id
  console.log('Created DemoUser')

  // Create stories and chapters
  const createdStories: number[] = []

  for (const storyData of STORIES_DATA) {
    const authorId = createdUsers[storyData.authorUsername]
    const story = await prisma.story.create({
      data: {
        title: storyData.title,
        description: storyData.description,
        genre: storyData.genre,
        authorId,
        status: storyData.status,
        coverColor: storyData.coverColor,
        tags: storyData.tags,
      },
    })

    // Add author as collaborator
    await prisma.storyCollaborator.create({
      data: { storyId: story.id, userId: authorId, role: 'author' },
    })

    // Create chapters
    for (let i = 0; i < storyData.chapters.length; i++) {
      await prisma.chapter.create({
        data: {
          storyId: story.id,
          title: storyData.chapters[i].title,
          content: storyData.chapters[i].content,
          chapterOrder: i + 1,
          authorId,
        },
      })
    }

    createdStories.push(story.id)
    console.log(`Created story: ${storyData.title}`)
  }

  // Add follows (each author follows 2 others)
  const userIds = Object.values(createdUsers).filter(id => id !== demoUser.id)
  const followPairs = [
    [0, 1], [0, 2],
    [1, 2], [1, 3],
    [2, 3], [2, 4],
    [3, 4], [3, 5],
    [4, 5], [4, 6],
    [5, 6], [5, 7],
    [6, 7], [6, 0],
    [7, 0], [7, 1],
  ]

  for (const [fi, ti] of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userIds[fi], followingId: userIds[ti] } },
      update: {},
      create: { followerId: userIds[fi], followingId: userIds[ti] },
    })
  }
  console.log('Created follows')

  // Add ratings (each story rated by 3-7 random users, weighted toward 4-5)
  const allUserIds = Object.values(createdUsers)
  const ratingWeights = [4, 4, 5, 5, 5, 4, 3] // weighted toward 4-5

  for (let si = 0; si < createdStories.length; si++) {
    const storyId = createdStories[si]
    const numRatings = 3 + (si % 5)
    const raters = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, numRatings)
    for (const userId of raters) {
      const rating = ratingWeights[Math.floor(Math.random() * ratingWeights.length)]
      await prisma.rating.upsert({
        where: { userId_storyId: { userId, storyId } },
        update: {},
        create: { userId, storyId, rating },
      })
    }
  }
  console.log('Created ratings')

  // Add reactions on chapters
  const reactionTypes = ['like', 'love', 'fire', 'wow', 'sad']
  const chapters = await prisma.chapter.findMany()

  for (const chapter of chapters) {
    const numReactions = 1 + (chapter.id % 4)
    const reactors = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, numReactions)
    for (const userId of reactors) {
      const rt = reactionTypes[Math.floor(Math.random() * 3)] // bias toward like/love/fire
      await prisma.reaction.upsert({
        where: { userId_targetType_targetId: { userId, targetType: 'chapter', targetId: chapter.id } },
        update: {},
        create: { userId, targetType: 'chapter', targetId: chapter.id, reactionType: rt },
      })
    }
  }
  console.log('Created reactions')

  // Add comments
  const commentMessages = [
    'Absolutely captivating! I couldn\'t stop reading.',
    'The writing style is incredible — every sentence feels earned.',
    'Can\'t wait for the next chapter!',
    'This gave me chills. Masterfully done.',
    'The world-building here is phenomenal.',
    'I love how complex the characters are.',
    'This is exactly the kind of story I\'ve been looking for.',
  ]

  for (const chapter of chapters) {
    const numComments = 1 + (chapter.id % 3)
    const commenters = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, numComments)
    for (const userId of commenters) {
      await prisma.comment.create({
        data: {
          userId,
          chapterId: chapter.id,
          storyId: chapter.storyId,
          content: commentMessages[Math.floor(Math.random() * commentMessages.length)],
        },
      })
    }
  }
  console.log('Created comments')

  // Add reading list entries
  const readingStatuses = ['want_to_read', 'reading', 'completed']
  for (const userId of allUserIds) {
    const numEntries = 2 + (userId % 4)
    const selectedStories = [...createdStories].sort(() => Math.random() - 0.5).slice(0, numEntries)
    for (const storyId of selectedStories) {
      const status = readingStatuses[Math.floor(Math.random() * readingStatuses.length)]
      await prisma.readingList.upsert({
        where: { userId_storyId: { userId, storyId } },
        update: {},
        create: { userId, storyId, status },
      })
    }
  }
  console.log('Created reading list entries')

  console.log('Seeding complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
