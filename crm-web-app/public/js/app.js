/**
 * CRM Antonio Tritto - Frontend Application
 * Private Banking Dashboard
 */

// API Base URL
const API_BASE = '/api';

// State
let currentPage = 'dashboard';
let dashboardData = null;
let charts = {};

// Utility Functions
const formatCurrency = (value) => {
  if (value >= 1000000) {
    return '€' + (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return '€' + (value / 1000).toFixed(0) + 'K';
  }
  return '€' + value.toLocaleString('it-IT');
};

const formatNumber = (value) => {
  return value ? value.toLocaleString('it-IT') : '0';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT');
};

// API Functions
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Navigation
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => {
    navigateTo(item.dataset.page);
  });
});

function navigateTo(page) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });

  // Update pages
  document.querySelectorAll('.page-content').forEach(p => {
    p.classList.add('hidden');
  });
  document.getElementById(`page-${page}`).classList.remove('hidden');

  // Update header
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Panoramica performance e KPI' },
    contatti: { title: 'Contatti', subtitle: 'Gestione database contatti' },
    pipeline: { title: 'Pipeline', subtitle: 'Sales pipeline e opportunità' },
    contratti: { title: 'Contratti', subtitle: 'Gestione contratti clienti' },
    chiamate: { title: 'Chiamate', subtitle: 'Registro chiamate e follow-up' },
    aum: { title: 'AUM Tracking', subtitle: 'Gestione patrimonio' },
    analytics: { title: 'Analytics', subtitle: 'Analisi e statistiche' },
    report: { title: 'Report', subtitle: 'Report e export dati' }
  };

  document.getElementById('page-title').textContent = titles[page]?.title || page;
  document.getElementById('page-subtitle').textContent = titles[page]?.subtitle || '';

  currentPage = page;

  // Load page data
  loadPageData(page);
}

async function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'contatti':
      await loadContatti();
      break;
    case 'pipeline':
      await loadPipeline();
      break;
    case 'contratti':
      await loadContratti();
      break;
    case 'chiamate':
      await loadChiamate();
      break;
    case 'aum':
      await loadAUM();
      break;
    case 'analytics':
      await loadAnalytics();
      break;
  }
}

