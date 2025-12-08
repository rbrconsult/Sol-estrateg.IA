export interface Proposal {
  id: string;
  etapa: string;
  projetoId: string;
  nomeCliente: string;
  clienteTelefone: string;
  clienteEmail: string;
  status: 'Aberto' | 'Ganho' | 'Perdido';
  responsavel: string;
  representante: string;
  valorProposta: number;
  potenciaSistema: number;
  nomeProposta: string;
  dataCriacaoProjeto: string;
  dataCriacaoProposta: string;
  slaProposta: number;
  ultimaAtualizacao: string;
  motivoPerda?: string;
  numAtividades: number;
}

export const etapas = [
  'Lead',
  'Qualificação',
  'Visita Técnica',
  'Proposta Enviada',
  'Negociação',
  'Fechamento'
];

export const motivosPerda = [
  'Preço alto',
  'Concorrência',
  'Cliente desistiu',
  'Financiamento negado',
  'Prazo inadequado',
  'Sem retorno'
];

export const vendedores = [
  'Carlos Silva',
  'Ana Rodrigues',
  'Pedro Santos',
  'Mariana Costa',
  'Lucas Oliveira'
];

export const preVendedores = [
  'Julia Mendes',
  'Rafael Souza',
  'Beatriz Lima',
  'Thiago Alves'
];

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateProposal(index: number): Proposal {
  const status: ('Aberto' | 'Ganho' | 'Perdido')[] = ['Aberto', 'Ganho', 'Perdido'];
  const randomStatus = status[Math.floor(Math.random() * 3)];
  const etapa = randomStatus === 'Aberto' 
    ? etapas[Math.floor(Math.random() * etapas.length)]
    : randomStatus === 'Ganho' 
      ? 'Fechamento' 
      : etapas[Math.floor(Math.random() * 4)];

  const baseValue = 15000 + Math.random() * 85000;
  const potencia = 3 + Math.random() * 17;

  return {
    id: `PROP-${String(index).padStart(4, '0')}`,
    etapa,
    projetoId: `PROJ-${String(index).padStart(4, '0')}`,
    nomeCliente: [
      'Empresa ABC Ltda',
      'Indústria XYZ',
      'Comércio Central',
      'Tech Solutions',
      'Solar Energy Co',
      'Green Building',
      'Eco Systems',
      'Smart Factory',
      'Residencial Parque',
      'Fazenda Boa Vista'
    ][Math.floor(Math.random() * 10)] + ` ${index}`,
    clienteTelefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    clienteEmail: `contato${index}@email.com`,
    status: randomStatus,
    responsavel: vendedores[Math.floor(Math.random() * vendedores.length)],
    representante: preVendedores[Math.floor(Math.random() * preVendedores.length)],
    valorProposta: Math.round(baseValue * 100) / 100,
    potenciaSistema: Math.round(potencia * 10) / 10,
    nomeProposta: `Sistema Fotovoltaico ${Math.round(potencia)}kWp`,
    dataCriacaoProjeto: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 1)),
    dataCriacaoProposta: randomDate(new Date(2024, 0, 5), new Date(2024, 11, 5)),
    slaProposta: Math.floor(Math.random() * 48) + 24,
    ultimaAtualizacao: randomDate(new Date(2024, 10, 1), new Date(2024, 11, 8)),
    motivoPerda: randomStatus === 'Perdido' ? motivosPerda[Math.floor(Math.random() * motivosPerda.length)] : undefined,
    numAtividades: Math.floor(Math.random() * 15) + 1
  };
}

export const mockProposals: Proposal[] = Array.from({ length: 150 }, (_, i) => generateProposal(i + 1));

// Adjust distribution to be more realistic
mockProposals.forEach((p, i) => {
  if (i < 30) p.status = 'Ganho';
  else if (i < 60) p.status = 'Perdido';
  else p.status = 'Aberto';
  
  if (p.status === 'Ganho') p.etapa = 'Fechamento';
  if (p.status === 'Perdido') {
    p.motivoPerda = motivosPerda[Math.floor(Math.random() * motivosPerda.length)];
  }
  if (p.status === 'Aberto') {
    p.etapa = etapas[Math.floor(Math.random() * etapas.length)];
    p.motivoPerda = undefined;
  }
});

