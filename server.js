import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Campionati supportati (ID TheSportsDB)
const LEAGUES = [
  { id: 4332, name: "Serie A" },
  { id: 4394, name: "Serie B" },
  { id: 4328, name: "Premier League" },
  { id: 4335, name: "La Liga" },
  { id: 4331, name: "Bundesliga" },
  { id: 4334, name: "Ligue 1" },
  { id: 4329, name: "English League One" }
];

app.get("/", (req, res) => {
  res.send("Backend calcio attivo ✅ (versione stabile)");
});

function sameDay(d1, d2){
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

app.get("/partite", async (req, res) => {
  try {
    const giorno = req.query.giorno || "today";
    const now = new Date();

    let target = new Date(now);
    if (giorno === "yesterday") target.setDate(target.getDate() - 1);
    if (giorno === "tomorrow") target.setDate(target.getDate() + 1);

    let tutte = [];

    for (const league of LEAGUES) {
      const r = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league.id}`
      );
      const d = await r.json();
      if (!d.events) continue;

      d.events.forEach(ev => {
        if (!ev.dateEvent) return;
        const dt = new Date(ev.dateEvent + "T" + (ev.strTime || "12:00"));
        tutte.push({
          lega: ev.strLeague || league.name,
          casa: ev.strHomeTeam,
          trasferta: ev.strAwayTeam,
          data: ev.dateEvent,
          ora: ev.strTime || "TBD",
          timestamp: dt
        });
      });
    }

    // filtra per giorno
    let filtrate = tutte.filter(p => sameDay(p.timestamp, target));

    // se vuoto, fallback: mostra prossime partite
    if (filtrate.length === 0) {
      filtrate = tutte
        .filter(p => p.timestamp >= now)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 20);
    }

    // rimuove duplicati
    const unique = [];
    const seen = new Set();
    for (const p of filtrate) {
      const k = p.lega + p.casa + p.trasferta + p.data;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(p);
      }
    }

    res.json(unique);
  } catch (e) {
    res.status(500).json({ error: "Errore backend stabile" });
  }
});

app.listen(PORT, () => {
  console.log("Backend stabile avviato sulla porta " + PORT);
});