// Dashboard
async function loadDashboard() {
  try {
    dashboardData = await fetchAPI('/dashboard');

    // Update KPIs
    document.getElementById('kpi-aum').textContent = formatCurrency(dashboardData.kpi.aumTotale);
    document.getElementById('kpi-clienti').textContent = dashboardData.kpi.clientiAttivi;
    document.getElementById('kpi-pipeline').textContent = formatCurrency(dashboardData.kpi.valoreInPipeline);
    document.getElementById('kpi-pipeline-deals').textContent = `${dashboardData.kpi.dealAttivi} deal attivi`;
    document.getElementById('kpi-fee').textContent = formatCurrency(dashboardData.kpi.feeTotaleAnnuale);
    document.getElementById('kpi-conversion').textContent = `Tasso conv: ${dashboardData.kpi.tassoConversione}%`;

    // Update badges
    document.getElementById('badge-contatti').textContent = dashboardData.kpi.clientiAttivi;
    document.getElementById('badge-pipeline').textContent = dashboardData.kpi.dealAttivi;
    document.getElementById('badge-followup').textContent = dashboardData.alerts.followUpScaduti;

    // Render funnel
    renderFunnel(dashboardData.pipelinePerStage);

    // Render alerts
    renderAlerts(dashboardData.alerts);

    // Render top deals
    renderTopDeals(dashboardData.topDeal);

    // Render charts
    renderTierChart(dashboardData.clientiPerTier);
    renderActivityChart(dashboardData.attivita30giorni);
    renderAUMTrendChart(dashboardData.trendAUM);

    // Load performance
    const perfData = await fetchAPI('/dashboard/performance');
    renderPerformanceTable(perfData);

  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function renderFunnel(stages) {
  const container = document.getElementById('funnel-container');
  const maxValue = Math.max(...stages.map(s => s.valore), 1);

  const colors = {
    'Lead': '#1da1f2',
    'Contatto': '#0d8ed9',
    'Qualificato': '#17bf63',
    'Proposta Inviata': '#ffad1f',
    'Negoziazione': '#ff6b00',
    'Contratto Inviato': '#794bc4',
    'Contratto Firmato': '#5c3d99',
    'Cliente Attivo': '#00a651'
  };

  container.innerHTML = stages.map(stage => `
    <div class="funnel-stage">
      <span class="funnel-label">${stage.stage}</span>
      <div class="funnel-bar" style="width: ${(stage.valore / maxValue * 100)}%; background: ${colors[stage.stage] || '#1da1f2'};">
        ${stage.count}
      </div>
      <span class="funnel-value">${formatCurrency(stage.valore)}</span>
    </div>
  `).join('');
}

function renderAlerts(alerts) {
  const container = document.getElementById('alerts-container');

  const items = [
    {
      type: alerts.followUpScaduti > 0 ? 'critical' : 'info',
      icon: 'bi-telephone-x',
      title: 'Follow-up Scaduti',
      desc: 'Chiamate da recuperare',
      count: alerts.followUpScaduti
    },
    {
      type: alerts.dealInStallo > 0 ? 'warning' : 'info',
      icon: 'bi-hourglass-split',
      title: 'Deal in Stallo',
      desc: 'Più di 14 giorni',
      count: alerts.dealInStallo
    },
    {
      type: alerts.contrattiInScadenza > 0 ? 'warning' : 'info',
      icon: 'bi-calendar-x',
      title: 'Contratti in Scadenza',
      desc: 'Prossimi 60 giorni',
      count: alerts.contrattiInScadenza
    }
  ];

  container.innerHTML = items.map(item => `
    <div class="alert-item ${item.type}">
      <div class="alert-icon"><i class="bi ${item.icon}"></i></div>
      <div class="alert-content">
        <div class="alert-title">${item.title}</div>
        <div class="alert-description">${item.desc}</div>
      </div>
      <div class="alert-count">${item.count}</div>
    </div>
  `).join('');
}

function renderTopDeals(deals) {
  const container = document.getElementById('top-deals');

  if (!deals || deals.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nessun deal attivo</p></div>';
    return;
  }

  container.innerHTML = deals.map((deal, i) => `
    <div class="deal-item">
      <div class="deal-rank">${i + 1}</div>
      <div class="deal-info">
        <div class="deal-name">${deal.nome_deal}</div>
        <div class="deal-stage">${deal.stage} - ${deal.probabilita}%</div>
      </div>
      <div class="deal-value">${formatCurrency(deal.aum_previsto)}</div>
    </div>
  `).join('');
}

function renderTierChart(tiers) {
  const ctx = document.getElementById('tier-chart');
  if (!ctx) return;

  if (charts.tier) charts.tier.destroy();

  const colors = {
    'A+': '#e0245e',
    'A': '#ff6b00',
    'B': '#ffad1f',
    'C': '#17bf63'
  };

  charts.tier = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: tiers.map(t => `Tier ${t.tier}`),
      datasets: [{
        data: tiers.map(t => t.count),
        backgroundColor: tiers.map(t => colors[t.tier] || '#1da1f2'),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      cutout: '65%'
    }
  });

  // Legend
  const legend = document.getElementById('tier-legend');
  legend.innerHTML = tiers.map(t => `
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors[t.tier]}"></div>
      <span>Tier ${t.tier}</span>
      <span class="legend-value">${t.count}</span>
    </div>
  `).join('');
}

function renderActivityChart(data) {
  const ctx = document.getElementById('activity-chart');
  if (!ctx) return;

  if (charts.activity) charts.activity.destroy();

  charts.activity = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Chiamate', 'Email', 'Meeting', 'Nuovi', 'Chiusi'],
      datasets: [{
        data: [data.chiamate, data.email, data.meeting, data.nuovi_contatti, data.deal_chiusi],
        backgroundColor: ['#1da1f2', '#794bc4', '#17bf63', '#ffad1f', '#00a651'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#2f3d4d' },
          ticks: { color: '#8899a6' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8899a6' }
        }
      }
    }
  });
}

function renderAUMTrendChart(data) {
  const ctx = document.getElementById('aum-trend-chart');
  if (!ctx) return;

  if (charts.aumTrend) charts.aumTrend.destroy();

  charts.aumTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.mese),
      datasets: [
        {
          label: 'Entrate',
          data: data.map(d => d.entrate),
          borderColor: '#17bf63',
          backgroundColor: 'rgba(23, 191, 99, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Uscite',
          data: data.map(d => Math.abs(d.uscite || 0)),
          borderColor: '#e0245e',
          backgroundColor: 'rgba(224, 36, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#8899a6' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#2f3d4d' },
          ticks: {
            color: '#8899a6',
            callback: (value) => formatCurrency(value)
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8899a6' }
        }
      }
    }
  });
}

