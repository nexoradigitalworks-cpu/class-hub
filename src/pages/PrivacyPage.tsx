import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Lock, UserCheck, Layers, FileText, CheckCircle } from 'lucide-react';
import { ClassHubLogo } from '../components/ClassHubLogo';

interface LegalPageProps {
  onBack?: () => void;
}

export const PrivacyPage: React.FC<LegalPageProps> = ({ onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna all'app</span>
          </button>
          
          <div className="flex items-center gap-3">
            <ClassHubLogo size="xs" />
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
              Informativa Privacy
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
          
          {/* Header Title */}
          <div className="border-b border-slate-100 pb-8 mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy — ClassHub
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Ultimo aggiornamento: Ottobre 2026 • Redatta ai sensi della normativa vigente in materia di protezione dei dati personali.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
            
            {/* 1. Titolare del servizio */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">1</span>
                Titolare del servizio
              </h2>
              <p>
                ClassHub è un'applicazione web e mobile concepita per agevolare l'organizzazione e la collaborazione scolastica, sviluppata e gestita da <strong className="text-slate-900 font-semibold">Nexora</strong>.
              </p>
              <div className="inline-flex items-center gap-2 p-3 mt-1 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-sm">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>Email di contatto ufficiale: </span>
                <a 
                  href="mailto:nexora.digitalworks@gmail.com" 
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  nexora.digitalworks@gmail.com
                </a>
              </div>
            </section>

            {/* 2. Dati raccolti */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">2</span>
                Dati raccolti
              </h2>
              <p>
                Nel rispetto del principio di minimizzazione dei dati, ClassHub tratta esclusivamente le informazioni strettamente necessarie per le funzionalità didattiche e organizzative:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li><strong className="text-slate-800">Dati anagrafici e identificativi:</strong> Nome, cognome e avatar selezionato.</li>
                <li><strong className="text-slate-800">Recapiti e credenziali:</strong> Indirizzo email e identificativo account univoco (UID).</li>
                <li><strong className="text-slate-800">Informazioni di classe:</strong> Classe di appartenenza, codice invito e ruolo scolastico (Studente, Rappresentante, Admin).</li>
                <li><strong className="text-slate-800">Contenuti didattici condivisi:</strong> Eventi del calendario, prenotazioni e disponibilità per interrogazioni, avvisi di classe, materiali didattici condivisi, sondaggi e risposte espresse.</li>
                <li><strong className="text-slate-800">Dati tecnici:</strong> Log applicativi minimi e informazioni necessarie al mantenimento della sicurezza della sessione e prevenzione di abusi.</li>
              </ul>
            </section>

            {/* 3. Autenticazione e Sicurezza dell'Account */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">3</span>
                Autenticazione e Sicurezza dell'Account
              </h2>
              <p>
                ClassHub adotta l'autenticazione sicura tramite <strong className="text-slate-800">email e password crittografate</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li>
                  Le credenziali dell'utente sono gestite in modo protetto con standard moderni di cifratura; la password non viene mai memorizzata in chiaro né resa visibile agli altri membri o amministratori della classe.
                </li>
                <li>
                  L'utente può in qualunque momento reimpostare in autonomia la propria password mediante il link di recupero inviato al proprio indirizzo email.
                </li>
                <li>
                  <strong className="text-slate-900">Nessun dato viene ceduto a terzi per scopi pubblicitari, commerciali o di profilazione comportamentale.</strong>
                </li>
              </ul>
            </section>

            {/* 4. Finalità del trattamento */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">4</span>
                Finalità del trattamento
              </h2>
              <p>
                Tutti i dati raccolti sono trattati per le seguenti finalità:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li>Gestione delle classi scolastiche e coordinamento della vita didattica quotidiana;</li>
                <li>Condivisione interna tra membri della stessa classe di compiti, verifiche, interrogazioni, avvisi, materiali di studio e votazioni per sondaggi;</li>
                <li>Sicurezza informatica, prevenzione di utilizzi fraudolenti o non autorizzati, e corretto funzionamento della piattaforma.</li>
              </ul>
            </section>

            {/* 5. Condivisione e riservatezza dei dati */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">5</span>
                Condivisione dei dati e isolamento di classe
              </h2>
              <p>
                ClassHub adotta rigidi criteri di isolamento tramite criteri di sicurezza basati su ruoli (Row Level Security):
              </p>
              <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-slate-700">
                I contenuti caricati o inseriti (calendario, file, avvisi, sondaggi, iscrizioni a interrogazioni) sono <strong className="text-slate-900">visibili esclusivamente ai membri registrati della specifica classe di appartenenza</strong> o agli amministratori e rappresentanti secondo i ruoli previsti dal regolamento interno. Nessun membro di un'altra classe può accedere ai contenuti della vostra classe.
              </p>
            </section>

            {/* 6. Conservazione dei dati */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">6</span>
                Conservazione dei dati
              </h2>
              <p>
                I dati vengono conservati per il tempo strettamente necessario all'erogazione del servizio educativo o fino all'eventuale richiesta di cancellazione da parte dell'utente o al termine dell'anno scolastico di riferimento.
              </p>
            </section>

            {/* 7. Diritti dell'utente e contatti */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">7</span>
                Diritti dell'utente e contatti
              </h2>
              <p>
                In ogni momento, ciascun utente ha il diritto di:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li>Accedere ai propri dati e richiedere conferma della loro esistenza;</li>
                <li>Richiedere la rettifica o l'aggiornamento dei dati inesatti;</li>
                <li>Richiedere la cancellazione completa del proprio account e dei dati associati;</li>
                <li>Opporsi al trattamento o revocare il consenso precedentemente fornito.</li>
              </ul>
              <p className="pt-2">
                Per esercitare i propri diritti o per qualsiasi quesito relativo alla privacy, è possibile inviare un'email a:
              </p>
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 inline-block">
                <a
                  href="mailto:nexora.digitalworks@gmail.com"
                  className="font-bold text-[#2563EB] hover:underline"
                >
                  nexora.digitalworks@gmail.com
                </a>
              </div>
            </section>

          </div>

          {/* Action Back Button at Bottom */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna all'app</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-sm font-semibold text-[#2563EB] hover:text-blue-700 transition cursor-pointer"
            >
              Consulta i Termini di Servizio →
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 bg-white/50 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Nexora • ClassHub. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
};
