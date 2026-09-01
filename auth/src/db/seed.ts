import { db } from "./database";
import { USUARIOS_INICIAIS } from "../data/usuarios";

export function seedUsuarios() {
    const insert = db.prepare(`
    INSERT OR REPLACE INTO usuarios (
      id, username, senha_hash, limite_gasto
    ) VALUES (
      @id, @username, @senhaHash, @limiteGasto
    )
  `);

    const insertMany = db.transaction((usuarios) => {
        for (const usuario of usuarios) {
            insert.run(usuario);
        }
    });

    insertMany(USUARIOS_INICIAIS);
    console.log(`✅ Seed concluído: ${USUARIOS_INICIAIS.length} usuários inseridos no SQLite (auth.db).`);
}

seedUsuarios();