export function getKPIs(proposals: Proposal[]) {
  const totalNegocios = proposals.length;
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  
  const valorPipeline = abertos.reduce((acc, p) => acc + p.valorProposta, 0);
  const valorGanho = ganhos.reduce((acc, p) => acc + p.valorProposta, 0);
  const valorPerdido = perdidos.reduce((acc, p) => acc + p.valorProposta, 0);
  
  const taxaConversao = totalNegocios > 0 ? (ganhos.length / totalNegocios) * 100 : 0;
  const ticketMedio = ganhos.length > 0 ? valorGanho / ganhos.length : 0;
  
  return {
    totalNegocios,
    negociosAbertos: abertos.length,
    negociosGanhos: ganhos.length,
    negociosPerdidos: perdidos.length,
    valorPipeline,
    valorGanho,
    valorPerdido,
    taxaConversao,
    ticketMedio,
    cicloMedioVendas: 18 // days average
  };
}

export function getFunnelData(proposals: Proposal[]) {
  return etapas.map((etapa, index) => {
    const etapaProposals = proposals.filter(p => p.etapa === etapa || 
      (p.status === 'Ganho' && etapas.indexOf(etapa) <= etapas.indexOf('Fechamento')) ||
      (p.status === 'Perdido' && etapas.indexOf(p.etapa) >= index)
    );
    
    const abertosNaEtapa = proposals.filter(p => p.etapa === etapa && p.status === 'Aberto');
    const valor = abertosNaEtapa.reduce((acc, p) => acc + p.valorProposta, 0);
    
    return {
      etapa,
      quantidade: abertosNaEtapa.length + (etapa === 'Fechamento' ? proposals.filter(p => p.status === 'Ganho').length : 0),
      valor,
      taxaConversao: index === 0 ? 100 : Math.max(20, 100 - (index * 15) + Math.random() * 10)
    };
  });
}

export function getVendedorPerformance(proposals: Proposal[]) {
  return vendedores.map(vendedor => {
    const vendedorProposals = proposals.filter(p => p.responsavel === vendedor);
    const ganhos = vendedorProposals.filter(p => p.status === 'Ganho');
    const perdidos = vendedorProposals.filter(p => p.status === 'Perdido');
    const abertos = vendedorProposals.filter(p => p.status === 'Aberto');
    
    return {
      nome: vendedor,
      totalPropostas: vendedorProposals.length,
      ganhos: ganhos.length,
      perdidos: perdidos.length,
      abertos: abertos.length,
      valorTotal: ganhos.reduce((acc, p) => acc + p.valorProposta, 0),
      taxaConversao: vendedorProposals.length > 0 
        ? (ganhos.length / vendedorProposals.length) * 100 
        : 0,
      atividades: vendedorProposals.reduce((acc, p) => acc + p.numAtividades, 0)
    };
  });
}

export function getPreVendedorPerformance(proposals: Proposal[]) {
  return preVendedores.map(rep => {
    const repProposals = proposals.filter(p => p.representante === rep);
    const ganhos = repProposals.filter(p => p.status === 'Ganho');
    
    return {
      nome: rep,
      leadsTrabalhos: repProposals.length,
      convertidos: ganhos.length,
      taxaConversao: repProposals.length > 0 
        ? (ganhos.length / repProposals.length) * 100 
        : 0,
      atividades: repProposals.reduce((acc, p) => acc + p.numAtividades, 0)
    };
  });
}

export function getMotivosPerda(proposals: Proposal[]) {
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  
  return motivosPerda.map(motivo => {
    const motivoProposals = perdidos.filter(p => p.motivoPerda === motivo);
    return {
      motivo,
      quantidade: motivoProposals.length,
      valor: motivoProposals.reduce((acc, p) => acc + p.valorProposta, 0)
    };
  }).sort((a, b) => b.quantidade - a.quantidade);
}

export function getMonthlyData(proposals: Proposal[]) {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  return months.map((mes, index) => {
    const monthProposals = proposals.filter(p => {
      const date = new Date(p.dataCriacaoProjeto);
      return date.getMonth() === index;
    });
    
    const ganhos = monthProposals.filter(p => p.status === 'Ganho');
    
    return {
      mes,
      iniciados: monthProposals.length,
      valorFechado: ganhos.reduce((acc, p) => acc + p.valorProposta, 0),
      taxaConversao: monthProposals.length > 0 
        ? (ganhos.length / monthProposals.length) * 100 
        : 0
    };
  });
}