function renderPerformanceTable(data) {
  const tbody = document.getElementById('performance-table');

  if (!data.performance || data.performance.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td>
          <div class="agent-info">
            <div class="agent-avatar">AT</div>
            <span>Antonio Tritto</span>
          </div>
        </td>
        <td><span class="status-badge success">Attivo</span></td>
        <td>${data.chiamatePerAgente?.[0]?.chiamate_totali || 0}</td>
        <td>-</td>
        <td>-</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.performance.map(p => `
    <tr>
      <td>
        <div class="agent-info">
          <div class="agent-avatar">${p.responsabile?.substring(0, 2) || 'AT'}</div>
          <span>${p.responsabile || 'Antonio Tritto'}</span>
        </div>
      </td>
      <td><span class="status-badge success">Attivo</span></td>
      <td>${data.chiamatePerAgente?.[0]?.chiamate_totali || '-'}</td>
      <td>${p.deal_chiusi || 0}</td>
      <td>${formatCurrency(p.aum_acquisito || 0)}</td>
    </tr>
  `).join('');
}

// Contatti
async function loadContatti() {
  try {
    const params = new URLSearchParams();
    const tier = document.getElementById('filter-tier')?.value;
    const isCliente = document.getElementById('filter-cliente')?.value;
    const search = document.getElementById('search-contatti')?.value;

    if (tier) params.append('tier', tier);
    if (isCliente) params.append('is_cliente', isCliente);
    if (search) params.append('search', search);

    const data = await fetchAPI(`/contatti?${params}`);
    renderContattiTable(data.contatti);
  } catch (error) {
    console.error('Error loading contatti:', error);
  }
}

function renderContattiTable(contatti) {
  const tbody = document.getElementById('contatti-table');

  if (!contatti || contatti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun contatto trovato</td></tr>';
    return;
  }

  tbody.innerHTML = contatti.map(c => `
    <tr>
      <td>
        <div class="agent-info">
          <div class="agent-avatar" style="background: var(--gradient-${c.is_cliente ? 'green' : 'blue'})">
            ${(c.nome?.[0] || '') + (c.cognome?.[0] || '')}
          </div>
          <div>
            <div>${c.nome} ${c.cognome || ''}</div>
            <div class="text-muted" style="font-size: 12px;">${c.email || ''}</div>
          </div>
        </div>
      </td>
      <td>${c.azienda || '-'}</td>
      <td>${c.categoria || '-'}</td>
      <td><span class="status-badge ${c.tier === 'A+' ? 'danger' : c.tier === 'A' ? 'warning' : 'info'}">${c.tier}</span></td>
      <td>${c.engagement_score}/10</td>
      <td>${formatCurrency(c.aum_potenziale)}</td>
      <td>
        <button class="btn btn-secondary" onclick="editContatto(${c.id})" style="padding: 4px 8px;">
          <i class="bi bi-pencil"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Pipeline
async function loadPipeline(stage = '') {
  try {
    const params = stage ? `?stage=${encodeURIComponent(stage)}` : '';
    const data = await fetchAPI(`/pipeline${params}`);
    renderPipelineTable(data);
  } catch (error) {
    console.error('Error loading pipeline:', error);
  }
}

function renderPipelineTable(deals) {
  const tbody = document.getElementById('pipeline-table');

  if (!deals || deals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun deal trovato</td></tr>';
    return;
  }

  const stageColors = {
    'Lead': 'info',
    'Contatto': 'info',
    'Qualificato': 'success',
    'Proposta Inviata': 'warning',
    'Negoziazione': 'warning',
    'Contratto Inviato': 'info',
    'Contratto Firmato': 'success',
    'Cliente Attivo': 'success',
    'Chiuso Perso': 'danger'
  };

  tbody.innerHTML = deals.map(d => `
    <tr>
      <td>
        <div>
          <div style="font-weight: 500;">${d.nome_deal}</div>
          <div class="text-muted" style="font-size: 12px;">${d.contatto_nome || d.azienda || ''}</div>
        </div>
      </td>
      <td><span class="status-badge ${stageColors[d.stage] || 'info'}">${d.stage}</span></td>
      <td>${formatCurrency(d.aum_previsto)}</td>
      <td>${d.probabilita}%</td>
      <td class="${d.giorni_in_stage > 14 ? 'text-danger' : ''}">${d.giorni_in_stage}g</td>
      <td>${d.prossima_azione || '-'}</td>
      <td>
        <button class="btn btn-secondary" onclick="advanceDeal(${d.id})" style="padding: 4px 8px;" title="Avanza">
          <i class="bi bi-arrow-right"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Pipeline tabs
document.querySelectorAll('.tab[data-stage]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadPipeline(tab.dataset.stage);
  });
});

