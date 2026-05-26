-- ============================================================
-- Migration 002 — Add Mind Field game
-- Run in Supabase SQL editor AFTER 001_initial.sql
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

begin;

-- ── 1. Drop the hard-coded game check constraints ─────────────────────────
-- Removed so adding future games requires no schema migration.

alter table word_packs drop constraint if exists word_packs_game_check;
alter table rooms      drop constraint if exists rooms_game_check;

-- ── 2. Word packs + words for Mind Field ──────────────────────────────────
-- Each pack needs ≥ 25 words (game draws 25 per round).
-- word_b is NULL — Mind Field uses single words only (word_a).

-- General ─────────────────────────────────────────────────────────────────
do $$ declare p uuid; begin
  insert into word_packs (game, name, category, emoji, description, is_active)
  values ('mindfield', 'General', 'general', '🎯', 'Mixed everyday words', true)
  returning id into p;

  insert into words (pack_id, word_a, word_b, difficulty) values
    (p, 'Mountain',      null, 2), (p, 'River',         null, 1),
    (p, 'Bridge',        null, 1), (p, 'Mirror',        null, 2),
    (p, 'Shadow',        null, 2), (p, 'Thunder',       null, 2),
    (p, 'Volcano',       null, 2), (p, 'Desert',        null, 1),
    (p, 'Jungle',        null, 1), (p, 'Ocean',         null, 1),
    (p, 'Lightning',     null, 2), (p, 'Rainbow',       null, 1),
    (p, 'Glacier',       null, 2), (p, 'Tornado',       null, 2),
    (p, 'Eclipse',       null, 2), (p, 'Horizon',       null, 2),
    (p, 'Labyrinth',     null, 3), (p, 'Mirage',        null, 3),
    (p, 'Oasis',         null, 2), (p, 'Avalanche',     null, 2),
    (p, 'Tsunami',       null, 2), (p, 'Earthquake',    null, 2),
    (p, 'Blizzard',      null, 2), (p, 'Monsoon',       null, 2),
    (p, 'Compass',       null, 2), (p, 'Lantern',       null, 1),
    (p, 'Anchor',        null, 2), (p, 'Telescope',     null, 2),
    (p, 'Pyramid',       null, 2), (p, 'Constellation', null, 3),
    (p, 'Comet',         null, 2), (p, 'Galaxy',        null, 2),
    (p, 'Meteor',        null, 2), (p, 'Nebula',        null, 3),
    (p, 'Sunrise',       null, 1), (p, 'Twilight',      null, 2),
    (p, 'Moonlight',     null, 1), (p, 'Waterfall',     null, 1),
    (p, 'Quicksand',     null, 2), (p, 'Whirlpool',     null, 3),
    (p, 'Diamond',       null, 1), (p, 'Feather',       null, 1),
    (p, 'Candle',        null, 1), (p, 'Castle',        null, 1),
    (p, 'Violin',        null, 2), (p, 'Treasure',      null, 1),
    (p, 'Phantom',       null, 3), (p, 'Legend',        null, 2),
    (p, 'Empire',        null, 2), (p, 'Riddle',        null, 2);
end $$;

