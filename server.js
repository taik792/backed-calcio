import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Campionati supportati
const LEAGUES = [
  { id: 4332, name: "Serie A" },
  { id: 4394, name: "Serie B" },
  { id: 4328, name: "Premier League" },
  { id: 4335, name: "La Liga" },
  { id: 4331, name: "Bundesliga" },
  { id: 4334, name: "Ligue 1" },
  { id: 4480, name: "Champions League" },
  { id: 4500, name: "Europa League" }
];

// Homepage
app.get("/", (req, res) => {
  res.send("Backend calcio attivo ✅");
});

app.get("/partite", async (req, res) => {
  try {
    const giorno = req.query.giorno || "today";
    const now = new Date();

    const start = new Date(now);
    if (giorno === "tomorrow") start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    let tutte = [];

    for (const league of LEAGUES) {
      const r = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league.id}`
      );
      const d = await r.json();
      if (!d.events) continue;

      d.events.forEach(ev => {
        const t = new Date(ev.dateEvent + "T" + (ev.strTime || "20:00"));
        tutte.push({
          lega: ev.strLeague || league.name,
          casa: ev.strHomeTeam,
          trasferta: ev.strAwayTeam,
          data: ev.dateEvent,
          ora: ev.strTime || "TBD",
          timestamp: t.getTime()
        });
      });
    }

    let risultato = tutte.filter(
      p => p.timestamp >= start.getTime() && p.timestamp <= end.getTime()
    );

    if (risultato.length === 0) {
      risultato = tutte
        .filter(p => p.timestamp > now.getTime())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 20);
    }

    res.json(risultato);
  } catch (e) {
    res.status(500).json({ error: "Errore backend" });
  }
});

app.listen(PORT, () => {
  console.log("Backend avviato sulla porta " + PORT);
});
