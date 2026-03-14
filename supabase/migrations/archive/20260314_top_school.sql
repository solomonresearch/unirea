-- Add top_school flag for curated whitelist of top 100 schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS top_school boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_schools_top_school ON public.schools (top_school) WHERE top_school = true;

-- Mark top 100 schools using fuzzy name + judet matching
-- Each UPDATE targets a specific school by unique name substring + county code

-- #1 Gheorghe Lazăr, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND upper(denumire_lunga_unitate) LIKE '%GHEORGHE LAZ%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #2 Colegiul Național, Iași
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%COLEGIUL NAȚIONAL, IAŞI%';
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%COLEGIUL NAŢIONAL, IAŞI%';
-- #3 Tudor Vianu, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND upper(denumire_lunga_unitate) LIKE '%TUDOR VIANU%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #4 Sfântul Sava, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Sfântul Sava%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #5 Emil Racoviță, Cluj
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CJ' AND denumire_lunga_unitate ILIKE '%Emil Racovi%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #6 Emil Racoviță, Iași
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%Emil Racovi%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #7 Unirea, Focșani
UPDATE public.schools SET top_school = true WHERE judet_pj = 'VN' AND denumire_lunga_unitate ILIKE '%Unirea%FOC%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #8 Andrei Șaguna, Brașov
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BV' AND denumire_lunga_unitate ILIKE '%Andrei Șaguna%' AND localitate_unitate ILIKE '%BRAŞOV%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #9 Costache Negruzzi, Iași
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%Costache Negruzzi%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #10 Vasile Alecsandri, Galați
UPDATE public.schools SET top_school = true WHERE judet_pj = 'GL' AND denumire_lunga_unitate ILIKE '%Vasile Alecsandri%' AND localitate_unitate ILIKE '%GALA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #11 Mircea cel Bătrân, Constanța
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CT' AND denumire_lunga_unitate ILIKE '%Mircea cel B%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #12 George Coșbuc, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%George Coșbuc%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #13 Nicolae Bălcescu, Cluj
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CJ' AND denumire_lunga_unitate ILIKE '%Nicolae Bălcescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #14 Gheorghe Munteanu Murgoci, Brăila
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BR' AND denumire_lunga_unitate ILIKE '%Munteanu Murgoci%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #15 Ștefan cel Mare, Suceava
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SV' AND denumire_lunga_unitate ILIKE '%Ștefan cel Mare%' AND localitate_unitate ILIKE '%SUCEAVA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #16 Nicolae Grigorescu, Câmpina
UPDATE public.schools SET top_school = true WHERE judet_pj = 'PH' AND denumire_lunga_unitate ILIKE '%Nicolae Grigorescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #17 Mihai Eminescu, Iași
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%Mihai Eminescu%' AND localitate_unitate ILIKE '%IAŞI%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #18 Avram Iancu, Cluj
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CJ' AND denumire_lunga_unitate ILIKE '%Avram Iancu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #19 Gheorghe Șincai, Cluj
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CJ' AND denumire_lunga_unitate ILIKE '%incai%' AND localitate_unitate ILIKE '%CLUJ%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #20 Ion C. Brătianu, Pitești
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AG' AND denumire_lunga_unitate ILIKE '%Ion C. Br%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #21 Spiru Haret, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Spiru Haret%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #22 Grigore Moisil, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Grigore Moisil%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #23 Costache Negri, Galați
UPDATE public.schools SET top_school = true WHERE judet_pj = 'GL' AND denumire_lunga_unitate ILIKE '%Costache Negri%' AND localitate_unitate ILIKE '%GALA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #24 Horea, Cloșca și Crișan, Alba Iulia
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AB' AND denumire_lunga_unitate ILIKE '%Horea%' AND localitate_unitate ILIKE '%ALBA IULIA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #25 Dr. Ioan Meșotă, Brașov
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BV' AND denumire_lunga_unitate ILIKE '%Meșotă%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #26 Gheorghe Vrânceanu, Bacău (DB has VRĂNCEANU)
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BC' AND denumire_lunga_unitate ILIKE '%Gheorghe Vr%nceanu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #27 Militar Mihai Viteazul, Alba Iulia
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AB' AND denumire_lunga_unitate ILIKE '%Mihai Viteazul%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #28 Matei Basarab, Rm. Vâlcea (Informatică)
UPDATE public.schools SET top_school = true WHERE judet_pj = 'VL' AND denumire_lunga_unitate ILIKE '%Matei Basarab%' AND localitate_unitate ILIKE '%RÂMNICU%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #29 Emanuil Gojdu, Oradea
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BH' AND denumire_lunga_unitate ILIKE '%Emanuil Gojdu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #30 Frații Buzești, Craiova
UPDATE public.schools SET top_school = true WHERE judet_pj = 'DJ' AND denumire_lunga_unitate ILIKE '%uzești%' AND localitate_unitate ILIKE '%CRAIOVA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #31 Mihai Viteazul, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Mihai Viteazul%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #32 Petru Rareș, Suceava
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SV' AND denumire_lunga_unitate ILIKE '%Petru Rare%' AND localitate_unitate ILIKE '%SUCEAVA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #33 Constantin Diaconovici Loga, Timișoara
UPDATE public.schools SET top_school = true WHERE judet_pj = 'TM' AND denumire_lunga_unitate ILIKE '%Constantin Diaconovici Loga%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #34 Calistrat Hogaș, Piatra-Neamț
UPDATE public.schools SET top_school = true WHERE judet_pj = 'NT' AND denumire_lunga_unitate ILIKE '%Calistrat%' AND localitate_unitate ILIKE '%PIATRA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #35 Matei Basarab, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Matei Basarab%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #36 B.P. Hasdeu, Buzău
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BZ' AND denumire_lunga_unitate ILIKE '%Hasdeu%' AND localitate_unitate ILIKE '%BUZĂU%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #37 Grigore Moisil, Iași (Informatică)
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%Grigore Moisil%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #38 Ion Creangă, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Ion Creangă%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #39 Gheorghe Șincai, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Gheorghe Ş%ncai%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #40 Ferdinand I, Bacău
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BC' AND denumire_lunga_unitate ILIKE '%Ferdinand%' AND localitate_unitate ILIKE '%BACĂU%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #41 Vasile Alecsandri, Iași
UPDATE public.schools SET top_school = true WHERE judet_pj = 'IS' AND denumire_lunga_unitate ILIKE '%Vasile Alecsandri%' AND localitate_unitate ILIKE '%IAŞI%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #42 Eudoxiu Hurmuzachi, Rădăuți
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SV' AND denumire_lunga_unitate ILIKE '%Eudoxiu Hurmuzachi%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #43 Zinca Golescu, Pitești
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AG' AND denumire_lunga_unitate ILIKE '%Zinca Golescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #44 Grigore Moisil, Timișoara
UPDATE public.schools SET top_school = true WHERE judet_pj = 'TM' AND denumire_lunga_unitate ILIKE '%Grigore Moisil%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #45 Mihail Kogălniceanu, Galați
UPDATE public.schools SET top_school = true WHERE judet_pj = 'GL' AND denumire_lunga_unitate ILIKE '%Mihail Kog%lniceanu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #46 Petru Rareș, Piatra-Neamț
UPDATE public.schools SET top_school = true WHERE judet_pj = 'NT' AND denumire_lunga_unitate ILIKE '%Petru Rare%' AND localitate_unitate ILIKE '%PIATRA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #47 Samuel von Brukenthal, Sibiu
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SB' AND denumire_lunga_unitate ILIKE '%Samuel von Brukenthal%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #48 Gheorghe Lazăr, Sibiu
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SB' AND denumire_lunga_unitate ILIKE '%Gheorghe Laz%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #49 Ovidius, Constanța
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CT' AND denumire_lunga_unitate ILIKE '%Ovidius%' AND localitate_unitate ILIKE '%CONSTANŢA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #50 Mihai Eminescu, Botoșani
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BT' AND denumire_lunga_unitate ILIKE '%Mihai Eminescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #51 Octavian Goga, Sibiu
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SB' AND denumire_lunga_unitate ILIKE '%Octavian Goga%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #52 Moise Nicoară, Arad
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AR' AND denumire_lunga_unitate ILIKE '%Moise Nicoar%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #53 Preparandia-Dimitrie Țichindeal, Arad
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AR' AND denumire_lunga_unitate ILIKE '%Preparandia%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #54 Tiberiu Popoviciu, Cluj
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CJ' AND denumire_lunga_unitate ILIKE '%Tiberiu Popoviciu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #55 Roman Vodă, Roman
UPDATE public.schools SET top_school = true WHERE judet_pj = 'NT' AND denumire_lunga_unitate ILIKE '%Roman Vod%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #56 Mihai Viteazul, Ploiești
UPDATE public.schools SET top_school = true WHERE judet_pj = 'PH' AND denumire_lunga_unitate ILIKE '%Mihai Viteazul%' AND localitate_unitate ILIKE '%PLOIEŞTI%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #57 Constantin Carabella, Târgoviște
UPDATE public.schools SET top_school = true WHERE judet_pj = 'DB' AND denumire_lunga_unitate ILIKE '%Constantin Carabella%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #58 Nichita Stănescu, Ploiești
UPDATE public.schools SET top_school = true WHERE judet_pj = 'PH' AND denumire_lunga_unitate ILIKE '%Nichita St%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #59 Traian Lalescu, Reșița
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CS' AND denumire_lunga_unitate ILIKE '%Traian Lalescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #60 Grigore Moisil, Tulcea
UPDATE public.schools SET top_school = true WHERE judet_pj = 'TL' AND denumire_lunga_unitate ILIKE '%Grigore Moisil%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #61 Elena Cuza, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Elena Cuza%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #62 Cantemir Vodă, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Cantemir Vod%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #63 Constantin Cantacuzino, Târgoviște
UPDATE public.schools SET top_school = true WHERE judet_pj = 'DB' AND denumire_lunga_unitate ILIKE '%Constantin Cantacuzino%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #64 Regina Maria, Ploiești
UPDATE public.schools SET top_school = true WHERE judet_pj = 'PH' AND denumire_lunga_unitate ILIKE '%Regina Maria%' AND localitate_unitate ILIKE '%PLOIEŞTI%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #65 Alexandru Ioan Cuza, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Alexandru Ioan Cuza%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #66 Ion Luca Caragiale, Ploiești
UPDATE public.schools SET top_school = true WHERE judet_pj = 'PH' AND denumire_lunga_unitate ILIKE '%Ion Luca Caragiale%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #67 Al. I. Cuza, Focșani
UPDATE public.schools SET top_school = true WHERE judet_pj = 'VN' AND denumire_lunga_unitate ILIKE '%Al. I. Cuza%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #68 Militar Dimitrie Cantemir, Breaza
UPDATE public.schools SET top_school = true WHERE judet_pj = 'PH' AND denumire_lunga_unitate ILIKE '%Dimitrie Cantemir%' AND localitate_unitate ILIKE '%BREAZA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #69 Mihai Eminescu, Constanța
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CT' AND denumire_lunga_unitate ILIKE '%Mihai Eminescu%' AND localitate_unitate ILIKE '%CONSTANŢA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #70 Traian, Constanța
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CT' AND denumire_lunga_unitate ILIKE '%Traian%' AND localitate_unitate ILIKE '%CONSTANŢA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%') AND denumire_lunga_unitate NOT ILIKE '%Lalescu%';
-- #71 I.L. Caragiale, București (no space between I.L.)
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%I.L.Caragiale%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%I.L. Caragiale%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #72 Decebal, Deva
UPDATE public.schools SET top_school = true WHERE judet_pj = 'HD' AND denumire_lunga_unitate ILIKE '%Decebal%' AND localitate_unitate ILIKE '%DEVA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #73 Iancu de Hunedoara, Hunedoara
UPDATE public.schools SET top_school = true WHERE judet_pj = 'HD' AND denumire_lunga_unitate ILIKE '%Iancu de Hunedoara%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #74 Lucian Blaga, Cluj
UPDATE public.schools SET top_school = true WHERE judet_pj = 'CJ' AND denumire_lunga_unitate ILIKE '%Lucian Blaga%' AND localitate_unitate ILIKE '%CLUJ%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #75 Gheorghe Lazăr, Timișoara — NOT IN DB, skipped
-- #76 Dragoș Vodă, Câmpulung Moldovenesc
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SV' AND denumire_lunga_unitate ILIKE '%Dragoș Vodă%' AND localitate_unitate ILIKE '%CÂMPULUNG%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #77 Nicu Gane, Fălticeni
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SV' AND denumire_lunga_unitate ILIKE '%Nicu Gane%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #78 Iosif Vulcan, Oradea
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BH' AND denumire_lunga_unitate ILIKE '%Iosif Vulcan%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #79 Onisifor Ghibu, Oradea
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BH' AND denumire_lunga_unitate ILIKE '%Onisifor Ghibu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #80 C.A. Rosetti, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%C.A. Rosetti%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #81 Carol I, Craiova
UPDATE public.schools SET top_school = true WHERE judet_pj = 'DJ' AND denumire_lunga_unitate ILIKE '%Carol I%' AND localitate_unitate ILIKE '%CRAIOVA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #82 Elena Ghiba Birta, Arad
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AR' AND denumire_lunga_unitate ILIKE '%Elena Ghiba%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #83 Lucian Blaga, Sebeș
UPDATE public.schools SET top_school = true WHERE judet_pj = 'AB' AND denumire_lunga_unitate ILIKE '%Lucian Blaga%' AND localitate_unitate ILIKE '%SEBEŞ%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #84 Alexandru Papiu Ilarian, Târgu Mureș
UPDATE public.schools SET top_school = true WHERE judet_pj = 'MS' AND denumire_lunga_unitate ILIKE '%Alexandru Papiu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #85 Unirea, Târgu Mureș
UPDATE public.schools SET top_school = true WHERE judet_pj = 'MS' AND denumire_lunga_unitate ILIKE '%Unirea%' AND localitate_unitate ILIKE '%TÂRGU%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #86 Mihai Eminescu, Oradea
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BH' AND denumire_lunga_unitate ILIKE '%Mihai Eminescu%' AND localitate_unitate ILIKE '%ORADEA%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #87 Gheorghe Roșca Codreanu, Bârlad
UPDATE public.schools SET top_school = true WHERE judet_pj = 'VS' AND denumire_lunga_unitate ILIKE '%Codreanu%' AND localitate_unitate ILIKE '%BÂRLAD%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #88 Carmen Sylva, Timișoara
UPDATE public.schools SET top_school = true WHERE judet_pj = 'TM' AND denumire_lunga_unitate ILIKE '%Carmen Sylva%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #89 Ion Neculce, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Ion Neculce%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #90 Ienăchiță Văcărescu, Târgoviște
UPDATE public.schools SET top_school = true WHERE judet_pj = 'DB' AND denumire_lunga_unitate ILIKE '%Văcărescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #91 Mihai Eminescu, Satu Mare
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SM' AND denumire_lunga_unitate ILIKE '%Mihai Eminescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #92 Doamna Stanca, Făgăraș
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BV' AND denumire_lunga_unitate ILIKE '%Doamna Stanca%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #93 Nicolae Bălcescu, Brăila
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BR' AND denumire_lunga_unitate ILIKE '%Nicolae Bălcescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #94 Anastasescu, Roșiorii de Vede
UPDATE public.schools SET top_school = true WHERE judet_pj = 'TR' AND denumire_lunga_unitate ILIKE '%Anastasescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #95 Alexandru Lahovari, Rm. Vâlcea
UPDATE public.schools SET top_school = true WHERE judet_pj = 'VL' AND denumire_lunga_unitate ILIKE '%Lahovari%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #96 Tudor Vladimirescu, Târgu Jiu
UPDATE public.schools SET top_school = true WHERE judet_pj = 'GJ' AND denumire_lunga_unitate ILIKE '%Tudor Vladimirescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #97 Ecaterina Teodoroiu, Târgu Jiu
UPDATE public.schools SET top_school = true WHERE judet_pj = 'GJ' AND denumire_lunga_unitate ILIKE '%Ecaterina Teodoroiu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #98 Silvania, Zalău
UPDATE public.schools SET top_school = true WHERE judet_pj = 'SJ' AND denumire_lunga_unitate ILIKE '%Silvania%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #99 Mihai Eminescu, București
UPDATE public.schools SET top_school = true WHERE judet_pj = 'B' AND denumire_lunga_unitate ILIKE '%Mihai Eminescu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');
-- #100 Liviu Rebreanu, Bistrița
UPDATE public.schools SET top_school = true WHERE judet_pj = 'BN' AND denumire_lunga_unitate ILIKE '%Liviu Rebreanu%' AND (upper(denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(denumire_lunga_unitate) LIKE '%LICEU%');

-- Drop and recreate get_scoli to change return type
DROP FUNCTION IF EXISTS public.get_scoli(text, text);
CREATE FUNCTION public.get_scoli(p_judet text, p_localitate text)
RETURNS TABLE(denumire text, top_school boolean) AS $$
  SELECT DISTINCT denumire_lunga_unitate AS denumire, COALESCE(s.top_school, false) AS top_school
  FROM public.schools s
  WHERE s.judet_pj = p_judet
    AND s.localitate_unitate = p_localitate
    AND s.denumire_lunga_unitate IS NOT NULL
    AND (upper(s.denumire_lunga_unitate) LIKE '%COLEGIU%' OR upper(s.denumire_lunga_unitate) LIKE '%LICEU%')
  ORDER BY denumire_lunga_unitate;
$$ LANGUAGE sql STABLE;