-- Bollywood ───────────────────────────────────────────────────────────────
do $$ declare p uuid; begin
  insert into word_packs (game, name, category, emoji, description, is_active)
  values ('mindfield', 'Bollywood', 'entertainment', '🎬', 'Hindi cinema actors, directors & movies', true)
  returning id into p;

  insert into words (pack_id, word_a, word_b, difficulty) values
    (p, 'Shahrukh',     null, 1), (p, 'Amitabh',      null, 1),
    (p, 'Hrithik',      null, 1), (p, 'Salman',        null, 1),
    (p, 'Aamir',        null, 1), (p, 'Akshay',        null, 1),
    (p, 'Deepika',      null, 1), (p, 'Ranveer',       null, 1),
    (p, 'Ranbir',       null, 1), (p, 'Alia',          null, 1),
    (p, 'Priyanka',     null, 1), (p, 'Katrina',       null, 1),
    (p, 'Kareena',      null, 1), (p, 'Kajol',         null, 1),
    (p, 'Madhuri',      null, 1), (p, 'Rekha',         null, 1),
    (p, 'Taapsee',      null, 2), (p, 'Vidya',         null, 1),
    (p, 'Ayushmann',    null, 2), (p, 'Nawazuddin',    null, 2),
    (p, 'Irrfan',       null, 2), (p, 'Pankaj',        null, 2),
    (p, 'Shahid',       null, 1), (p, 'Vicky',         null, 2),
    (p, 'Kartik',       null, 2), (p, 'Janhvi',        null, 2),
    (p, 'Kangana',      null, 2), (p, 'Tabu',          null, 2),
    (p, 'Dangal',       null, 1), (p, 'Lagaan',        null, 1),
    (p, 'Raazi',        null, 2), (p, 'Pathaan',       null, 2),
    (p, 'Jawan',        null, 2), (p, 'Animal',        null, 2),
    (p, 'Stree',        null, 1), (p, 'Queen',         null, 1),
    (p, 'Barfi',        null, 2), (p, 'Rockstar',      null, 2),
    (p, 'Tamasha',      null, 2), (p, 'Dhoom',         null, 1),
    (p, 'Ghajini',      null, 2), (p, 'Krrish',        null, 2),
    (p, 'Dabangg',      null, 1), (p, 'Singham',       null, 1),
    (p, 'Tumbbad',      null, 3), (p, 'Lootera',       null, 3),
    (p, 'Brahmastra',   null, 2), (p, 'Bhediya',       null, 2),
    (p, 'Karan',        null, 1), (p, 'Anurag',        null, 2);
end $$;

-- Cricket ─────────────────────────────────────────────────────────────────
do $$ declare p uuid; begin
  insert into word_packs (game, name, category, emoji, description, is_active)
  values ('mindfield', 'Cricket', 'sports', '🏏', 'Players, terms, tournaments', true)
  returning id into p;

  insert into words (pack_id, word_a, word_b, difficulty) values
    (p, 'Sachin',       null, 1), (p, 'Kohli',         null, 1),
    (p, 'Rohit',        null, 1), (p, 'Dhoni',         null, 1),
    (p, 'Ganguly',      null, 1), (p, 'Dravid',        null, 1),
    (p, 'Kumble',       null, 1), (p, 'Harbhajan',     null, 2),
    (p, 'Sehwag',       null, 1), (p, 'Yuvi',          null, 1),
    (p, 'Jadeja',       null, 2), (p, 'Bumrah',        null, 2),
    (p, 'Ashwin',       null, 2), (p, 'Hardik',        null, 2),
    (p, 'Pant',         null, 2), (p, 'Gill',          null, 2),
    (p, 'Kapil',        null, 1), (p, 'Warne',         null, 2),
    (p, 'McGrath',      null, 2), (p, 'Lara',          null, 2),
    (p, 'Ponting',      null, 2), (p, 'Botham',        null, 3),
    (p, 'Imran',        null, 2), (p, 'Wasim',         null, 2),
    (p, 'Boundary',     null, 1), (p, 'Wicket',        null, 1),
    (p, 'Maiden',       null, 2), (p, 'Yorker',        null, 2),
    (p, 'Bouncer',      null, 2), (p, 'Googly',        null, 2),
    (p, 'Doosra',       null, 3), (p, 'Flipper',       null, 3),
    (p, 'Slog',         null, 2), (p, 'Gully',         null, 2),
    (p, 'Slip',         null, 1), (p, 'Duck',          null, 1),
    (p, 'Century',      null, 1), (p, 'Powerplay',     null, 2),
    (p, 'DRS',          null, 2), (p, 'IPL',           null, 1),
    (p, 'Ashes',        null, 2), (p, 'Stump',         null, 1),
    (p, 'Crease',       null, 2), (p, 'Innings',       null, 1),
    (p, 'Follow-on',    null, 3), (p, 'Hat-trick',     null, 2),
    (p, 'LBW',          null, 2), (p, 'Mankad',        null, 3),
    (p, 'Over',         null, 1), (p, 'Fielder',       null, 1);
