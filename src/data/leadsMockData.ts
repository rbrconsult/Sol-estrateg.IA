import { addDays, setHours, setMinutes, startOfMonth, subDays } from "date-fns";

export interface Lead {
  id: string;
  data_entrada: Date;
  origem: "Meta" | "Landing Page" | "Site" | "Orçamento" | "Orgânico";
  nome: string;
  telefone: string;
  cidade: string;
  uf: string;
  gasto_mensal: number;
  status: "qualificado" | "desqualificado" | "pendente";
  tipo_agendamento: "whatsapp" | "reuniao_online" | "ligacao" | null;
  robo_mensagens: number;
  robo_tempo_resposta_lead: number; // seconds
  robo_tempo_fup_frio: number; // seconds
  robo_atendeu: boolean;
}

const nomes = [
  "João Silva", "Maria Oliveira", "Carlos Santos", "Ana Costa", "Pedro Souza",
  "Fernanda Lima", "Ricardo Almeida", "Juliana Pereira", "Lucas Ferreira", "Camila Rocha",
  "Bruno Martins", "Patrícia Araújo", "Gustavo Barbosa", "Larissa Ribeiro", "Thiago Mendes",
  "Amanda Gomes", "Rafael Cardoso", "Beatriz Nascimento", "Diego Correia", "Isabela Dias",
  "Matheus Teixeira", "Natália Moreira", "Felipe Carvalho", "Vanessa Nunes", "Rodrigo Pinto",
  "Gabriela Duarte", "Leonardo Castro", "Mariana Vieira", "André Monteiro", "Letícia Campos",
  "Hugo Freitas", "Tatiana Melo", "Vinícius Ramos", "Daniela Cunha", "Caio Lopes",
  "Priscila Azevedo", "Eduardo Fonseca", "Aline Machado", "Marcelo Borges", "Renata Cavalcanti",
  "Alexandre Sampaio", "Raquel Siqueira", "Fábio Rezende", "Cláudia Brito", "Paulo Nogueira",
  "Simone Aguiar", "Roberto Leite", "Viviane Peixoto", "Henrique Xavier", "Luciana Andrade",
  "Cristiano Moura", "Elaine Dantas", "Fernando Bastos", "Débora Rangel", "Sérgio Lacerda",
  "Adriana Tavares", "Jorge Farias", "Karina Medeiros", "Otávio Reis", "Sandra Braga",
  "Marcos Paulo", "Lúcia Helena", "Ronaldo Costa", "Marta Silveira", "Tiago Albuquerque",
  "Carla Barreto", "Antônio Mendonça", "Elisa Fontes", "Wagner Prado", "Raissa Queiroz",
  "Guilherme Pacheco", "Paula Amorim", "Nelson Assis", "Jéssica Bezerra", "Ivan Coelho",
  "Denise Flores", "Renan Magalhães", "Heloísa Franco", "Leandro Guedes", "Cintia Vasconcelos",
];

const cidades: { cidade: string; uf: string; peso: number }[] = [
  { cidade: "Belo Horizonte", uf: "MG", peso: 20 },
  { cidade: "Uberlândia", uf: "MG", peso: 8 },
  { cidade: "Contagem", uf: "MG", peso: 6 },
  { cidade: "Juiz de Fora", uf: "MG", peso: 5 },
  { cidade: "Betim", uf: "MG", peso: 4 },
  { cidade: "Montes Claros", uf: "MG", peso: 3 },
  { cidade: "São Paulo", uf: "SP", peso: 12 },
  { cidade: "Campinas", uf: "SP", peso: 5 },
  { cidade: "Rio de Janeiro", uf: "RJ", peso: 10 },
  { cidade: "Niterói", uf: "RJ", peso: 3 },
  { cidade: "Vitória", uf: "ES", peso: 6 },
  { cidade: "Vila Velha", uf: "ES", peso: 4 },
  { cidade: "Goiânia", uf: "GO", peso: 4 },
  { cidade: "Brasília", uf: "DF", peso: 5 },
  { cidade: "Ribeirão Preto", uf: "SP", peso: 3 },
  { cidade: "Governador Valadares", uf: "MG", peso: 2 },
];

