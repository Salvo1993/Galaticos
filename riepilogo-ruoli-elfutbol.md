# Riepilogo Ruoli ElFutbol & Incrocio con il Sondaggio

> [!NOTE]
> Questo documento riporta la verifica aggiornata del database **ElFutbol** a seguito delle modifiche apportate, con il dettaglio della logica di matching applicata tra i **Nomi WhatsApp** e i **Nomi registrati su DB**.

---

## 1. Tabella dei Giocatori Attualmente Censiti su ElFutbol (26 Giocatori - Verificata su DB)

| Giocatore (DB ElFutbol) | Ruolo Principale | Ruolo/i Secondario/i | Stato dopo l'aggiornamento |
| :--- | :--- | :--- | :--- |
| **(P) Marco C** | Portiere | *Nessuno* | Confermato |
| **Ale Buttitta** | Centrocampista Centrale | Terzino Destro, Terzino Sinistro | Confermato |
| **Ale Casa** | Centrocampista Centrale | *Nessuno* | Confermato |
| **Ale LM** | Ala | *Nessuno* | Confermato |
| **Alessandro F** | **Terzino Destro** | **Terzino Sinistro, Difensore** | ✅ **Aggiornato su DB** |
| **AntonioS** | **Ala** | **Attaccante** | ✅ **Aggiornato su DB** |
| **Ciccio (Nipote Riccardo)** | Attaccante | *Nessuno* | Confermato |
| **Davide A** | Centrocampista Centrale | Difensore | Confermato |
| **Fulì** | Difensore | Terzino Destro, Terzino Sinistro, Centrocampista Centrale | Confermato |
| **Gino** | Ala | Terzino Destro, Terzino Sinistro, Difensore | Confermato |
| **Giuseppe G** | Ala | Terzino Destro, Terzino Sinistro | Confermato |
| **Giuseppe LB** | Difensore | Terzino Destro, Terzino Sinistro | Confermato |
| **GiuseppeR** | Terzino Sinistro | Terzino Destro, Ala Sinistra, Ala Destra | Confermato |
| **Luca (Amico Riccardo)** | Attaccante | *Nessuno* | Confermato |
| **MarcoM** | Difensore | Terzino Destro, Terzino Sinistro | Confermato |
| **Michelangelo** | Ala | Centrocampista Centrale | Confermato |
| **Pino** | Centrocampista Centrale | Attaccante | Confermato |
| **Riccardo** | Attaccante | Centrocampista Centrale | Confermato |
| **SalvoM (Tu)** | Centrocampista Centrale | Ala Destra, Attaccante, Ala Sinistra | Confermato |
| **Saverio LB** | Ala Destra | Ala Sinistra | Confermato |
| **SergioF** | **Terzino Destro** | **Terzino Sinistro, Ala Sinistra, Ala Destra** | ✅ **Aggiornato su DB** |
| **StefanoV** | **Attaccante** | **Ala Sinistra, Ala Destra, Centrocampista Centrale** | ✅ **Aggiornato su DB** |
| **Tatò B** | Terzino Destro | Ala Destra | Confermato |
| **Tommaso LG** | Ala | *Nessuno* | Confermato |
| **Toni C** | Centrocampista Centrale | *Nessuno* | Confermato |
| **Venturi** | Centrocampista Centrale | Attaccante | Confermato |

---

## 2. Esito Allineamento Sondaggio vs Database (18 Votanti)

> [!IMPORTANT]
> **Esito Finale: 18 su 18 (100% CENSITI E 100% ALLINEATI)**  
> Con i recenti aggiornamenti manuali al database per **Alessandro F**, **AntonioS**, **SergioF** e **StefanoV**, tutti i 18 partecipanti al sondaggio rispecchiano fedelmente a sistema le preferenze espresse.

---

## 3. Logica di Matching Applicata: Nomi WhatsApp ➔ Nomi nel Database

I nomi esportati dal sondaggio di WhatsApp differiscono dai record del database a causa di abbreviazioni, iniziali del cognome per disambiguare omonimi e formattazioni della rubrica. Di seguito il dettaglio esatto della corrispondenza adottata:

