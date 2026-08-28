// tickets-tools/tests/estorno.test.ts
// Suíte de testes para a regra de negócio de estorno e devolução de vagas de intenções expiradas.

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/db/database";
import {
  buscarEventoPorId,
  decrementarVagas,
  incrementarVagas,
} from "../src/data/eventos";
import {
  salvarIntencao,
  buscarIntencaoPorId,
  expirarIntencoesVencidas,
  atualizarStatusIntencao,
} from "../src/data/intencoes";
import { listarCatalogo } from "../src/tools/listarCatalogo";
import { registrarIntencao } from "../src/tools/registrarIntencao";
import { Intencao } from "../src/types";

describe("Regra de Negócio: Estorno e Devolução de Vagas de Intenções Expiradas", () => {
  beforeEach(() => {
    // Restaura o estado padrão do catálogo de eventos para garantir isolamento
    db.prepare(`
      UPDATE eventos SET vagas_restantes = vagas_totais
    `).run();

    // Limpa a tabela de intenções de testes anteriores
    db.prepare(`DELETE FROM intencoes`).run();
  });

  describe("incrementarVagas (data layer)", () => {
    it("deve incrementar as vagas disponíveis respeitando o teto de vagas_totais", () => {
      const eventoOriginal = buscarEventoPorId("evt_001")!;
      expect(eventoOriginal.vagasRestantes).toBe(30);

      // Decrementa 5 vagas
      decrementarVagas("evt_001", 5);
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(25);

      // Incrementa 3 vagas (estorno parcial)
      const incrementou = incrementarVagas("evt_001", 3);
      expect(incrementou).toBe(true);
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(28);

      // Tenta incrementar mais 10 vagas: deve travar no teto de 30 (vagas_totais)
      incrementarVagas("evt_001", 10);
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(30);
    });

    it("deve retornar false se quantidade for menor ou igual a zero", () => {
      expect(incrementarVagas("evt_001", 0)).toBe(false);
      expect(incrementarVagas("evt_001", -3)).toBe(false);
    });
  });

  describe("Estorno unitário ao consultar intenção vencida (buscarIntencaoPorId)", () => {
    it("deve marcar intenção como expirada e estornar as vagas automaticamente", () => {
      // 1. Reserva 2 vagas do evento evt_001
      decrementarVagas("evt_001", 2);
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(28);

      // 2. Salva intenção com expira_em no passado (já vencida)
      const intencaoExpirada: Intencao = {
        intencaoId: "int_expirada_001",
        eventoId: "evt_001",
        quantidade: 2,
        valorTotal: 240.0,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_001",
        expiraEm: new Date(Date.now() - 1000 * 60).toISOString(), // 1 min atrás
      };
      salvarIntencao(intencaoExpirada);

      // 3. Ao buscar a intenção, a expiração atômica deve ser disparada
      const intencaoBuscada = buscarIntencaoPorId("int_expirada_001");

      expect(intencaoBuscada).toBeDefined();
      expect(intencaoBuscada?.status).toBe("expirada");

      // 4. As 2 vagas devem ter retornado ao evento
      const eventoAtualizado = buscarEventoPorId("evt_001")!;
      expect(eventoAtualizado.vagasRestantes).toBe(30);
    });

    it("deve ser idempotente e não estornar vagas mais de uma vez em consultas repetidas", () => {
      decrementarVagas("evt_001", 3);
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(27);

      const intencaoExpirada: Intencao = {
        intencaoId: "int_idempotencia_001",
        eventoId: "evt_001",
        quantidade: 3,
        valorTotal: 360.0,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_001",
        expiraEm: new Date(Date.now() - 5000).toISOString(),
      };
      salvarIntencao(intencaoExpirada);

      // Primeira consulta: estorna as 3 vagas
      buscarIntencaoPorId("int_idempotencia_001");
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(30);

      // Consultas repetidas: o saldo DEVE permanecer 30 e não continuar aumentando
      buscarIntencaoPorId("int_idempotencia_001");
      buscarIntencaoPorId("int_idempotencia_001");
      buscarIntencaoPorId("int_idempotencia_001");

      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(30);
    });
  });

  describe("Segurança: não-estorno de intenções pagas", () => {
    it("não deve alterar status nem estornar vagas de uma intenção com status 'paga'", () => {
      // 1. Reserva 1 vaga e marca intenção como paga
      decrementarVagas("evt_002", 1);
      expect(buscarEventoPorId("evt_002")!.vagasRestantes).toBe(49);

      const intencaoPaga: Intencao = {
        intencaoId: "int_paga_001",
        eventoId: "evt_002",
        quantidade: 1,
        valorTotal: 45.0,
        moeda: "BRL",
        status: "paga",
        usuarioId: "usr_001",
        expiraEm: new Date(Date.now() - 1000 * 60).toISOString(), // prazo expirou, mas já está paga
      };
      salvarIntencao(intencaoPaga);

      // 2. Busca intenção paga
      const intencaoBuscada = buscarIntencaoPorId("int_paga_001");

      expect(intencaoBuscada?.status).toBe("paga");
      // As vagas NÃO devem ser repostas porque a compra foi efetivada
      expect(buscarEventoPorId("evt_002")!.vagasRestantes).toBe(49);
    });
  });

  describe("Estorno em lote (expirarIntencoesVencidas)", () => {
    it("deve varrer e estornar múltiplas intenções vencidas em uma única transação", () => {
      // Reserva vagas em 3 eventos diferentes
      decrementarVagas("evt_001", 2); // 30 -> 28
      decrementarVagas("evt_002", 5); // 50 -> 45
      decrementarVagas("evt_004", 4); // 40 -> 36

      const agora = Date.now();

      // 2 intenções vencidas e 1 ainda válida
      salvarIntencao({
        intencaoId: "int_lote_01",
        eventoId: "evt_001",
        quantidade: 2,
        valorTotal: 240,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_001",
        expiraEm: new Date(agora - 10000).toISOString(), // vencida
      });

      salvarIntencao({
        intencaoId: "int_lote_02",
        eventoId: "evt_002",
        quantidade: 5,
        valorTotal: 225,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_002",
        expiraEm: new Date(agora - 5000).toISOString(), // vencida
      });

      salvarIntencao({
        intencaoId: "int_lote_03_valida",
        eventoId: "evt_004",
        quantidade: 4,
        valorTotal: 100,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_003",
        expiraEm: new Date(agora + 60000).toISOString(), // ainda válida
      });

      // Executa o estorno em lote
      const totalEstornadas = expirarIntencoesVencidas();

      expect(totalEstornadas).toBe(2);

      // Eventos 001 e 002 devem ter as vagas restauradas
      expect(buscarEventoPorId("evt_001")!.vagasRestantes).toBe(30);
      expect(buscarEventoPorId("evt_002")!.vagasRestantes).toBe(50);

      // Evento 004 permanece com a vaga reservada pela intenção ainda válida
      expect(buscarEventoPorId("evt_004")!.vagasRestantes).toBe(36);
    });
  });

  describe("Integração com listar_catalogo", () => {
    it("deve liberar vagas expiradas automaticamente antes de retornar a listagem do catálogo", () => {
      // Reserva todas as 2 vagas do evento evt_005 (fica com 0 vagas)
      decrementarVagas("evt_005", 2);
      expect(buscarEventoPorId("evt_005")!.vagasRestantes).toBe(0);

      salvarIntencao({
        intencaoId: "int_catalogo_expirada",
        eventoId: "evt_005",
        quantidade: 2,
        valorTotal: 580,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_001",
        expiraEm: new Date(Date.now() - 1000).toISOString(),
      });

      // Chama listar_catalogo: deve disparar expirarIntencoesVencidas antes do SELECT
      const catalogo = listarCatalogo({ usuario_id: "usr_001" });
      const produto005 = catalogo.produtos.find((p) => p.id === "evt_005");

      expect(produto005).toBeDefined();
      expect(produto005?.estoque).toBe(2); // Vagas restauradas no catálogo
    });
  });

  describe("Integração com registrar_intencao (Prevenção de Denial of Inventory)", () => {
    it("deve liberar vagas expiradas e permitir novo registro mesmo sem consultar o catálogo previamente", () => {
      // Esgota as 2 vagas do evento evt_005 com uma intenção que expira
      decrementarVagas("evt_005", 2);
      expect(buscarEventoPorId("evt_005")!.vagasRestantes).toBe(0);

      salvarIntencao({
        intencaoId: "int_esgotou_e_expirou",
        eventoId: "evt_005",
        quantidade: 2,
        valorTotal: 580,
        moeda: "BRL",
        status: "pendente",
        usuarioId: "usr_antigo",
        expiraEm: new Date(Date.now() - 2000).toISOString(), // expirada
      });

      // Novo usuário chama diretamente registrar_intencao sem listar catálogo
      const novaIntencao = registrarIntencao({
        evento_id: "evt_005",
        quantidade: 1,
        usuario_id: "usr_novo",
      });

      // Deve aprovar com sucesso porque as vagas expiradas foram estornadas antes da checagem
      expect(novaIntencao).toHaveProperty("intencaoId");
      if ("intencaoId" in novaIntencao) {
        expect(novaIntencao.status).toBe("pendente");
        expect(novaIntencao.quantidade).toBe(1);
      }

      // Resta 1 vaga disponível
      expect(buscarEventoPorId("evt_005")!.vagasRestantes).toBe(1);
    });
  });
});