end $$;

-- Food ────────────────────────────────────────────────────────────────────
do $$ declare p uuid; begin
  insert into word_packs (game, name, category, emoji, description, is_active)
  values ('mindfield', 'Food', 'food', '🍛', 'Indian dishes, snacks and sweets', true)
  returning id into p;

  insert into words (pack_id, word_a, word_b, difficulty) values
    (p, 'Biryani',      null, 1), (p, 'Dosa',          null, 1),
    (p, 'Idli',         null, 1), (p, 'Vada',          null, 1),
    (p, 'Sambar',       null, 1), (p, 'Rasam',         null, 2),
    (p, 'Paratha',      null, 1), (p, 'Roti',          null, 1),
    (p, 'Naan',         null, 1), (p, 'Puri',          null, 1),
    (p, 'Paneer',       null, 1), (p, 'Tikka',         null, 1),
    (p, 'Kebab',        null, 1), (p, 'Tandoor',       null, 2),
    (p, 'Dal',          null, 1), (p, 'Kadhi',         null, 2),
    (p, 'Pulao',        null, 2), (p, 'Khichdi',       null, 2),
    (p, 'Upma',         null, 2), (p, 'Poha',          null, 2),
    (p, 'Halwa',        null, 1), (p, 'Kheer',         null, 1),
    (p, 'Gulab',        null, 2), (p, 'Jalebi',        null, 1),
    (p, 'Ladoo',        null, 1), (p, 'Barfi',         null, 1),
    (p, 'Peda',         null, 2), (p, 'Sandesh',       null, 3),
    (p, 'Dhokla',       null, 2), (p, 'Khandvi',       null, 3),
    (p, 'Chakli',       null, 3), (p, 'Murmure',       null, 2),
    (p, 'Bhujia',       null, 2), (p, 'Sev',           null, 2),
    (p, 'Papdi',        null, 2), (p, 'Golgappa',      null, 1),
    (p, 'Bhel',         null, 1), (p, 'Chaat',         null, 1),
    (p, 'Chole',        null, 1), (p, 'Aloo',          null, 1),
    (p, 'Tikki',        null, 2), (p, 'Chutney',       null, 1),
    (p, 'Pickle',       null, 1), (p, 'Raita',         null, 2),
    (p, 'Lassi',        null, 1), (p, 'Chai',          null, 1),
    (p, 'Filter',       null, 2), (p, 'Kulfi',         null, 1),
    (p, 'Payasam',      null, 2), (p, 'Modak',         null, 2);
end $$;

