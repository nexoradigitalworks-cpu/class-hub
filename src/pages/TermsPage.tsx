import React from 'react';
import { ArrowLeft, BookOpen, Mail, ShieldAlert, Users, Award, FileText } from 'lucide-react';
import { ClassHubLogo } from '../components/ClassHubLogo';

interface LegalPageProps {
  onBack?: () => void;
}

export const TermsPage: React.FC<LegalPageProps> = ({ onBack }) => {
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
              Termini di Servizio
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
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Termini di Servizio — ClassHub
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Ultimo aggiornamento: Ottobre 2026 • Condizioni generali di utilizzo dell'applicazione.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
            
            {/* 1. Accettazione dei Termini */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">1</span>
                Accettazione dei Termini
              </h2>
              <p>
                L'accesso e l'uso dell'applicazione <strong className="text-slate-900 font-semibold">ClassHub</strong> sono regolati dai presenti Termini di Servizio. Registrando un account, effettuando l'accesso o partecipando a una classe scolastica, l'utente dichiara di aver letto, compreso e accettato integralmente le presenti condizioni.
              </p>
            </section>

            {/* 2. Descrizione del servizio */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">2</span>
                Descrizione del servizio
              </h2>
              <p>
                ClassHub è una piattaforma digitale sviluppata da <strong className="text-slate-900">Nexora</strong> concepita per agevolare e ottimizzare la gestione della vita scolastica quotidiana. I servizi offerti includono:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li><strong className="text-slate-800">Calendario condiviso:</strong> pianificazione di verifiche, compiti, uscite didattiche ed eventi;</li>
                <li><strong className="text-slate-800">Interrogazioni programmate:</strong> iscrizione dei volontari e distribuzione equa delle date;</li>
                <li><strong className="text-slate-800">Orario scolastico:</strong> visualizzazione intuitiva della scansione oraria settimanale e delle aule;</li>
                <li><strong className="text-slate-800">Bacheca Avvisi:</strong> comunicazioni urgenti o ordinarie della classe;</li>
                <li><strong className="text-slate-800">Materiali e appunti:</strong> condivisione sicura di riassunti, schemi e file di studio;</li>
                <li><strong className="text-slate-800">Sondaggi e decisioni:</strong> consultazioni rapide e votazioni interne per la classe.</li>
              </ul>
            </section>

            {/* 3. Account e responsabilità dell'utente */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">3</span>
                Account e responsabilità dell'utente
              </h2>
              <p>
                Al momento della registrazione e durante l'utilizzo del servizio, l'utente si impegna a:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li>Fornire informazioni veritiere, accurate e aggiornate in merito alla propria identità;</li>
                <li>Custodire con diligenza le proprie credenziali d'accesso (email e password) e a non cederle a terzi;</li>
                <li>Non utilizzare il servizio per attività illecite, ingannevoli, diffamatorie, discriminatorie o comunque lesive della dignità di compagni e docenti;</li>
                <li>Rispettare le norme e i regolamenti scolastici vigenti nel proprio istituto.</li>
              </ul>
            </section>

            {/* 4. Ruoli e moderazione */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">4</span>
                Ruoli e moderazione interna
              </h2>
              <p>
                ClassHub prevede specifici livelli di autorizzazione all'interno della classe:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li><strong className="text-slate-800">Studenti:</strong> consultazione e partecipazione attiva a calendario, avvisi, materiali, interrogazioni e sondaggi;</li>
                <li><strong className="text-slate-800">Rappresentanti di Classe:</strong> funzioni avanzate di pubblicazione e coordinamento;</li>
                <li><strong className="text-slate-800">Amministratori:</strong> gestione dei membri della classe, approvazione accessi, assegnazione ruoli e rimozione di contenuti non conformi.</li>
              </ul>
              <p className="pt-1 text-slate-600">
                Gli amministratori della classe hanno la facoltà e la responsabilità di moderare le attività interne al fine di garantire un clima di rispetto reciproco e corretta convivenza.
              </p>
            </section>

            {/* 5. Contenuti degli utenti */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">5</span>
                Contenuti pubblicati dagli utenti
              </h2>
              <p>
                Ciascun utente è l'unico ed esclusivo responsabile dei contenuti (testi, commenti, file, appunti o immagini) caricati o condivisi su ClassHub:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#2563EB]">
                <li>L'utente garantisce di disporre dei diritti necessari per la condivisione di eventuali materiali e di non violare il diritto d'autore di terzi;</li>
                <li>È fatto divieto assoluto di condividere contenuti coperti da segreto d'ufficio o dati sensibili non autorizzati;</li>
                <li>Nexora si riserva il diritto di rimuovere contenuti ritenuti inopportuni o segnalati per violazione dei presenti termini.</li>
              </ul>
            </section>

            {/* 6. Disponibilità del servizio */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">6</span>
                Disponibilità del servizio e limitazione di responsabilità
              </h2>
              <p>
                Nexora si adopera per garantire la massima stabilità, affidabilità e sicurezza del servizio. Tuttavia, ClassHub è fornito <strong className="text-slate-900">"così com'è" (as is)</strong> e <strong className="text-slate-900">"secondo disponibilità"</strong>:
              </p>
              <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-slate-700">
                Nexora non può garantire che l'accesso alla piattaforma sia completamente privo di interruzioni, ritardi o anomalie derivanti da interventi di manutenzione o cause di forza maggiore esterne. Si consiglia agli studenti di mantenere sempre anche i consueti canali istituzionali (registro elettronico della scuola).
              </p>
            </section>

            {/* 7. Modifiche ai termini */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">7</span>
                Modifiche ai presenti Termini
              </h2>
              <p>
                Nexora si riserva il diritto di aggiornare o modificare i presenti Termini di Servizio in occasione di evoluzioni funzionali dell'applicazione o per adempimenti di legge. La data dell'ultimo aggiornamento sarà sempre indicata in cima a questa pagina. L'uso continuato di ClassHub dopo le modifiche costituisce accettazione implicita dei termini rinnovati.
              </p>
            </section>

            {/* 8. Contatti e assistenza */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">8</span>
                Contatti e supporto
              </h2>
              <p>
                Per qualsiasi richiesta di chiarimento, segnalazione o supporto relativo ai Termini di Servizio o all'applicazione:
              </p>
              <div className="inline-flex items-center gap-2 p-3 mt-1 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-sm">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>Email di supporto: </span>
                <a 
                  href="mailto:nexora.digitalworks@gmail.com" 
                  className="font-semibold text-[#2563EB] hover:underline"
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
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-sm font-semibold text-[#2563EB] hover:text-blue-700 transition cursor-pointer"
            >
              Consulta la Privacy Policy →
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
