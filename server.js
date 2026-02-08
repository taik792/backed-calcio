import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const LEAGUE_ID = 4332; // Serie A

app.get("/partite", async (req, res) => {
  try {
    const giorno = req.query.giorno || "today";

    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${LEAGUE_ID}`
    );
    const data = await response.json();

    if (!data.events) {
      return res.json([]);
    }

    const now = new Date();
    const start = new Date(now);
    if (giorno === "tomorrow") start.setDate(start.getDate() + 1);
    start.setHours(0,0,0,0);

    const end = new Date(start);
    end.setHours(23,59,59,999);

    const partite = data.events.filter(ev => {
      const d = new Date(ev.dateEvent + "T" + (ev.strTime || "20:00"));
      return d >= start && d <= end;
    });

    res.json(partite);
  } catch (e) {
    res.status(500).json({ error: "Errore backend" });
  }
});

app.listen(PORT, () => {
  console.log("Backend avviato su porta " + PORT);
});
