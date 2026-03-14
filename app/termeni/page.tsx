'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermeniPage() {
  return (
    <main className="flex min-h-screen flex-col px-7 pt-14 pb-10" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/inregistrare"
            className="w-9 h-9 flex items-center justify-center rounded-sm"
            style={{ background: 'var(--white)', boxShadow: 'var(--shadow-s)', color: 'var(--ink2)' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>
            uni<span style={{ color: 'var(--amber)' }}>.</span>rea
          </span>
        </div>

        <h1 className="font-display text-[1.5rem] leading-tight" style={{ color: 'var(--ink)' }}>
          Termeni și Condiții de Utilizare
        </h1>
        <p className="text-xs" style={{ color: 'var(--ink3)' }}>Ultima actualizare: 14 martie 2026</p>

        <div className="space-y-5 text-xs leading-[1.8]" style={{ color: 'var(--ink2)' }}>
          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>1. Operatorul Platformei</h2>
            <p>
              Platforma Unirea („Platforma") este operată de <strong>Union Association</strong>, asociație cu sediul în Zurich, Elveția („Operatorul", „noi", „nostru"). Prin crearea unui cont și utilizarea Platformei, acceptați integral prezentele Termeni și Condiții de Utilizare („Termenii").
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>2. Versiunea Beta și Asumarea Riscului</h2>
            <p>
              Platforma se află în prezent în <strong>versiune beta</strong>. Aceasta înseamnă că serviciul este furnizat „ca atare" („as is") și „conform disponibilității" („as available"), fără nicio garanție de orice natură, expresă sau implicită, inclusiv, dar fără a se limita la, garanțiile de comercializare, de adecvare la un anumit scop sau de neîncălcare a drepturilor.
            </p>
            <p className="mt-2">
              <strong>Toate datele introduse pe Platformă pot fi pierdute în orice moment, fără notificare prealabilă</strong>, ca urmare a actualizărilor, a defecțiunilor tehnice, a migrărilor de baze de date sau a oricăror alte cauze. Utilizatorul introduce date pe Platformă pe propriul risc și pe propria răspundere.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>3. Limitarea Răspunderii</h2>
            <p>
              În limita maximă permisă de legislația aplicabilă, Operatorul, directorii, angajații, afiliații și partenerii săi <strong>nu sunt răspunzători</strong> pentru niciun prejudiciu direct, indirect, incidental, special, consecvențial sau exemplar, inclusiv, dar fără a se limita la, prejudicii pentru pierderea de date, pierderea de profit, pierderea reputației sau alte pierderi intangibile, rezultate din:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>utilizarea sau imposibilitatea de a utiliza Platforma;</li>
              <li>orice conținut publicat, transmis sau pus la dispoziție prin intermediul Platformei;</li>
              <li>accesul neautorizat la sau alterarea transmisiunilor sau datelor dumneavoastră;</li>
              <li>declarațiile sau comportamentul oricărui terț pe Platformă;</li>
              <li>pierderea sau coruperea oricăror date stocate pe Platformă;</li>
              <li>orice altă chestiune legată de Platformă.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>4. Responsabilitatea Utilizatorului</h2>
            <p>
              Utilizatorul este singurul responsabil pentru conținutul pe care îl publică, transmite sau distribuie prin intermediul Platformei. Utilizatorul se angajează:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>să nu publice conținut ilegal, defăimător, abuziv, hărțuitor, amenințător, obscen sau care încalcă drepturile terților;</li>
              <li>să nu utilizeze Platforma în scopuri frauduloase sau ilegale;</li>
              <li>să nu colecteze sau stocheze date personale ale altor utilizatori fără consimțământul acestora;</li>
              <li>să respecte legislația aplicabilă, inclusiv legislația privind protecția datelor cu caracter personal.</li>
            </ul>
            <p className="mt-2">
              Operatorul nu verifică și nu moderează în mod proactiv conținutul publicat de utilizatori și nu își asumă nicio răspundere pentru acesta.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>5. Contul Utilizatorului</h2>
            <p>
              Utilizatorul este responsabil pentru menținerea confidențialității credențialelor contului său. Utilizatorul poate <strong>șterge (dezactiva) contul în orice moment</strong> din pagina de setări a Platformei. La dezactivarea contului, profilul utilizatorului va fi marcat ca inactiv, iar numele de utilizator va fi eliberat pentru reutilizare de către alți utilizatori. Conținutul publicat anterior (postări, comentarii, mesaje) va rămâne vizibil pe Platformă.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>6. Protecția Datelor cu Caracter Personal (GDPR)</h2>
            <p>
              Operatorul prelucrează datele cu caracter personal ale utilizatorilor în conformitate cu Regulamentul (UE) 2016/679 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și libera circulație a acestor date („GDPR") și cu Legea federală elvețiană privind protecția datelor (nLPD/nDSG).
            </p>

            <h3 className="text-xs font-bold mt-3 mb-1" style={{ color: 'var(--ink)' }}>6.1. Datele Colectate</h3>
            <p>Colectăm următoarele categorii de date cu caracter personal:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Date de identificare</strong>: nume, prenume, numele de utilizator, adresa de email, număr de telefon (opțional);</li>
              <li><strong>Date educaționale</strong>: liceul absolvit, anul absolvirii, clasa;</li>
              <li><strong>Date de profil</strong>: profesie, domeniu de activitate, companie, oraș, țară, hobby-uri, biografie, fotografie de profil;</li>
              <li><strong>Date de utilizare</strong>: vizualizări de pagini, acțiuni pe Platformă, durata sesiunilor (date anonimizate de analiză);</li>
              <li><strong>Conținut generat</strong>: postări, comentarii, mesaje, fotografii încărcate.</li>
            </ul>

            <h3 className="text-xs font-bold mt-3 mb-1" style={{ color: 'var(--ink)' }}>6.2. Temeiul Legal al Prelucrării</h3>
            <p>Prelucrăm datele dumneavoastră pe baza:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Consimțământului</strong> (art. 6 alin. 1 lit. a GDPR) — acordat prin acceptarea prezentelor Termeni;</li>
              <li><strong>Executării contractului</strong> (art. 6 alin. 1 lit. b GDPR) — pentru furnizarea serviciilor Platformei;</li>
              <li><strong>Interesului legitim</strong> (art. 6 alin. 1 lit. f GDPR) — pentru îmbunătățirea și securizarea Platformei.</li>
            </ul>

            <h3 className="text-xs font-bold mt-3 mb-1" style={{ color: 'var(--ink)' }}>6.3. Drepturile Utilizatorului</h3>
            <p>În conformitate cu GDPR, aveți următoarele drepturi:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Dreptul de acces</strong> — de a solicita informații despre datele dumneavoastră prelucrate;</li>
              <li><strong>Dreptul la rectificare</strong> — de a solicita corectarea datelor inexacte (disponibil din pagina de setări);</li>
              <li><strong>Dreptul la ștergere</strong> („dreptul de a fi uitat") — de a solicita ștergerea datelor (disponibil prin funcția de dezactivare a contului);</li>
              <li><strong>Dreptul la restricționarea prelucrării</strong>;</li>
              <li><strong>Dreptul la portabilitatea datelor</strong>;</li>
              <li><strong>Dreptul de opoziție</strong> la prelucrarea datelor;</li>
              <li><strong>Dreptul de a depune o plângere</strong> la autoritatea de supraveghere competentă.</li>
            </ul>
            <p className="mt-2">
              Pentru exercitarea acestor drepturi, ne puteți contacta la adresa de email indicată pe Platformă.
            </p>

            <h3 className="text-xs font-bold mt-3 mb-1" style={{ color: 'var(--ink)' }}>6.4. Stocarea și Securitatea Datelor</h3>
            <p>
              Datele sunt stocate pe servere securizate furnizate de Supabase (infrastructură în cloud). Operatorul implementează măsuri tehnice și organizatorice rezonabile pentru protecția datelor, însă, <strong>având în vedere natura beta a Platformei, nu poate garanta securitatea absolută a datelor</strong>.
            </p>

            <h3 className="text-xs font-bold mt-3 mb-1" style={{ color: 'var(--ink)' }}>6.5. Perioada de Retenție</h3>
            <p>
              Datele cu caracter personal sunt păstrate pe durata existenței contului activ. La dezactivarea contului, datele de profil sunt anonimizate, dar conținutul generat (postări, comentarii) rămâne vizibil fără legătură identificabilă cu profilul dezactivat.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>7. Proprietatea Intelectuală</h2>
            <p>
              Utilizatorul păstrează drepturile de proprietate intelectuală asupra conținutului pe care îl publică pe Platformă. Prin publicarea conținutului, utilizatorul acordă Operatorului o licență neexclusivă, gratuită, la nivel mondial, pentru a afișa și distribui conținutul pe Platformă.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>8. Modificarea Termenilor</h2>
            <p>
              Operatorul își rezervă dreptul de a modifica prezentele Termeni în orice moment. Modificările vor fi publicate pe această pagină. Continuarea utilizării Platformei după publicarea modificărilor constituie acceptarea noilor Termeni.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>9. Legea Aplicabilă și Jurisdicția</h2>
            <p>
              Prezentele Termeni sunt guvernate de legislația Elveției. Orice litigiu care decurge din sau în legătură cu prezentele Termeni va fi supus jurisdicției exclusive a instanțelor competente din Zurich, Elveția.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>10. Contact</h2>
            <p>
              Pentru orice întrebări referitoare la prezentele Termeni sau la prelucrarea datelor dumneavoastră cu caracter personal, ne puteți contacta prin intermediul funcționalității de feedback din aplicație sau prin intermediul Platformei.
            </p>
            <p className="mt-2">
              <strong>Union Association</strong><br />
              Zurich, Elveția
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
