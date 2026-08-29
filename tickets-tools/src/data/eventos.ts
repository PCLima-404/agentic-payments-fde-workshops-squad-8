import { db } from "../db/database";
import { Evento } from "../types";

// Catálogo de eventos de tecnologia.
export const EVENTOS_INICIAIS: Evento[] = [
    {
        id: "evt_001",
        nome: "Workshop: Agentes Inteligentes com MCP e TypeScript",
        categoria: "Workshop",
        preco: 120.00,
        moeda: "BRL",
        vagasTotais: 30,
        vagasRestantes: 30
    },
    {
        id: "evt_002",
        nome: "Hackathon Universitário de IA Generativa",
        categoria: "Hackathon",
        preco: 45.00,
        moeda: "BRL",
        vagasTotais: 50,
        vagasRestantes: 50
    },
    {
        id: "evt_003",
        nome: "Conferência Global de Engenharia de Software 2026",
        categoria: "Conferência",
        preco: 1150.00, // Preço alto para testar 'LIMITE_EXCEDIDO'
        moeda: "BRL",
        vagasTotais: 15,
        vagasRestantes: 15
    },
    {
        id: "evt_004",
        nome: "Meetup: Rust, Performance e Sistemas Distribuídos",
        categoria: "Meetup",
        preco: 25.00,
        moeda: "BRL",
        vagasTotais: 40,
        vagasRestantes: 40
    },
    {
        id: "evt_005",
        nome: "Imersão DevOps & Arquitetura Cloud Native",
        categoria: "Curso",
        preco: 290.00,
        moeda: "BRL",
        vagasTotais: 2,
        vagasRestantes: 2
    },
    {
        id: "evt_006",
        nome: "Masterclass: Segurança Ofensiva & DevSecOps",
        categoria: "Workshop",
        preco: 180.00,
        moeda: "BRL",
        vagasTotais: 20,
        vagasRestantes: 20
    }
];

// Retorna os eventos cadastrados, com filtro opcional por categoria.
export function listarEventos(categoria?: string): Evento[] {
    if (categoria) {
        const stmt = db.prepare(`
      SELECT 
        id, nome, categoria, preco, moeda, 
        vagas_totais AS vagasTotais, 
        vagas_restantes AS vagasRestantes 
      FROM eventos 
      WHERE LOWER(categoria) = LOWER(?)
    `);
        return stmt.all(categoria) as Evento[];
    }
    const stmt = db.prepare(`
    SELECT 
      id, nome, categoria, preco, moeda, 
      vagas_totais AS vagasTotais, 
      vagas_restantes AS vagasRestantes 
    FROM eventos
  `);
    return stmt.all() as Evento[];
}

//Busca um evento pelo ID.
export function buscarEventoPorId(id: string): Evento | undefined {
    const stmt = db.prepare(`
    SELECT 
      id, nome, categoria, preco, moeda, 
      vagas_totais AS vagasTotais, 
      vagas_restantes AS vagasRestantes 
    FROM eventos 
    WHERE id = ?
  `);
    return stmt.get(id) as Evento | undefined;
}

// Subtrai a quantidade de ingressos comprados do saldo de vagas disponíveis no evento, garantindo que o estoque não fique negativo.
export function decrementarVagas(id: string, quantidade: number): boolean {
    const stmt = db.prepare(`
    UPDATE eventos 
    SET vagas_restantes = vagas_restantes - ? 
    WHERE id = ? AND vagas_restantes >= ?
  `);
    const info = stmt.run(quantidade, id, quantidade);
    return info.changes > 0;
}

// Restaura/estorna a quantidade de vagas disponíveis em caso de expiração de intenção,
// garantindo atomicidade e limitando o saldo ao teto original de vagas_totais.
export function incrementarVagas(id: string, quantidade: number): boolean {
    if (quantidade <= 0) return false;

    const stmt = db.prepare(`
    UPDATE eventos 
    SET vagas_restantes = MIN(vagas_totais, vagas_restantes + ?) 
    WHERE id = ?
  `);
    const info = stmt.run(quantidade, id);
    return info.changes > 0;
}