function weightedRandom<T>(items: T[], getWeight: (item: T) => number): T {
  const totalWeight = items.reduce((s, i) => s + getWeight(i), 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= getWeight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  const ddd = [31, 11, 21, 27, 34, 62, 61][randomInt(0, 6)];
  return `(${ddd}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

const origens: { valor: Lead["origem"]; peso: number }[] = [
  { valor: "Meta", peso: 40 },
  { valor: "Landing Page", peso: 25 },
  { valor: "Site", peso: 15 },
  { valor: "Orçamento", peso: 12 },
  { valor: "Orgânico", peso: 8 },
];

const statusOptions: { valor: Lead["status"]; peso: number }[] = [
  { valor: "qualificado", peso: 45 },
  { valor: "desqualificado", peso: 30 },
  { valor: "pendente", peso: 25 },
];

// hour weights: peak 9-12, 14-17
const hourWeights: number[] = Array.from({ length: 24 }, (_, h) => {
  if (h >= 9 && h <= 11) return 12;
  if (h >= 14 && h <= 16) return 10;
  if (h >= 7 && h <= 8) return 5;
  if (h >= 12 && h <= 13) return 6;
  if (h >= 17 && h <= 19) return 4;
  return 1;
});

// day of week weights (0=Sun, 6=Sat)
const dayWeights = [2, 10, 10, 10, 9, 8, 3]; // Sun..Sat

function generateLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  const baseDate = startOfMonth(new Date());

  for (let i = 0; i < count; i++) {
    const dayOffset = randomInt(0, 59); // last 60 days
    let date = subDays(baseDate, randomInt(0, 5));
    date = addDays(date, -dayOffset);

    // Weight by day of week - retry if needed
    const dow = date.getDay();
    if (Math.random() > dayWeights[dow] / 10) {
      // shift to a weekday
      const shift = dow === 0 ? 1 : dow === 6 ? -1 : 0;
      date = addDays(date, shift);
    }

    // Weighted hour
    const hourItems = hourWeights.map((w, h) => ({ h, w }));
    const hour = weightedRandom(hourItems, (x) => x.w).h;
    date = setHours(setMinutes(date, randomInt(0, 59)), hour);

    const origem = weightedRandom(origens, (o) => o.peso).valor;
    const status = weightedRandom(statusOptions, (s) => s.peso).valor;
    const loc = weightedRandom(cidades, (c) => c.peso);
    const roboAtendeu = Math.random() > 0.15;

    let tipoAgendamento: Lead["tipo_agendamento"] = null;
    if (status === "qualificado") {
      const r = Math.random();
      if (r < 0.45) tipoAgendamento = "whatsapp";
      else if (r < 0.75) tipoAgendamento = "reuniao_online";
      else tipoAgendamento = "ligacao";
    }

    leads.push({
      id: `lead-${String(i + 1).padStart(3, "0")}`,
      data_entrada: date,
      origem,
      nome: nomes[i % nomes.length],
      telefone: generatePhone(),
      cidade: loc.cidade,
      uf: loc.uf,
      gasto_mensal: randomInt(200, 8000),
      status,
      tipo_agendamento: tipoAgendamento,
      robo_mensagens: roboAtendeu ? randomInt(3, 25) : 0,
      robo_tempo_resposta_lead: randomInt(30, 7200),
      robo_tempo_fup_frio: status !== "qualificado" ? randomInt(3600, 172800) : randomInt(1800, 43200),
      robo_atendeu: roboAtendeu,
    });
  }

  return leads.sort((a, b) => b.data_entrada.getTime() - a.data_entrada.getTime());
}

export const mockLeads: Lead[] = generateLeads(80);
