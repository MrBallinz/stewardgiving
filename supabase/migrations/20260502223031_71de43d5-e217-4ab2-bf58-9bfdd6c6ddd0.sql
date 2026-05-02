
-- 1. Extension + columns
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS pastor_name text,
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

-- 2. Tighten source_type vocabulary (drop legacy 'manual_seed' values first)
UPDATE public.churches SET source_type = 'seeded' WHERE source_type = 'manual_seed';

ALTER TABLE public.churches
  DROP CONSTRAINT IF EXISTS churches_source_type_check;
ALTER TABLE public.churches
  ADD CONSTRAINT churches_source_type_check
  CHECK (source_type IN ('seeded','user_submitted','imported','partner'));

-- 3. Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS churches_legal_name_trgm
  ON public.churches USING GIN (legal_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS churches_dba_name_trgm
  ON public.churches USING GIN (dba_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS churches_pastor_trgm
  ON public.churches USING GIN (pastor_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS churches_aliases_gin
  ON public.churches USING GIN (aliases);

-- 4. Backfill pastor + aliases for well-known existing seeds
UPDATE public.churches SET pastor_name = 'Andy Stanley', aliases = ARRAY['North Point','NPCC'] WHERE legal_name = 'North Point Community Church';
UPDATE public.churches SET pastor_name = 'Joel Osteen', aliases = ARRAY['Lakewood'] WHERE legal_name = 'Lakewood Church';
UPDATE public.churches SET pastor_name = 'Steven Furtick', aliases = ARRAY['Elevation'] WHERE legal_name = 'Elevation Church';
UPDATE public.churches SET pastor_name = 'Louie Giglio', aliases = ARRAY['Passion City'] WHERE legal_name = 'Passion City Church';
UPDATE public.churches SET pastor_name = 'Todd Wagner', aliases = ARRAY['Watermark'] WHERE legal_name = 'Watermark Community Church';
UPDATE public.churches SET pastor_name = 'Bill Johnson', aliases = ARRAY['Bethel Redding'] WHERE legal_name = 'Bethel Church';
UPDATE public.churches SET pastor_name = 'Matt Chandler', aliases = ARRAY['TVC','The Village'] WHERE legal_name = 'The Village Church';
UPDATE public.churches SET pastor_name = 'Craig Groeschel', aliases = ARRAY['LifeChurch','LifeChurch.tv'] WHERE legal_name = 'Life.Church';
UPDATE public.churches SET pastor_name = 'Chris Hodges', aliases = ARRAY['Highlands','COTH'] WHERE legal_name = 'Church of the Highlands';
UPDATE public.churches SET pastor_name = 'Brian Houston', aliases = ARRAY['Hillsong'] WHERE legal_name = 'Hillsong Church USA';
UPDATE public.churches SET pastor_name = 'Erwin McManus', aliases = ARRAY['Mosaic LA'] WHERE legal_name = 'Mosaic';
UPDATE public.churches SET pastor_name = 'Tim Keller (founder)', aliases = ARRAY['Redeemer NYC','Redeemer'] WHERE legal_name = 'Redeemer Presbyterian Church';
UPDATE public.churches SET pastor_name = 'Carter Conlon', aliases = ARRAY['TSC'] WHERE legal_name = 'Times Square Church';
UPDATE public.churches SET pastor_name = 'Ray Johnston', aliases = ARRAY['Bayside'] WHERE legal_name = 'Bayside Church';
UPDATE public.churches SET pastor_name = 'Eric Geiger', aliases = ARRAY['Mariners'] WHERE legal_name = 'Mariners Church';
UPDATE public.churches SET pastor_name = 'Brian Brodersen', aliases = ARRAY['Calvary CM','CCCM'] WHERE legal_name = 'Calvary Chapel Costa Mesa';
UPDATE public.churches SET pastor_name = 'Robert Morris', aliases = ARRAY['Gateway','GWP'] WHERE legal_name = 'Gateway Church';
UPDATE public.churches SET pastor_name = 'Jack Graham', aliases = ARRAY['Prestonwood'] WHERE legal_name = 'Prestonwood Baptist Church';
UPDATE public.churches SET pastor_name = 'Ed Young', aliases = ARRAY['Second Baptist Houston'] WHERE legal_name = 'Second Baptist Church';
UPDATE public.churches SET pastor_name = 'Ronnie Floyd', aliases = ARRAY['Cross'] WHERE legal_name = 'Cross Church';
UPDATE public.churches SET pastor_name = 'John MacArthur', aliases = ARRAY['Grace Community','GCC'] WHERE legal_name = 'Grace Community Church';
UPDATE public.churches SET pastor_name = 'Todd Mullins', aliases = ARRAY['CF','Christ Fellowship Florida'] WHERE legal_name = 'Christ Fellowship';
UPDATE public.churches SET pastor_name = 'Brad Cooper', aliases = ARRAY['NewSpring'] WHERE legal_name = 'NewSpring Church';
UPDATE public.churches SET pastor_name = 'Jason Strand', aliases = ARRAY['Eagle Brook','EBC'] WHERE legal_name = 'Eagle Brook Church';
UPDATE public.churches SET pastor_name = 'David Dummitt', aliases = ARRAY['Willow Creek','WCCC'] WHERE legal_name = 'Willow Creek Community Church';
UPDATE public.churches SET pastor_name = 'Greg Laurie', aliases = ARRAY['Harvest','HCF'] WHERE legal_name = 'Harvest Christian Fellowship';
UPDATE public.churches SET pastor_name = 'John Ortberg (former)', aliases = ARRAY['Menlo'] WHERE legal_name = 'Menlo Church';
UPDATE public.churches SET pastor_name = 'Tim Chaddick (founder)' WHERE legal_name = 'Reality LA';
UPDATE public.churches SET pastor_name = 'J.D. Greear', aliases = ARRAY['Summit','TheSummit'] WHERE legal_name = 'Summit Church';
UPDATE public.churches SET pastor_name = 'Rick Warren (founder)', aliases = ARRAY['Saddleback'] WHERE legal_name = 'Saddleback Valley Community Church';

-- 5. Expand seed with more well-known churches (idempotent via NOT EXISTS)
INSERT INTO public.churches
  (legal_name, dba_name, city, state, denomination, website, giving_platform, giving_url,
   pastor_name, aliases, enrichment_status, source_type, verification_status)
SELECT * FROM (VALUES
  ('Lakepointe Church', NULL, 'Rockwall', 'TX', 'Southern Baptist', 'https://lakepointe.church', 'pushpay', 'https://lakepointe.church/give', 'Josh Howerton', ARRAY['Lakepointe'], 'seeded', 'seeded', 'unverified'),
  ('Churchome', NULL, 'Kirkland', 'WA', 'Non-denominational', 'https://churchome.org', 'pushpay', 'https://churchome.org/give', 'Judah Smith', ARRAY['City Church Seattle','Churchome Global'], 'seeded', 'seeded', 'unverified'),
  ('Transformation Church', NULL, 'Tulsa', 'OK', 'Non-denominational', 'https://transformchurch.us', 'pushpay', 'https://transformchurch.us/give', 'Michael Todd', ARRAY['TC Tulsa'], 'seeded', 'seeded', 'unverified'),
  ('Free Chapel', NULL, 'Gainesville', 'GA', 'Pentecostal', 'https://freechapel.org', 'pushpay', 'https://freechapel.org/give', 'Jentezen Franklin', ARRAY['Free Chapel Worship Center'], 'seeded', 'seeded', 'unverified'),
  ('Sandals Church', NULL, 'Riverside', 'CA', 'Non-denominational', 'https://sandalschurch.com', 'pushpay', 'https://sandalschurch.com/give', 'Matt Brown', ARRAY['Sandals'], 'seeded', 'seeded', 'unverified'),
  ('Crossroads Church', NULL, 'Cincinnati', 'OH', 'Non-denominational', 'https://crossroads.net', 'pushpay', 'https://crossroads.net/give', 'Brian Tome', ARRAY['Crossroads Cincinnati'], 'seeded', 'seeded', 'unverified'),
  ('Mars Hill Bible Church', NULL, 'Grandville', 'MI', 'Non-denominational', 'https://marshill.org', 'planning_center', 'https://marshill.org/give', 'Kent Dobson', ARRAY['Mars Hill Michigan'], 'seeded', 'seeded', 'unverified'),
  ('Brooklyn Tabernacle', NULL, 'Brooklyn', 'NY', 'Non-denominational', 'https://brooklyntabernacle.org', 'pushpay', 'https://brooklyntabernacle.org/give', 'Jim Cymbala', ARRAY['Tab','Brooklyn Tab'], 'seeded', 'seeded', 'unverified'),
  ('Christ Church Nashville', NULL, 'Nashville', 'TN', 'Non-denominational', 'https://christchurchnashville.org', 'pushpay', 'https://christchurchnashville.org/give', 'Dan Scott', ARRAY['CCN'], 'seeded', 'seeded', 'unverified'),
  ('Cross Point Church', NULL, 'Nashville', 'TN', 'Non-denominational', 'https://crosspoint.tv', 'pushpay', 'https://crosspoint.tv/give', 'Kevin Queen', ARRAY['Cross Point'], 'seeded', 'seeded', 'unverified'),
  ('Liquid Church', NULL, 'Parsippany', 'NJ', 'Non-denominational', 'https://liquidchurch.com', 'pushpay', 'https://liquidchurch.com/give', 'Tim Lucas', ARRAY['Liquid'], 'seeded', 'seeded', 'unverified'),
  ('NewSong Church', NULL, 'Irvine', 'CA', 'Non-denominational', 'https://newsong.net', 'tithely', 'https://newsong.net/give', 'Dave Gibbons', ARRAY['NewSong'], 'seeded', 'seeded', 'unverified'),
  ('Reality Church London (Reality SF affiliate)', 'Reality London', 'London', 'NA', 'Acts 29', 'https://realitylondon.com', 'tithely', 'https://realitylondon.com/give', NULL, ARRAY['Reality London'], 'seeded', 'seeded', 'unverified'),
  ('City on a Hill', NULL, 'Boston', 'MA', 'Non-denominational', 'https://cityonahill.com', 'planning_center', 'https://cityonahill.com/give', 'Brett Fuller', ARRAY['COAH'], 'seeded', 'seeded', 'unverified'),
  ('McLean Bible Church', NULL, 'Vienna', 'VA', 'Non-denominational', 'https://mcleanbible.org', 'pushpay', 'https://mcleanbible.org/give', 'David Platt', ARRAY['MBC'], 'seeded', 'seeded', 'unverified'),
  ('Capital Church', NULL, 'Vienna', 'VA', 'Non-denominational', 'https://capitalchurch.org', 'pushpay', 'https://capitalchurch.org/give', NULL, ARRAY[]::text[], 'seeded', 'seeded', 'unverified'),
  ('Bridgeway Community Church', NULL, 'Columbia', 'MD', 'Non-denominational', 'https://bridgewayonline.org', 'pushpay', 'https://bridgewayonline.org/give', 'David Anderson', ARRAY['Bridgeway'], 'seeded', 'seeded', 'unverified'),
  ('Real Life Ministries', NULL, 'Post Falls', 'ID', 'Non-denominational', 'https://reallifeministries.com', 'pushpay', 'https://reallifeministries.com/give', 'Jim Putman', ARRAY['Real Life'], 'seeded', 'seeded', 'unverified'),
  ('Mariners Church Irvine', NULL, 'Irvine', 'CA', 'Non-denominational', 'https://marinerschurch.org', 'pushpay', 'https://marinerschurch.org/give', NULL, ARRAY[]::text[], 'seeded', 'seeded', 'unverified'),
  ('Discovery Church', NULL, 'Orlando', 'FL', 'Non-denominational', 'https://discoverychurch.org', 'pushpay', 'https://discoverychurch.org/give', NULL, ARRAY['DCO'], 'seeded', 'seeded', 'unverified'),
  ('Northwoods Community Church', NULL, 'Peoria', 'IL', 'Non-denominational', 'https://northwoodschurch.com', 'pushpay', 'https://northwoodschurch.com/give', NULL, ARRAY['Northwoods'], 'seeded', 'seeded', 'unverified'),
  ('Granger Community Church', NULL, 'Granger', 'IN', 'United Methodist', 'https://gccwired.com', 'pushpay', 'https://gccwired.com/give', NULL, ARRAY['GCC Granger'], 'seeded', 'seeded', 'unverified'),
  ('Buckhead Church', NULL, 'Atlanta', 'GA', 'Non-denominational', 'https://buckheadchurch.org', 'pushpay', 'https://buckheadchurch.org/give', NULL, ARRAY['Buckhead'], 'seeded', 'seeded', 'unverified'),
  ('Browns Bridge Church', NULL, 'Cumming', 'GA', 'Non-denominational', 'https://brownsbridge.org', 'pushpay', 'https://brownsbridge.org/give', NULL, ARRAY[]::text[], 'seeded', 'seeded', 'unverified'),
  ('Woodstock City Church', NULL, 'Woodstock', 'GA', 'Non-denominational', 'https://woodstockcity.org', 'pushpay', 'https://woodstockcity.org/give', NULL, ARRAY[]::text[], 'seeded', 'seeded', 'unverified'),
  ('Faith Promise Church', NULL, 'Knoxville', 'TN', 'Non-denominational', 'https://faithpromise.org', 'pushpay', 'https://faithpromise.org/give', 'Chris Stephens', ARRAY['Faith Promise'], 'seeded', 'seeded', 'unverified'),
  ('Long Hollow Church', NULL, 'Hendersonville', 'TN', 'Southern Baptist', 'https://longhollow.com', 'pushpay', 'https://longhollow.com/give', NULL, ARRAY['Long Hollow Baptist'], 'seeded', 'seeded', 'unverified'),
  ('Bellevue Baptist Church', NULL, 'Cordova', 'TN', 'Southern Baptist', 'https://bellevue.org', 'pushpay', 'https://bellevue.org/give', 'Steve Gaines', ARRAY['Bellevue'], 'seeded', 'seeded', 'unverified'),
  ('First Baptist Dallas', 'First Baptist Church Dallas', 'Dallas', 'TX', 'Southern Baptist', 'https://firstdallas.org', 'pushpay', 'https://firstdallas.org/give', 'Robert Jeffress', ARRAY['FBC Dallas'], 'seeded', 'seeded', 'unverified'),
  ('Fellowship Church', NULL, 'Grapevine', 'TX', 'Non-denominational', 'https://fellowshipchurch.com', 'pushpay', 'https://fellowshipchurch.com/give', 'Ed Young Jr.', ARRAY['Fellowship'], 'seeded', 'seeded', 'unverified')
) AS t(legal_name,dba_name,city,state,denomination,website,giving_platform,giving_url,pastor_name,aliases,enrichment_status,source_type,verification_status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.churches c
  WHERE lower(c.legal_name) = lower(t.legal_name)
    AND lower(coalesce(c.city,'')) = lower(coalesce(t.city,''))
);