// Contratti
async function loadContratti() {
  try {
    const data = await fetchAPI('/contratti');
    renderContrattiTable(data);
  } catch (error) {
    console.error('Error loading contratti:', error);
  }
}

function renderContrattiTable(contratti) {
  const tbody = document.getElementById('contratti-table');

  if (!contratti || contratti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nessun contratto trovato</td></tr>';
    return;
  }

  const statoColors = {
    'Bozza': 'info',
    'Inviato': 'warning',
    'Attivo': 'success',
    'Scaduto': 'danger',
    'Annullato': 'danger'
  };

  tbody.innerHTML = contratti.map(c => `
    <tr>
      <td><code>${c.contratto_id}</code></td>
      <td>${c.cliente_nome}</td>
      <td>${c.tipo_contratto}</td>
      <td>${formatCurrency(c.aum)}</td>
      <td>${formatCurrency(c.fee_annuale)}</td>
      <td><span class="status-badge ${statoColors[c.stato] || 'info'}">${c.stato}</span></td>
      <td>${formatDate(c.data_scadenza)}</td>
      <td>
        <button class="btn btn-secondary" onclick="viewContratto(${c.id})" style="padding: 4px 8px;">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Chiamate
async function loadChiamate() {
  try {
    const [chiamate, oggi, stats] = await Promise.all([
      fetchAPI('/chiamate'),
      fetchAPI('/chiamate/oggi'),
      fetchAPI('/chiamate/stats')
    ]);

    document.getElementById('chiamate-oggi').textContent = stats.chiamateOggi;
    document.getElementById('followup-oggi').textContent = oggi.followUpOggi.length;
    document.getElementById('followup-scaduti').textContent = oggi.followUpScaduti.length;
    document.getElementById('tasso-successo').textContent = stats.tassoConversione + '%';

    renderChiamateTable(chiamate);
  } catch (error) {
    console.error('Error loading chiamate:', error);
  }
}

function renderChiamateTable(chiamate) {
  const tbody = document.getElementById('chiamate-table');

  if (!chiamate || chiamate.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessuna chiamata trovata</td></tr>';
    return;
  }

  const esitoColors = {
    'Interessato': 'success',
    'Appuntamento Fissato': 'success',
    'Non Interessato': 'danger',
    'Richiamare': 'warning',
    'No Risposta': 'info'
  };

  tbody.innerHTML = chiamate.map(c => `
    <tr>
      <td>${c.contatto_nome}</td>
      <td>${c.tipo_chiamata}</td>
      <td><span class="status-badge ${esitoColors[c.esito] || 'info'}">${c.esito || '-'}</span></td>
      <td>${c.livello_interesse || '-'}</td>
      <td>${formatDate(c.data_chiamata)}</td>
      <td class="${c.data_follow_up && new Date(c.data_follow_up) < new Date() && !c.follow_up_completato ? 'text-danger' : ''}">${formatDate(c.data_follow_up)}</td>
      <td>
        ${!c.follow_up_completato && c.data_follow_up ? `
          <button class="btn btn-success" onclick="completeFollowup(${c.id})" style="padding: 4px 8px;" title="Completa">
            <i class="bi bi-check"></i>
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

// AUM
async function loadAUM() {
  try {
    const [summary, operazioni] = await Promise.all([
      fetchAPI('/aum/summary'),
      fetchAPI('/aum?limit=10')
    ]);

    document.getElementById('aum-totale').textContent = formatCurrency(summary.aumTotale);
    document.getElementById('aum-acquisizioni').textContent = formatCurrency(summary.stats.totale_acquisizioni);
    document.getElementById('aum-performance').textContent = formatCurrency(
      summary.perTipo.find(t => t.tipo_operazione?.includes('Performance'))?.totale_variazione || 0
    );

    renderAUMTable(operazioni);
    renderAUMClientiChart(summary.perCliente);
  } catch (error) {
    console.error('Error loading AUM:', error);
  }
}

function renderAUMTable(operazioni) {
  const tbody = document.getElementById('aum-table');

  if (!operazioni || operazioni.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nessuna operazione</td></tr>';
    return;
  }

  tbody.innerHTML = operazioni.map(o => `
    <tr>
      <td>${o.cliente_nome}</td>
      <td>${o.tipo_operazione}</td>
      <td class="${o.variazione >= 0 ? 'text-success' : 'text-danger'}">${o.variazione >= 0 ? '+' : ''}${formatCurrency(o.variazione)}</td>
      <td>${formatCurrency(o.aum_nuovo)}</td>
    </tr>
  `).join('');
}

function renderAUMClientiChart(clienti) {
  const ctx = document.getElementById('aum-clienti-chart');
  if (!ctx) return;

  if (charts.aumClienti) charts.aumClienti.destroy();

  const topClienti = clienti.slice(0, 8);

  charts.aumClienti = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topClienti.map(c => c.cliente_nome.split(' ')[0]),
      datasets: [{
        label: 'AUM',
        data: topClienti.map(c => c.aum_attuale),
        backgroundColor: '#1da1f2',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: '#2f3d4d' },
          ticks: {
            color: '#8899a6',
            callback: (value) => formatCurrency(value)
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#8899a6' }
        }
      }
    }
  });
}

// Analytics
async function loadAnalytics() {
  try {
    const [canali, funnel, overview] = await Promise.all([
      fetchAPI('/analytics/canali'),
      fetchAPI('/analytics/funnel'),
      fetchAPI('/analytics/overview')
    ]);

    renderCanaliChart(canali);
    renderConversionChart(funnel.conversioniFunnel);
    renderVelocityChart(overview.velocity);
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

function renderCanaliChart(canali) {
  const ctx = document.getElementById('canali-chart');
  if (!ctx) return;

  if (charts.canali) charts.canali.destroy();

  charts.canali = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: canali.map(c => c.canale),
      datasets: [
        {
          label: 'Leads',
          data: canali.map(c => c.leads_totali),
          backgroundColor: '#1da1f2'
        },
        {
          label: 'Clienti',
          data: canali.map(c => c.clienti_totali),
          backgroundColor: '#17bf63'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#8899a6' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#2f3d4d' },
          ticks: { color: '#8899a6' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8899a6' }
        }
      }
    }
  });
}

function renderConversionChart(data) {
  const ctx = document.getElementById('conversion-chart');
  if (!ctx) return;

  if (charts.conversion) charts.conversion.destroy();

  const labels = ['Chiamate→Meeting', 'Meeting→Qualificato', 'Qualificato→Proposta', 'Proposta→Chiuso'];
  const values = [
    data.chiamate_to_meeting || 0,
    data.meeting_to_qualified || 0,
    data.qualified_to_proposal || 0,
    data.proposal_to_close || 0
  ];

  charts.conversion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#1da1f2', '#794bc4', '#ffad1f', '#17bf63'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#2f3d4d' },
          ticks: {
            color: '#8899a6',
            callback: (value) => value + '%'
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8899a6', maxRotation: 45 }
        }
      }
    }
  });
}

function renderVelocityChart(data) {
  const ctx = document.getElementById('velocity-chart');
  if (!ctx) return;

  if (charts.velocity) charts.velocity.destroy();

  charts.velocity = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lead→Qual', 'Qual→Prop', 'Prop→Close', 'Media'],
      datasets: [{
        data: [
          Math.round(data.lead_to_qualified || 0),
          Math.round(data.qualified_to_proposal || 0),
          Math.round(data.proposal_to_close || 0),
          Math.round(data.media_generale || 0)
        ],
        backgroundColor: '#794bc4',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#2f3d4d' },
          ticks: {
            color: '#8899a6',
            callback: (value) => value + ' giorni'
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8899a6' }
        }
      }
    }
  });
}

// Modal Functions
function openModal(title, content, onSubmit) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('active');

  const submitBtn = document.getElementById('modal-submit');
  submitBtn.onclick = onSubmit;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

function showQuickAdd() {
  document.getElementById('quick-actions-modal').classList.add('active');
}

function closeQuickActions() {
  document.getElementById('quick-actions-modal').classList.remove('active');
}

// CRUD Forms
function showAddContatto() {
  const content = `
    <form id="contatto-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nome *</label>
          <input type="text" class="form-input" name="nome" required>
        </div>
        <div class="form-group">
          <label class="form-label">Cognome</label>
          <input type="text" class="form-input" name="cognome">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Azienda</label>
          <input type="text" class="form-input" name="azienda">
        </div>
        <div class="form-group">
          <label class="form-label">Ruolo</label>
          <input type="text" class="form-input" name="ruolo">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" name="email">
        </div>
        <div class="form-group">
          <label class="form-label">Telefono</label>
          <input type="tel" class="form-input" name="telefono">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select class="form-select" name="categoria">
            <option value="">Seleziona...</option>
            <option value="Imprenditore">Imprenditore</option>
            <option value="Commercialista">Commercialista</option>
            <option value="Avvocato">Avvocato</option>
            <option value="Medico">Medico</option>
            <option value="Odontoiatra">Odontoiatra</option>
            <option value="Farmacista">Farmacista</option>
            <option value="Notaio">Notaio</option>
            <option value="Manager">Manager</option>
            <option value="Dirigente">Dirigente</option>
            <option value="Altro">Altro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tier</label>
          <select class="form-select" name="tier">
            <option value="C">C (Cold)</option>
            <option value="B">B (Warm)</option>
            <option value="A">A (Hot)</option>
            <option value="A+">A+ (VIP)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Fonte</label>
          <select class="form-select" name="fonte">
            <option value="">Seleziona...</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Cold Calling">Cold Calling</option>
            <option value="Partnership">Partnership</option>
            <option value="Evento Libro">Evento Libro</option>
            <option value="TFR Entry">TFR Entry</option>
            <option value="Percorso Formativo">Percorso Formativo</option>
            <option value="Referral">Referral</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">AUM Potenziale</label>
          <input type="number" class="form-input" name="aum_potenziale" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" name="note"></textarea>
      </div>
    </form>
  `;

  openModal('Nuovo Contatto', content, async () => {
    const form = document.getElementById('contatto-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await fetchAPI('/contatti', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      loadContatti();
    } catch (error) {
      alert('Errore nel salvataggio');
    }
  });
}

function showAddDeal() {
  const content = `
    <form id="deal-form">
      <div class="form-group">
        <label class="form-label">Nome Deal *</label>
        <input type="text" class="form-input" name="nome_deal" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Stage</label>
          <select class="form-select" name="stage">
            <option value="Lead">Lead</option>
            <option value="Contatto">Contatto</option>
            <option value="Qualificato">Qualificato</option>
            <option value="Proposta Inviata">Proposta Inviata</option>
            <option value="Negoziazione">Negoziazione</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">AUM Previsto</label>
          <input type="number" class="form-input" name="aum_previsto" placeholder="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Fonte</label>
          <select class="form-select" name="fonte">
            <option value="">Seleziona...</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Cold Calling">Cold Calling</option>
            <option value="Partnership">Partnership</option>
            <option value="Evento Libro">Evento Libro</option>
            <option value="TFR Entry">TFR Entry</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fee %</label>
          <input type="number" class="form-input" name="fee_percentuale" value="0.5" step="0.1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Prossima Azione</label>
        <input type="text" class="form-input" name="prossima_azione">
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" name="note"></textarea>
      </div>
    </form>
  `;

  openModal('Nuovo Deal', content, async () => {
    const form = document.getElementById('deal-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await fetchAPI('/pipeline', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      loadPipeline();
    } catch (error) {
      alert('Errore nel salvataggio');
    }
  });
}

function showAddChiamata() {
  const content = `
    <form id="chiamata-form">
      <div class="form-group">
        <label class="form-label">Nome Contatto *</label>
        <input type="text" class="form-input" name="contatto_nome" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo Chiamata</label>
          <select class="form-select" name="tipo_chiamata">
            <option value="Cold Call">Cold Call</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Discovery Call">Discovery Call</option>
            <option value="Presentazione">Presentazione</option>
            <option value="Negoziazione">Negoziazione</option>
            <option value="Check-in Cliente">Check-in Cliente</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Esito</label>
          <select class="form-select" name="esito">
            <option value="">Seleziona...</option>
            <option value="Interessato">Interessato</option>
            <option value="Non Interessato">Non Interessato</option>
            <option value="Richiamare">Richiamare</option>
            <option value="No Risposta">No Risposta</option>
            <option value="Appuntamento Fissato">Appuntamento Fissato</option>
            <option value="Info Richieste">Info Richieste</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Livello Interesse</label>
          <select class="form-select" name="livello_interesse">
            <option value="">Seleziona...</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Basso">Basso</option>
            <option value="Nullo">Nullo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Durata (min)</label>
          <input type="number" class="form-input" name="durata_minuti" value="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Data Follow-up</label>
        <input type="date" class="form-input" name="data_follow_up">
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" name="note"></textarea>
      </div>
    </form>
  `;

  openModal('Registra Chiamata', content, async () => {
    const form = document.getElementById('chiamata-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await fetchAPI('/chiamate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      loadChiamate();
    } catch (error) {
      alert('Errore nel salvataggio');
    }
  });
}

function showAddContratto() {
  const content = `
    <form id="contratto-form">
      <div class="form-group">
        <label class="form-label">Nome Cliente *</label>
        <input type="text" class="form-input" name="cliente_nome" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo Contratto</label>
          <select class="form-select" name="tipo_contratto">
            <option value="Gestione Patrimonio">Gestione Patrimonio</option>
            <option value="Consulenza Finanziaria">Consulenza Finanziaria</option>
            <option value="TFR Aziendale">TFR Aziendale</option>
            <option value="Piano Pensionistico">Piano Pensionistico</option>
            <option value="Polizza Vita">Polizza Vita</option>
            <option value="Investimenti">Investimenti</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">AUM</label>
          <input type="number" class="form-input" name="aum" placeholder="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Fee %</label>
          <input type="number" class="form-input" name="fee_percentuale" value="0.5" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Durata (mesi)</label>
          <input type="number" class="form-input" name="durata_mesi" value="12">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" name="note"></textarea>
      </div>
    </form>
  `;

  openModal('Nuovo Contratto', content, async () => {
    const form = document.getElementById('contratto-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await fetchAPI('/contratti', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      loadContratti();
    } catch (error) {
      alert('Errore nel salvataggio');
    }
  });
}

function showAddAUM() {
  const content = `
    <form id="aum-form">
      <div class="form-group">
        <label class="form-label">Nome Cliente *</label>
        <input type="text" class="form-input" name="cliente_nome" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo Operazione</label>
          <select class="form-select" name="tipo_operazione">
            <option value="Nuova Acquisizione">Nuova Acquisizione</option>
            <option value="Versamento Aggiuntivo">Versamento Aggiuntivo</option>
            <option value="Prelievo Parziale">Prelievo Parziale</option>
            <option value="Performance Positiva">Performance Positiva</option>
            <option value="Performance Negativa">Performance Negativa</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Variazione</label>
          <input type="number" class="form-input" name="variazione" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" name="note"></textarea>
      </div>
    </form>
  `;

  openModal('Nuova Operazione AUM', content, async () => {
    const form = document.getElementById('aum-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await fetchAPI('/aum', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      loadAUM();
    } catch (error) {
      alert('Errore nel salvataggio');
    }
  });
}

// Actions
async function advanceDeal(id) {
  if (!confirm('Avanzare il deal allo stage successivo?')) return;

  try {
    const deal = await fetchAPI(`/pipeline/${id}`);
    const stages = ['Lead', 'Contatto', 'Qualificato', 'Proposta Inviata', 'Negoziazione', 'Contratto Inviato', 'Contratto Firmato', 'Cliente Attivo'];
    const currentIndex = stages.indexOf(deal.deal.stage);

    if (currentIndex < stages.length - 1) {
      await fetchAPI(`/pipeline/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stage: stages[currentIndex + 1] })
      });
      loadPipeline();
    }
  } catch (error) {
    alert('Errore nell\'avanzamento');
  }
}

async function completeFollowup(id) {
  try {
    await fetchAPI(`/chiamate/${id}/completa-followup`, { method: 'POST' });
    loadChiamate();
  } catch (error) {
    alert('Errore nel completamento');
  }
}

function editContatto(id) {
  alert('Funzione di modifica - ID: ' + id);
}

function viewContratto(id) {
  alert('Visualizzazione contratto - ID: ' + id);
}

function refreshData() {
  loadPageData(currentPage);
}

// Filters
document.getElementById('search-contatti')?.addEventListener('input', debounce(loadContatti, 300));
document.getElementById('filter-tier')?.addEventListener('change', loadContatti);
document.getElementById('filter-cliente')?.addEventListener('change', loadContatti);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});
