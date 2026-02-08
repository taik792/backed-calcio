import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Campionati supportati (TheSportsDB)
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
  res.send("Backend calcio attivo ✅");
});

function formatDate(d){
  return d.toISOString().split("T")[0];
}

app.get("/partite", async (req, res) => {
  try {
    const giorno = req.query.giorno || "today";
    const now = new Date();

    let date;
    if (giorno === "yesterday") {
      date = new Date(now);
      date.setDate(date.getDate() - 1);
    } else if (giorno === "tomorrow") {
      date = new Date(now);
      date.setDate(date.getDate() + 1);
    } else {
      date = now;
    }

    const dataQuery = formatDate(date);
    let risultati = [];

    for (const league of LEAGUES) {
      const r = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${dataQuery}&l=${league.name}`
      );
      const d = await r.json();
      if (!d.events) continue;

      d.events.forEach(ev => {
        risultati.push({
          lega: ev.strLeague,
          casa: ev.strHomeTeam,
          trasferta: ev.strAwayTeam,
          data: ev.dateEvent,
          ora: ev.strTime || "TBD"
        });
      });
    }

    // rimuove duplicati
    const unici = [];
    const chiavi = new Set();
    for (const p of risultati) {
      const k = p.lega + p.casa + p.trasferta + p.data;
      if (!chiavi.has(k)) {
        chiavi.add(k);
        unici.push(p);
      }
    }

    res.json(unici);
  } catch (e) {
    res.status(500).json({ error: "Errore backend" });
  }
});

app.listen(PORT, () => {
  console.log("Backend avviato sulla porta " + PORT);
});