| # | Nome nel Sondaggio WhatsApp | Nome su DB ElFutbol | Criterio e Logica di Matching |
| :-: | :--- | :--- | :--- |
| **1** | **Tu** | `SalvoM` | In WhatsApp, l'account che esporta o visualizza il sondaggio mostra se stesso come **"Tu"**. Nel database corrisponde a Salvatore / Salvo M. (`SalvoM`), i cui voti espressi (CC preferito, Ala/Attaccante alternativi) combaciano 1:1 con il profilo registrato. |
| **2** | **Pino** | `Pino` | **Match Esatto (1:1):** Nome identico in rubrica e nel DB. |
| **3** | **Venturi** | `Venturi` | **Match Esatto (1:1):** Cognome identico sia nel sondaggio sia nel DB. |
| **4** | **Davide Cugino** | `Davide A` | **Disambiguazione Parentela / Iniziale Cognome:** Su WhatsApp è memorizzato come *"Davide Cugino"*. Nel DB è censito come `Davide A` (Davide Amato, iniziale A). I ruoli espressi (CC preferito, Difensore alternativo) combaciano con il DB. |
| **5** | **~Alessandro Buttitta** | `Ale Buttitta` | **Nome Profilo WhatsApp ➔ Diminutivo:** La tilde `~` indica il nome visualizzato del profilo WhatsApp. Nel DB *"Alessandro"* è censito col consueto diminutivo `Ale Buttitta`. |
| **6** | **Füll** | `Fulì` | **Nickname / Variante Fonetica:** "Füll" (con umlaut, richiamo a Füllkrug o soprannome del gruppo) corrisponde a `Fulì` nel DB (unico difensore con tale radice onomastica). |
| **7** | **Giuseppe La Bianca La Bianca** | `Giuseppe LB` | **Cognome per Esteso ➔ Sigla Iniziali:** Su WhatsApp appare con il cognome ripetuto (*La Bianca La Bianca*). Nel database i cognomi composti sono abbreviati con le iniziali delle due parole per non sforare nei badge di gara (`LB`). |
| **8** | **Marco** | `MarcoM` | **Disambiguazione Omonimo Giocatore di Movimento:** Nel DB ci sono due Marco: `(P) Marco C` (Portiere) e `MarcoM` (Difensore). Avendo votato Difensore/Terzino, il match è univoco su `MarcoM`. |
| **9** | **GiuseppeG** / **~Giuseppe G** | `Giuseppe G` | **Spaziatura Iniziale:** Su WhatsApp compare privo di spazio (`GiuseppeG`) o con tilde. Nel DB è separato da spazio (`Giuseppe G`) per distinguerlo da Giuseppe LB e GiuseppeR. |
| **10** | **Giuseppe Ranieri** | `GiuseppeR` | **Cognome Completo ➔ Iniziale Attaccata:** Su WhatsApp è presente con nome e cognome. Nel DB il cognome Ranieri è abbreviato con l'iniziale `R` attaccata (`GiuseppeR`). |
| **11** | **Michelangelo Spanò** | `Michelangelo` | **Nome Completo ➔ Nome Singolo:** Essendo l'unico Michelangelo del gruppo, nel DB è registrato senza il cognome Spanò. |
| **12** | **Riccardo** / **Riccardo Amico Marco** | `Riccardo` | **Disambiguazione Rubrica:** Nel primo sondaggio è votato come *"Riccardo"*, nel secondo come *"Riccardo Amico Marco"*. Nel DB è il titolare `Riccardo` (a cui fanno riferimento anche i due parenti/amici `Ciccio (Nipote Riccardo)` e `Luca (Amico Riccardo)`). |
| **13** | **Gino Piro** | `Gino` | **Nome Completo ➔ Nome Singolo:** Unico Gino presente, censito come `Gino` nel DB (ha votato solo Ruolo Alternativo: Difensore). |
| **14** | **Saverio Lo Buglio** | `Saverio LB` | **Cognome Completo ➔ Sigla Iniziali:** Come per La Bianca, il cognome Lo Buglio è contratto nelle iniziali `LB` (`Saverio LB`), con corsie offensive destra/sinistra. |
| **15** | **Alessandro Fidenco** | `Alessandro F` | **Disambiguazione Omonimi "Ale":** Nel DB sono presenti 4 Alessandro (`Ale Buttitta`, `Ale Casa`, `Ale LM`, `Alessandro F`). "Alessandro Fidenco" corrisponde inequivocabilmente ad `Alessandro F` (iniziale del cognome Fidenco). |
| **16** | **Sergio Fidenco** | `SergioF` | **Nome Completo ➔ Iniziale Attaccata:** Il cognome Fidenco è abbreviato con la `F` attaccata al nome (`SergioF`). |
| **17** | **Antonio Sunseri** | `AntonioS` | **Nome Completo ➔ Iniziale Attaccata:** Il cognome Sunseri è abbreviato con la `S` attaccata al nome (`AntonioS`). |
| **18** | **StefanoV** / **Stefanov** | `StefanoV` | **Match Sostanziale:** Differisce solo per le maiuscole dell'iniziale del cognome V (`StefanoV`). |

---

## 4. Giocatori Censiti su DB Esterni al Sondaggio (8 Giocatori)

Questi giocatori sono regolarmente presenti nella tabella `Giocatori` di ElFutbol ma non hanno partecipato al sondaggio:
1. `(P) Marco C` (Portiere)
2. `Ale Casa` (Centrocampista Centrale)
3. `Ale LM` (Ala)
4. `Ciccio (Nipote Riccardo)` (Attaccante)
5. `Luca (Amico Riccardo)` (Attaccante)
6. `Tatò B` (Terzino Destro / Ala Destra)
7. `Tommaso LG` (Ala)
8. `Toni C` (Centrocampista Centrale)
*(Oltre al portiere ospite ricorrente `(P) Amico Filippo`).*
