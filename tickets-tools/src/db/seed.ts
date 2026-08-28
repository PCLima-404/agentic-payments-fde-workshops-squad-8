import { db } from "./database";
import { EVENTOS_INICIAIS } from "../data/eventos";

export function seedEventos() {
    const insert = db.prepare(`
    INSERT OR REPLACE INTO eventos (
      id, nome, categoria, preco, moeda, vagas_totais, vagas_restantes
    ) VALUES (
      @id, @nome, @categoria, @preco, @moeda, @vagasTotais, @vagasRestantes
    )
  `);

    const insertMany = db.transaction((eventos) => {
        for (const evento of eventos) {
            insert.run(evento);
        }
    });

    insertMany(EVENTOS_INICIAIS);
    console.log(`✅ Seed concluído: ${EVENTOS_INICIAIS.length} eventos inseridos no SQLite.`);
}

seedEventos();