-- Hyderabad ───────────────────────────────────────────────────────────────
do $$ declare p uuid; begin
  insert into word_packs (game, name, category, emoji, description, is_active)
  values ('mindfield', 'Hyderabad', 'local', '🕌', 'City landmarks, culture and slang', true)
  returning id into p;

  insert into words (pack_id, word_a, word_b, difficulty) values
    (p, 'Charminar',    null, 1), (p, 'Golconda',      null, 1),
    (p, 'Hussainsagar', null, 1), (p, 'Ramoji',        null, 2),
    (p, 'Birla',        null, 2), (p, 'Banjara',       null, 2),
    (p, 'Jubilee',      null, 2), (p, 'Hitech',        null, 1),
    (p, 'Gachibowli',   null, 2), (p, 'Secunderabad',  null, 1),
    (p, 'Begumpet',     null, 2), (p, 'Ameerpet',      null, 2),
    (p, 'Dilsukhnagar', null, 2), (p, 'Uppal',         null, 2),
    (p, 'Kukatpally',   null, 2), (p, 'Madhapur',      null, 2),
    (p, 'Kondapur',     null, 2), (p, 'Miyapur',       null, 3),
    (p, 'Haleem',       null, 1), (p, 'Osmania',       null, 2),
    (p, 'Irani',        null, 2), (p, 'Biryani',       null, 1),
    (p, 'Mirchi',       null, 1), (p, 'Salan',         null, 2),
    (p, 'Paya',         null, 2), (p, 'Qubani',        null, 3),
    (p, 'Nizams',       null, 2), (p, 'Nawab',         null, 2),
    (p, 'Deccan',       null, 1), (p, 'Diga',          null, 2),
    (p, 'Enti',         null, 2), (p, 'Marre',         null, 3),
    (p, 'Nakko',        null, 2), (p, 'Kaiku',         null, 2),
    (p, 'Mana',         null, 2), (p, 'Chusto',        null, 3),
    (p, 'Baigan',       null, 2), (p, 'Sarkar',        null, 2),
    (p, 'Necklace',     null, 2), (p, 'Metro',         null, 1),
    (p, 'PVNR',         null, 3), (p, 'Tankbund',      null, 2),
    (p, 'Laadbazaar',   null, 2), (p, 'Abids',         null, 3),
    (p, 'Nampally',     null, 3), (p, 'Tolichowki',    null, 3),
    (p, 'Mehdipatnam',  null, 3), (p, 'Malakpet',      null, 3),
    (p, 'DRDL',         null, 3), (p, 'ISRO',          null, 2);
end $$;

-- College Life ────────────────────────────────────────────────────────────
do $$ declare p uuid; begin
  insert into word_packs (game, name, category, emoji, description, is_active)
  values ('mindfield', 'College Life', 'lifestyle', '🎓', 'Student life, campus and exams', true)
  returning id into p;

  insert into words (pack_id, word_a, word_b, difficulty) values
    (p, 'Attendance',   null, 1), (p, 'Proxy',         null, 1),
    (p, 'Bunking',      null, 1), (p, 'Canteen',       null, 1),
    (p, 'Hostel',       null, 1), (p, 'Mess',          null, 1),
    (p, 'Ragging',      null, 2), (p, 'Fresher',       null, 1),
    (p, 'Placement',    null, 2), (p, 'Internship',    null, 2),
    (p, 'Resume',       null, 1), (p, 'Interview',     null, 1),
    (p, 'Backlog',      null, 2), (p, 'Arrear',        null, 2),
    (p, 'Semester',     null, 1), (p, 'CGPA',          null, 2),
    (p, 'Viva',         null, 2), (p, 'Practical',     null, 2),
    (p, 'Deadline',     null, 2), (p, 'Submission',    null, 2),
    (p, 'Presentation', null, 2), (p, 'Project',       null, 1),
    (p, 'Assignment',   null, 1), (p, 'Exam',          null, 1),
    (p, 'Chit',         null, 2), (p, 'Copying',       null, 2),
    (p, 'Library',      null, 1), (p, 'Wifi',          null, 1),
    (p, 'Campus',       null, 1), (p, 'Fest',          null, 1),
    (p, 'Techfest',     null, 2), (p, 'Culturals',     null, 2),
    (p, 'Outing',       null, 1), (p, 'Seniors',       null, 1),
    (p, 'Juniors',      null, 1), (p, 'Batch',         null, 1),
    (p, 'Department',   null, 2), (p, 'Principal',     null, 2),
    (p, 'HOD',          null, 2), (p, 'Lecturer',      null, 2),
    (p, 'Revaluation',  null, 3), (p, 'Supplementary', null, 3),
    (p, 'GPA',          null, 2), (p, 'Credits',       null, 2),
    (p, 'Elective',     null, 3), (p, 'Stipend',       null, 3),
    (p, 'Startup',      null, 2), (p, 'Hackathon',     null, 2),
    (p, 'Nightout',     null, 1), (p, 'Grading',       null, 2);
end $$;

commit;
