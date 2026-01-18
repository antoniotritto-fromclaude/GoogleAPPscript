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
    report: { title: 'Report', subtitle: 'Report e export dati' },
    gestione: { title: 'Gestione Database', subtitle: 'Import, export e gestione dati' }
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
    case 'gestione':
      await loadGestione();
      break;
    case 'email':
      await loadEmail();
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
    const stato = document.getElementById('filter-stato')?.value;
    const fonte = document.getElementById('filter-fonte')?.value;

    if (tier) params.append('tier', tier);
    if (isCliente) params.append('is_cliente', isCliente);
    if (search) params.append('search', search);
    if (stato) params.append('stato_sviluppo', stato);
    if (fonte) params.append('fonte_acquisizione', fonte);

    const data = await fetchAPI(`/contatti?${params}`);
    renderContattiTable(data.contatti);
  } catch (error) {
    console.error('Error loading contatti:', error);
  }
}

function renderContattiTable(contatti) {
  const tbody = document.getElementById('contatti-table');

  if (!contatti || contatti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nessun contatto trovato</td></tr>';
    return;
  }

  const statoColors = {
    'Nuovo': 'info',
    'Contattato': 'primary',
    'In Lavorazione': 'warning',
    'Qualificato': 'success',
    'In Pipeline': 'purple',
    'Cliente': 'success',
    'Non Interessato': 'danger'
  };

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
      <td>
        <span class="status-badge ${statoColors[c.stato_sviluppo] || 'info'}" style="font-size: 11px;">
          ${c.stato_sviluppo || 'Nuovo'}
        </span>
      </td>
      <td>
        <span style="font-size: 12px; color: var(--text-secondary);">
          ${c.fonte_acquisizione || c.fonte || '-'}
        </span>
      </td>
      <td><span class="status-badge ${c.tier === 'A+' ? 'danger' : c.tier === 'A' ? 'warning' : 'info'}">${c.tier}</span></td>
      <td>${c.engagement_score}/10</td>
      <td>${formatCurrency(c.aum_potenziale)}</td>
      <td>
        <button class="btn btn-secondary" onclick="editContatto(${c.id})" style="padding: 4px 8px;" title="Dettagli">
          <i class="bi bi-eye"></i>
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
          <label class="form-label">LinkedIn</label>
          <input type="text" class="form-input" name="linkedin" placeholder="URL profilo LinkedIn">
        </div>
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
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Fonte Acquisizione</label>
          <select class="form-select" name="fonte_acquisizione">
            <option value="">Seleziona...</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Cold Calling">Cold Calling</option>
            <option value="Partnership">Partnership</option>
            <option value="Evento Libro">Evento Libro</option>
            <option value="TFR Entry">TFR Entry</option>
            <option value="Percorso Formativo">Percorso Formativo</option>
            <option value="Referral">Referral</option>
            <option value="Sito Web">Sito Web</option>
            <option value="Webinar">Webinar</option>
            <option value="Altro">Altro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Stato Sviluppo</label>
          <select class="form-select" name="stato_sviluppo">
            <option value="Nuovo">Nuovo</option>
            <option value="Contattato">Contattato</option>
            <option value="In Lavorazione">In Lavorazione</option>
            <option value="Qualificato">Qualificato</option>
            <option value="In Pipeline">In Pipeline</option>
            <option value="Cliente">Cliente</option>
            <option value="Non Interessato">Non Interessato</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tier</label>
          <select class="form-select" name="tier">
            <option value="C">C (Cold)</option>
            <option value="B">B (Warm)</option>
            <option value="A">A (Hot)</option>
            <option value="A+">A+ (VIP)</option>
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

// ========== EDIT FUNCTIONS ==========

async function editContatto(id) {
  try {
    const data = await fetchAPI(`/contatti/${id}`);
    const c = data.contatto;
    const interazioni = data.interazioni || [];
    const chiamate = data.chiamate || [];

    // Combina interazioni e chiamate per la timeline
    const timeline = [
      ...interazioni.map(i => ({...i, source: 'interazione'})),
      ...chiamate.map(ch => ({
        ...ch,
        tipo: 'Chiamata',
        descrizione: ch.note,
        esito: ch.esito,
        data_interazione: ch.data_chiamata,
        source: 'chiamata'
      }))
    ].sort((a, b) => new Date(b.data_interazione || b.created_at) - new Date(a.data_interazione || a.created_at));

    const fontiOptions = ['LinkedIn','Facebook','Instagram','Google Ads','Newsletter','Cold Calling','Partnership','Evento Libro','TFR Entry','Percorso Formativo','Referral','Sito Web','Webinar','Altro'];
    const statiOptions = ['Nuovo','Contattato','In Lavorazione','Qualificato','In Pipeline','Cliente','Non Interessato'];

    const content = `
      <div style="display: flex; gap: var(--spacing-lg);">
        <!-- Colonna Form -->
        <div style="flex: 1; min-width: 350px;">
          <form id="edit-contatto-form">
            <input type="hidden" name="id" value="${id}">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nome *</label>
                <input type="text" class="form-input" name="nome" value="${c.nome || ''}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Cognome</label>
                <input type="text" class="form-input" name="cognome" value="${c.cognome || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" name="email" value="${c.email || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Telefono</label>
                <input type="tel" class="form-input" name="telefono" value="${c.telefono || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Azienda</label>
                <input type="text" class="form-input" name="azienda" value="${c.azienda || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Ruolo</label>
                <input type="text" class="form-input" name="ruolo" value="${c.ruolo || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Fonte Acquisizione</label>
                <select class="form-select" name="fonte_acquisizione">
                  <option value="">Seleziona...</option>
                  ${fontiOptions.map(f => `<option value="${f}" ${c.fonte_acquisizione === f || c.fonte === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Stato Sviluppo</label>
                <select class="form-select" name="stato_sviluppo">
                  ${statiOptions.map(s => `<option value="${s}" ${c.stato_sviluppo === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Categoria</label>
                <select class="form-select" name="categoria">
                  <option value="">Seleziona...</option>
                  ${['Imprenditore','Commercialista','Avvocato','Medico','Odontoiatra','Farmacista','Notaio','Manager','Dirigente','Altro'].map(cat =>
                    `<option value="${cat}" ${c.categoria === cat ? 'selected' : ''}>${cat}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tier</label>
                <select class="form-select" name="tier">
                  ${['C','B','A','A+'].map(t =>
                    `<option value="${t}" ${c.tier === t ? 'selected' : ''}>${t}</option>`
                  ).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">AUM Potenziale</label>
                <input type="number" class="form-input" name="aum_potenziale" value="${c.aum_potenziale || 0}">
              </div>
              <div class="form-group">
                <label class="form-label">Engagement Score</label>
                <input type="number" class="form-input" name="engagement_score" value="${c.engagement_score || 5}" min="1" max="10">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" name="is_cliente" ${c.is_cliente ? 'checked' : ''}> È cliente attivo
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Note</label>
              <textarea class="form-textarea" name="note">${c.note || ''}</textarea>
            </div>
          </form>
        </div>

        <!-- Colonna Azioni e Timeline -->
        <div style="flex: 1; min-width: 300px; border-left: 1px solid var(--border-color); padding-left: var(--spacing-lg);">
          <h4 style="margin-bottom: var(--spacing-md);">Azioni Rapide</h4>
          <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg);">
            <button type="button" class="btn btn-primary" onclick="registraChiamataContatto(${id})">
              <i class="bi bi-telephone"></i> Chiamata
            </button>
            <button type="button" class="btn btn-secondary" onclick="registraEmailContatto(${id})">
              <i class="bi bi-envelope"></i> Email
            </button>
            <button type="button" class="btn btn-warning" onclick="assegnaFunnelContatto(${id})">
              <i class="bi bi-diagram-3"></i> Funnel
            </button>
            <button type="button" class="btn btn-success" onclick="spostaPipelineContatto(${id}, '${c.nome} ${c.cognome || ''}', ${c.aum_potenziale || 0})">
              <i class="bi bi-funnel"></i> Pipeline
            </button>
          </div>

          <h4 style="margin-bottom: var(--spacing-md);">Timeline Interazioni</h4>
          <div style="max-height: 300px; overflow-y: auto;">
            ${timeline.length === 0 ? '<p class="text-muted">Nessuna interazione registrata</p>' :
              timeline.map(t => `
                <div style="display: flex; gap: var(--spacing-sm); padding: var(--spacing-sm); border-bottom: 1px solid var(--border-color);">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--${
                    t.tipo?.includes('Chiamata') ? 'primary' :
                    t.tipo === 'Email' ? 'info' :
                    t.tipo === 'Funnel Email' ? 'warning' :
                    t.tipo === 'Pipeline' ? 'success' : 'secondary'
                  }); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="bi bi-${
                      t.tipo?.includes('Chiamata') ? 'telephone' :
                      t.tipo === 'Email' ? 'envelope' :
                      t.tipo === 'Funnel Email' ? 'diagram-3' :
                      t.tipo === 'Pipeline' ? 'funnel' : 'clock'
                    }" style="color: white; font-size: 14px;"></i>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 500; font-size: 13px;">${t.tipo || 'Interazione'}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${t.descrizione || t.esito || ''}</div>
                    <div style="font-size: 11px; color: var(--text-tertiary);">${formatDate(t.data_interazione || t.created_at)}</div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid var(--border-color); padding-top: var(--spacing-md); margin-top: var(--spacing-md);">
        <button type="button" class="btn btn-danger" onclick="deleteContatto(${id})" style="float: left;">
          <i class="bi bi-trash"></i> Elimina Contatto
        </button>
      </div>
    `;

    openModal('Dettaglio Contatto: ' + c.nome + ' ' + (c.cognome || ''), content, async () => {
      const form = document.getElementById('edit-contatto-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      data.is_cliente = form.querySelector('[name="is_cliente"]').checked ? 1 : 0;

      try {
        await fetchAPI(`/contatti/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        closeModal();
        loadContatti();
      } catch (error) {
        alert('Errore nel salvataggio');
      }
    });

    // Aumenta larghezza modal per contenere il layout a due colonne
    document.querySelector('.modal').style.maxWidth = '900px';

  } catch (error) {
    console.error('Errore:', error);
    alert('Errore nel caricamento del contatto');
  }
}

// ========== FUNZIONI INTERAZIONI CONTATTO ==========

async function registraChiamataContatto(contattoId) {
  const content = `
    <form id="chiamata-contatto-form">
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

  // Chiudi modal precedente
  closeModal();

  setTimeout(() => {
    openModal('Registra Chiamata', content, async () => {
      const form = document.getElementById('chiamata-contatto-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      data.contatto_id = contattoId;

      try {
        await fetchAPI('/interazioni/registra-chiamata', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        alert('Chiamata registrata con successo');
        editContatto(contattoId); // Riapri dettaglio
      } catch (error) {
        alert('Errore nella registrazione');
      }
    });
  }, 100);
}

async function registraEmailContatto(contattoId) {
  const content = `
    <form id="email-contatto-form">
      <div class="form-group">
        <label class="form-label">Oggetto</label>
        <input type="text" class="form-input" name="oggetto" placeholder="Oggetto email">
      </div>
      <div class="form-group">
        <label class="form-label">Descrizione/Note</label>
        <textarea class="form-textarea" name="descrizione" placeholder="Contenuto o note sull'email"></textarea>
      </div>
    </form>
  `;

  closeModal();

  setTimeout(() => {
    openModal('Registra Email Inviata', content, async () => {
      const form = document.getElementById('email-contatto-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      data.contatto_id = contattoId;

      try {
        await fetchAPI('/interazioni/registra-email', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        alert('Email registrata con successo');
        editContatto(contattoId);
      } catch (error) {
        alert('Errore nella registrazione');
      }
    });
  }, 100);
}

async function assegnaFunnelContatto(contattoId) {
  const content = `
    <form id="funnel-contatto-form">
      <div class="form-group">
        <label class="form-label">Nome Funnel *</label>
        <select class="form-select" name="funnel_nome" required>
          <option value="">Seleziona funnel...</option>
          <option value="Benvenuto">Benvenuto</option>
          <option value="Nurturing Base">Nurturing Base</option>
          <option value="Nurturing Avanzato">Nurturing Avanzato</option>
          <option value="Re-engagement">Re-engagement</option>
          <option value="Promo Speciale">Promo Speciale</option>
          <option value="Post Evento">Post Evento</option>
          <option value="Follow-up Webinar">Follow-up Webinar</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" name="descrizione" placeholder="Note sull'assegnazione"></textarea>
      </div>
    </form>
  `;

  closeModal();

  setTimeout(() => {
    openModal('Assegna Funnel Email', content, async () => {
      const form = document.getElementById('funnel-contatto-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      data.contatto_id = contattoId;

      if (!data.funnel_nome) {
        alert('Seleziona un funnel');
        return;
      }

      try {
        await fetchAPI('/interazioni/assegna-funnel', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        alert('Funnel assegnato con successo');
        editContatto(contattoId);
      } catch (error) {
        alert('Errore nell\'assegnazione');
      }
    });
  }, 100);
}

async function spostaPipelineContatto(contattoId, nomeContatto, aumPotenziale) {
  const content = `
    <form id="pipeline-contatto-form">
      <div class="form-group">
        <label class="form-label">Nome Deal</label>
        <input type="text" class="form-input" name="nome_deal" value="${nomeContatto} - Opportunità">
      </div>
      <div class="form-group">
        <label class="form-label">AUM Previsto</label>
        <input type="number" class="form-input" name="aum_previsto" value="${aumPotenziale}">
      </div>
    </form>
  `;

  closeModal();

  setTimeout(() => {
    openModal('Sposta in Pipeline', content, async () => {
      const form = document.getElementById('pipeline-contatto-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      data.contatto_id = contattoId;

      try {
        await fetchAPI('/interazioni/sposta-pipeline', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        alert('Contatto spostato in Pipeline con successo!');
        loadContatti();
      } catch (error) {
        alert('Errore nello spostamento');
      }
    });
  }, 100);
}

async function editDeal(id) {
  try {
    const data = await fetchAPI(`/pipeline/${id}`);
    const d = data.deal;

    const content = `
      <form id="edit-deal-form">
        <input type="hidden" name="id" value="${id}">
        <div class="form-group">
          <label class="form-label">Nome Deal *</label>
          <input type="text" class="form-input" name="nome_deal" value="${d.nome_deal || ''}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Stage</label>
            <select class="form-select" name="stage">
              ${['Lead','Contatto','Qualificato','Proposta Inviata','Negoziazione','Contratto Inviato','Contratto Firmato','Cliente Attivo','Chiuso Perso'].map(s =>
                `<option value="${s}" ${d.stage === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Probabilità %</label>
            <input type="number" class="form-input" name="probabilita" value="${d.probabilita || 0}" min="0" max="100">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">AUM Previsto</label>
            <input type="number" class="form-input" name="aum_previsto" value="${d.aum_previsto || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Fee %</label>
            <input type="number" class="form-input" name="fee_percentuale" value="${d.fee_percentuale || 0.5}" step="0.1">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Prossima Azione</label>
          <input type="text" class="form-input" name="prossima_azione" value="${d.prossima_azione || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Note</label>
          <textarea class="form-textarea" name="note">${d.note || ''}</textarea>
        </div>
        <div style="border-top: 1px solid var(--border-color); padding-top: var(--spacing-md); margin-top: var(--spacing-md);">
          <button type="button" class="btn btn-danger" onclick="deleteDeal(${id})" style="float: left;">
            <i class="bi bi-trash"></i> Elimina Deal
          </button>
        </div>
      </form>
    `;

    openModal('Modifica Deal', content, async () => {
      const form = document.getElementById('edit-deal-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      try {
        await fetchAPI(`/pipeline/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        closeModal();
        loadPipeline();
      } catch (error) {
        alert('Errore nel salvataggio');
      }
    });
  } catch (error) {
    alert('Errore nel caricamento del deal');
  }
}

async function editChiamata(id) {
  try {
    const data = await fetchAPI(`/chiamate/${id}`);
    const c = data.chiamata;

    const content = `
      <form id="edit-chiamata-form">
        <input type="hidden" name="id" value="${id}">
        <div class="form-group">
          <label class="form-label">Nome Contatto</label>
          <input type="text" class="form-input" name="contatto_nome" value="${c.contatto_nome || ''}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo Chiamata</label>
            <select class="form-select" name="tipo_chiamata">
              ${['Cold Call','Follow-up','Discovery Call','Presentazione','Negoziazione','Check-in Cliente'].map(t =>
                `<option value="${t}" ${c.tipo_chiamata === t ? 'selected' : ''}>${t}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Esito</label>
            <select class="form-select" name="esito">
              <option value="">Seleziona...</option>
              ${['Interessato','Non Interessato','Richiamare','No Risposta','Appuntamento Fissato','Info Richieste','Completato'].map(e =>
                `<option value="${e}" ${c.esito === e ? 'selected' : ''}>${e}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Livello Interesse</label>
            <select class="form-select" name="livello_interesse">
              <option value="">Seleziona...</option>
              ${['Alto','Medio','Basso','Nullo'].map(l =>
                `<option value="${l}" ${c.livello_interesse === l ? 'selected' : ''}>${l}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Durata (min)</label>
            <input type="number" class="form-input" name="durata_minuti" value="${c.durata_minuti || 0}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Data Follow-up</label>
          <input type="date" class="form-input" name="data_follow_up" value="${c.data_follow_up ? c.data_follow_up.split('T')[0] : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Note</label>
          <textarea class="form-textarea" name="note">${c.note || ''}</textarea>
        </div>
        <div style="border-top: 1px solid var(--border-color); padding-top: var(--spacing-md); margin-top: var(--spacing-md);">
          <button type="button" class="btn btn-danger" onclick="deleteChiamata(${id})" style="float: left;">
            <i class="bi bi-trash"></i> Elimina Chiamata
          </button>
        </div>
      </form>
    `;

    openModal('Modifica Chiamata', content, async () => {
      const form = document.getElementById('edit-chiamata-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      try {
        await fetchAPI(`/chiamate/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        closeModal();
        loadChiamate();
      } catch (error) {
        alert('Errore nel salvataggio');
      }
    });
  } catch (error) {
    alert('Errore nel caricamento della chiamata');
  }
}

async function viewContratto(id) {
  try {
    const data = await fetchAPI(`/contratti/${id}`);
    const c = data.contratto;

    const content = `
      <form id="edit-contratto-form">
        <input type="hidden" name="id" value="${id}">
        <div class="form-group">
          <label class="form-label">ID Contratto</label>
          <input type="text" class="form-input" value="${c.contratto_id}" disabled>
        </div>
        <div class="form-group">
          <label class="form-label">Nome Cliente *</label>
          <input type="text" class="form-input" name="cliente_nome" value="${c.cliente_nome || ''}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo Contratto</label>
            <select class="form-select" name="tipo_contratto">
              ${['Gestione Patrimonio','Consulenza Finanziaria','TFR Aziendale','Piano Pensionistico','Polizza Vita','Investimenti'].map(t =>
                `<option value="${t}" ${c.tipo_contratto === t ? 'selected' : ''}>${t}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stato</label>
            <select class="form-select" name="stato">
              ${['Bozza','Inviato','Attivo','Scaduto','Annullato'].map(s =>
                `<option value="${s}" ${c.stato === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">AUM</label>
            <input type="number" class="form-input" name="aum" value="${c.aum || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Fee %</label>
            <input type="number" class="form-input" name="fee_percentuale" value="${c.fee_percentuale || 0.5}" step="0.1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fee Annuale</label>
            <input type="number" class="form-input" name="fee_annuale" value="${c.fee_annuale || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Durata (mesi)</label>
            <input type="number" class="form-input" name="durata_mesi" value="${c.durata_mesi || 12}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" name="rinnovo_automatico" ${c.rinnovo_automatico ? 'checked' : ''}> Rinnovo automatico
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">Note</label>
          <textarea class="form-textarea" name="note">${c.note || ''}</textarea>
        </div>
        <div style="border-top: 1px solid var(--border-color); padding-top: var(--spacing-md); margin-top: var(--spacing-md);">
          <button type="button" class="btn btn-danger" onclick="deleteContratto(${id})" style="float: left;">
            <i class="bi bi-trash"></i> Elimina Contratto
          </button>
        </div>
      </form>
    `;

    openModal('Modifica Contratto', content, async () => {
      const form = document.getElementById('edit-contratto-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      data.rinnovo_automatico = form.querySelector('[name="rinnovo_automatico"]').checked ? 1 : 0;

      try {
        await fetchAPI(`/contratti/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        closeModal();
        loadContratti();
      } catch (error) {
        alert('Errore nel salvataggio');
      }
    });
  } catch (error) {
    alert('Errore nel caricamento del contratto');
  }
}

// ========== DELETE FUNCTIONS ==========

async function deleteContatto(id) {
  if (!confirm('Sei sicuro di voler eliminare questo contatto? Questa azione non può essere annullata.')) return;

  try {
    await fetchAPI(`/contatti/${id}`, { method: 'DELETE' });
    closeModal();
    loadContatti();
  } catch (error) {
    alert('Errore nell\'eliminazione');
  }
}

async function deleteDeal(id) {
  if (!confirm('Sei sicuro di voler eliminare questo deal? Questa azione non può essere annullata.')) return;

  try {
    await fetchAPI(`/pipeline/${id}`, { method: 'DELETE' });
    closeModal();
    loadPipeline();
  } catch (error) {
    alert('Errore nell\'eliminazione');
  }
}

async function deleteChiamata(id) {
  if (!confirm('Sei sicuro di voler eliminare questa chiamata?')) return;

  try {
    await fetchAPI(`/chiamate/${id}`, { method: 'DELETE' });
    closeModal();
    loadChiamate();
  } catch (error) {
    alert('Errore nell\'eliminazione');
  }
}

async function deleteContratto(id) {
  if (!confirm('Sei sicuro di voler eliminare questo contratto? Questa azione non può essere annullata.')) return;

  try {
    await fetchAPI(`/contratti/${id}`, { method: 'DELETE' });
    closeModal();
    loadContratti();
  } catch (error) {
    alert('Errore nell\'eliminazione');
  }
}

// ========== BULK DELETE ==========

let selectedItems = new Set();

function toggleSelectAll(checkbox, tableId) {
  const checkboxes = document.querySelectorAll(`#${tableId} .row-checkbox`);
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    if (checkbox.checked) {
      selectedItems.add(cb.value);
    } else {
      selectedItems.delete(cb.value);
    }
  });
  updateBulkActions();
}

function toggleSelectRow(checkbox) {
  if (checkbox.checked) {
    selectedItems.add(checkbox.value);
  } else {
    selectedItems.delete(checkbox.value);
  }
  updateBulkActions();
}

function updateBulkActions() {
  const bulkBar = document.getElementById('bulk-actions-bar');
  if (bulkBar) {
    if (selectedItems.size > 0) {
      bulkBar.style.display = 'flex';
      document.getElementById('selected-count').textContent = selectedItems.size;
    } else {
      bulkBar.style.display = 'none';
    }
  }
}

async function bulkDelete(entityType) {
  if (selectedItems.size === 0) return;

  if (!confirm(`Sei sicuro di voler eliminare ${selectedItems.size} elementi? Questa azione non può essere annullata.`)) return;

  try {
    const ids = Array.from(selectedItems);
    await fetchAPI(`/${entityType}/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids })
    });

    selectedItems.clear();
    updateBulkActions();

    // Reload current page data
    loadPageData(currentPage);
  } catch (error) {
    alert('Errore nell\'eliminazione in blocco');
  }
}

function clearSelection() {
  selectedItems.clear();
  document.querySelectorAll('.row-checkbox, .select-all-checkbox').forEach(cb => cb.checked = false);
  updateBulkActions();
}

// ========== CSV IMPORT ==========

function showImportCSV(entityType) {
  const templates = {
    contatti: 'nome,cognome,azienda,ruolo,email,telefono,categoria,tier,fonte,aum_potenziale',
    pipeline: 'nome_deal,stage,aum_previsto,probabilita,fonte,fee_percentuale',
    contratti: 'cliente_nome,tipo_contratto,aum,fee_percentuale,durata_mesi',
    chiamate: 'contatto_nome,tipo_chiamata,esito,livello_interesse,durata_minuti'
  };

  const content = `
    <div class="import-container">
      <div class="form-group">
        <label class="form-label">Seleziona file CSV</label>
        <input type="file" class="form-input" id="csv-file" accept=".csv">
      </div>

      <div class="form-group">
        <label class="form-label">Oppure incolla i dati CSV qui:</label>
        <textarea class="form-textarea" id="csv-text" rows="10" placeholder="nome,cognome,email,..."></textarea>
      </div>

      <div style="background: var(--bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-md); margin-top: var(--spacing-md);">
        <strong>Formato richiesto:</strong>
        <code style="display: block; margin-top: var(--spacing-sm); word-break: break-all; font-size: 12px;">
          ${templates[entityType]}
        </code>
      </div>

      <div id="import-preview" style="margin-top: var(--spacing-lg); display: none;">
        <h4 style="margin-bottom: var(--spacing-sm);">Anteprima (prime 5 righe):</h4>
        <div id="preview-content" style="overflow-x: auto;"></div>
      </div>
    </div>
  `;

  openModal(`Importa ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} da CSV`, content, async () => {
    await processCSVImport(entityType);
  });

  // File change listener
  setTimeout(() => {
    document.getElementById('csv-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('csv-text').value = event.target.result;
          showCSVPreview(event.target.result);
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('csv-text').addEventListener('input', (e) => {
      if (e.target.value.trim()) {
        showCSVPreview(e.target.value);
      }
    });
  }, 100);
}

function showCSVPreview(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return;

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1, 6).map(line => line.split(',').map(c => c.trim()));

  let html = '<table class="performance-table" style="font-size: 12px;"><thead><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => html += `<td>${cell}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  html += `<p style="margin-top: var(--spacing-sm); color: var(--text-secondary);">Totale righe: ${lines.length - 1}</p>`;

  document.getElementById('import-preview').style.display = 'block';
  document.getElementById('preview-content').innerHTML = html;
}

async function processCSVImport(entityType) {
  const csvText = document.getElementById('csv-text').value.trim();
  if (!csvText) {
    alert('Inserisci i dati CSV');
    return;
  }

  const lines = csvText.split('\n');
  if (lines.length < 2) {
    alert('Il file deve contenere almeno una riga di intestazione e una riga di dati');
    return;
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }

  try {
    const response = await fetchAPI(`/${entityType}/import`, {
      method: 'POST',
      body: JSON.stringify({ records })
    });

    closeModal();
    alert(`Importazione completata: ${response.imported || records.length} record importati`);
    loadPageData(currentPage);
  } catch (error) {
    alert('Errore nell\'importazione: ' + error.message);
  }
}

// ========== EXPORT CSV ==========

async function exportCSV(entityType) {
  try {
    const data = await fetchAPI(`/${entityType}`);
    let records = [];

    switch(entityType) {
      case 'contatti': records = data.contatti || data; break;
      case 'pipeline': records = data; break;
      case 'contratti': records = data; break;
      case 'chiamate': records = data; break;
      default: records = data;
    }

    if (!records || records.length === 0) {
      alert('Nessun dato da esportare');
      return;
    }

    const headers = Object.keys(records[0]).filter(k => k !== 'id');
    let csv = headers.join(',') + '\n';

    records.forEach(record => {
      const row = headers.map(h => {
        let val = record[h] || '';
        if (typeof val === 'string' && val.includes(',')) {
          val = `"${val}"`;
        }
        return val;
      });
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  } catch (error) {
    alert('Errore nell\'esportazione');
  }
}

// ========== RESET DATABASE ==========

async function showResetDatabase() {
  const content = `
    <div style="text-align: center; padding: var(--spacing-lg);">
      <i class="bi bi-exclamation-triangle" style="font-size: 64px; color: var(--danger);"></i>
      <h3 style="margin: var(--spacing-lg) 0;">Attenzione!</h3>
      <p style="margin-bottom: var(--spacing-lg);">Questa azione eliminerà <strong>TUTTI</strong> i dati presenti nel database e li sostituirà con i dati di esempio.</p>
      <p style="color: var(--text-secondary);">Questa operazione non può essere annullata.</p>

      <div style="margin-top: var(--spacing-xl);">
        <label style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm);">
          <input type="checkbox" id="confirm-reset"> Ho capito, voglio procedere
        </label>
      </div>
    </div>
  `;

  openModal('Reset Database', content, async () => {
    if (!document.getElementById('confirm-reset').checked) {
      alert('Devi confermare per procedere');
      return;
    }

    try {
      await fetchAPI('/admin/reset-database', { method: 'POST' });
      closeModal();
      alert('Database resettato con successo');
      location.reload();
    } catch (error) {
      alert('Errore nel reset del database');
    }
  });
}

async function showClearDatabase() {
  const content = `
    <div style="text-align: center; padding: var(--spacing-lg);">
      <i class="bi bi-trash" style="font-size: 64px; color: var(--danger);"></i>
      <h3 style="margin: var(--spacing-lg) 0;">Cancella Tutti i Dati</h3>
      <p style="margin-bottom: var(--spacing-lg);">Questa azione eliminerà <strong>TUTTI</strong> i dati presenti nel database.</p>
      <p style="color: var(--text-secondary);">Il database rimarrà vuoto. Questa operazione non può essere annullata.</p>

      <div style="margin-top: var(--spacing-xl);">
        <label style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm);">
          <input type="checkbox" id="confirm-clear"> Ho capito, voglio procedere
        </label>
      </div>
    </div>
  `;

  openModal('Cancella Database', content, async () => {
    if (!document.getElementById('confirm-clear').checked) {
      alert('Devi confermare per procedere');
      return;
    }

    try {
      await fetchAPI('/admin/clear-database', { method: 'POST' });
      closeModal();
      alert('Database cancellato con successo');
      location.reload();
    } catch (error) {
      alert('Errore nella cancellazione del database');
    }
  });
}

// ========== GESTIONE PAGE ==========

async function loadGestione() {
  try {
    const stats = await fetchAPI('/admin/stats');

    document.getElementById('stat-contatti').textContent = stats.contatti || 0;
    document.getElementById('stat-pipeline').textContent = stats.pipeline || 0;
    document.getElementById('stat-contratti').textContent = stats.contratti || 0;
    document.getElementById('stat-chiamate').textContent = stats.chiamate || 0;
  } catch (error) {
    console.error('Error loading gestione stats:', error);
  }
}

function refreshData() {
  loadPageData(currentPage);
}

// Filters
document.getElementById('search-contatti')?.addEventListener('input', debounce(loadContatti, 300));
document.getElementById('filter-tier')?.addEventListener('change', loadContatti);
document.getElementById('filter-cliente')?.addEventListener('change', loadContatti);
document.getElementById('filter-stato')?.addEventListener('change', loadContatti);
document.getElementById('filter-fonte')?.addEventListener('change', loadContatti);

// ========== EMAIL MARKETING FUNCTIONS ==========

let emailContattiList = [];

async function loadEmail() {
  try {
    // Carica configurazione email
    const config = await fetchAPI('/email/config');

    // Check OAuth status first
    try {
      const oauthStatus = await fetchAPI('/email/oauth/status');
      if (oauthStatus.connected) {
        // OAuth connected
        document.getElementById('email-status').textContent = 'Connesso';
        document.getElementById('email-status').className = 'status-badge success';
        document.getElementById('gmail-connect-btn').style.display = 'none';
        document.getElementById('gmail-connected-email').style.display = 'inline';
        document.getElementById('gmail-email-display').textContent = oauthStatus.email || config.address;
        document.getElementById('gmail-disconnect-btn').style.display = 'inline-block';
        return;
      }
    } catch (e) {
      console.log('OAuth status check:', e.message);
    }

    // Fallback to SMTP config display
    if (config.address) {
      document.getElementById('email-config-address').value = config.address;
      document.getElementById('email-config-nome').value = config.nome_mittente || '';

      if (config.password_configured) {
        document.getElementById('email-status').textContent = 'SMTP Configurato';
        document.getElementById('email-status').className = 'status-badge success';
        document.getElementById('email-config-password').placeholder = '****************';
      }
    }

    // Reset OAuth UI
    document.getElementById('gmail-connect-btn').style.display = 'inline-flex';
    document.getElementById('gmail-connected-email').style.display = 'none';
    document.getElementById('gmail-disconnect-btn').style.display = 'none';
  } catch (error) {
    console.error('Errore caricamento config email:', error);
  }
}

// OAuth2 Gmail Functions
async function connectGmailOAuth() {
  try {
    const result = await fetchAPI('/email/oauth/url');

    if (result.error) {
      alert('OAuth non configurato sul server. Contatta l\'amministratore per configurare le credenziali Google Cloud.');
      return;
    }

    // Open popup for OAuth
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const popup = window.open(
      result.url,
      'Gmail OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for message from popup
    window.addEventListener('message', function handler(event) {
      if (event.data.type === 'gmail-oauth-success') {
        alert('Gmail connesso con successo: ' + event.data.email);
        loadEmail();
        window.removeEventListener('message', handler);
      } else if (event.data.type === 'gmail-oauth-error') {
        alert('Errore durante la connessione: ' + event.data.error);
        window.removeEventListener('message', handler);
      }
    });

  } catch (error) {
    alert('Errore: ' + (error.hint || error.message));
  }
}

async function disconnectGmailOAuth() {
  if (!confirm('Disconnettere Gmail? Dovrai riconnetterti per inviare email.')) {
    return;
  }

  try {
    await fetchAPI('/email/oauth/disconnect', { method: 'POST' });
    alert('Gmail disconnesso');
    loadEmail();
  } catch (error) {
    alert('Errore: ' + error.message);
  }
}

async function saveEmailConfig() {
  const email = document.getElementById('email-config-address').value;
  const password = document.getElementById('email-config-password').value;
  const nome = document.getElementById('email-config-nome').value;

  if (!email) {
    alert('Inserisci l\'indirizzo email');
    return;
  }

  try {
    const data = { email, nome_mittente: nome };
    if (password) {
      data.password = password;
    }

    await fetchAPI('/email/config', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    alert('Configurazione salvata!');
    loadEmail();
  } catch (error) {
    alert('Errore nel salvataggio: ' + error.message);
  }
}

async function testEmailConnection() {
  try {
    document.getElementById('email-status').textContent = 'Test in corso...';
    document.getElementById('email-status').className = 'status-badge warning';

    const result = await fetchAPI('/email/test', { method: 'POST' });

    if (result.success) {
      document.getElementById('email-status').textContent = 'Connessione OK';
      document.getElementById('email-status').className = 'status-badge success';
      alert('Connessione a Gmail riuscita!');
    }
  } catch (error) {
    document.getElementById('email-status').textContent = 'Errore connessione';
    document.getElementById('email-status').className = 'status-badge danger';
    alert('Errore: ' + (error.hint || error.details || error.message));
  }
}

async function loadEmailTemplate() {
  const templateId = document.getElementById('email-template').value;

  if (!templateId) {
    document.getElementById('email-oggetto').value = '';
    document.getElementById('email-corpo').value = '';
    return;
  }

  try {
    const template = await fetchAPI(`/email/template/${templateId}`);
    document.getElementById('email-oggetto').value = template.oggetto || '';
    document.getElementById('email-corpo').value = template.corpo || '';
  } catch (error) {
    console.error('Errore caricamento template:', error);
  }
}

async function loadEmailContatti() {
  try {
    const stato = document.getElementById('email-filter-stato').value;
    const params = new URLSearchParams();
    if (stato) params.append('stato_sviluppo', stato);

    const data = await fetchAPI(`/contatti?${params}`);
    emailContattiList = data.contatti.filter(c => c.email);

    const container = document.getElementById('email-contatti-list');

    if (emailContattiList.length === 0) {
      container.innerHTML = '<p class="text-muted">Nessun contatto con email trovato</p>';
      return;
    }

    container.innerHTML = emailContattiList.map(c => `
      <label style="display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer;">
        <input type="checkbox" class="email-contatto-check" value="${c.id}" data-email="${c.email}">
        <span>${c.nome} ${c.cognome || ''}</span>
        <span style="color: var(--text-tertiary); font-size: 12px;">${c.email}</span>
        <span class="status-badge info" style="font-size: 10px; margin-left: auto;">${c.stato_sviluppo || 'Nuovo'}</span>
      </label>
    `).join('');

    // Aggiungi listener per conteggio
    container.querySelectorAll('.email-contatto-check').forEach(cb => {
      cb.addEventListener('change', updateEmailSelectedCount);
    });

    updateEmailSelectedCount();
  } catch (error) {
    console.error('Errore caricamento contatti:', error);
  }
}

function selectAllEmailContatti(select) {
  document.querySelectorAll('.email-contatto-check').forEach(cb => {
    cb.checked = select;
  });
  updateEmailSelectedCount();
}

function updateEmailSelectedCount() {
  const count = document.querySelectorAll('.email-contatto-check:checked').length;
  document.getElementById('email-selected-count').textContent = `${count} selezionati`;
}

async function sendBulkEmail() {
  const oggetto = document.getElementById('email-oggetto').value;
  const corpo = document.getElementById('email-corpo').value;
  const templateId = document.getElementById('email-template').value;

  if (!oggetto && !templateId) {
    alert('Inserisci un oggetto o seleziona un template');
    return;
  }

  const selectedIds = Array.from(document.querySelectorAll('.email-contatto-check:checked'))
    .map(cb => parseInt(cb.value));

  if (selectedIds.length === 0) {
    alert('Seleziona almeno un destinatario');
    return;
  }

  if (selectedIds.length > 50) {
    alert('Massimo 50 email per invio. Selezionati: ' + selectedIds.length);
    return;
  }

  if (!confirm(`Stai per inviare ${selectedIds.length} email. Continuare?`)) {
    return;
  }

  try {
    // Mostra stato
    document.getElementById('email-bulk-status').style.display = 'block';
    document.getElementById('btn-send-bulk').disabled = true;

    const result = await fetchAPI('/email/send-bulk', {
      method: 'POST',
      body: JSON.stringify({
        contatti_ids: selectedIds,
        oggetto: oggetto,
        corpo: corpo,
        template_id: templateId,
        delay_seconds: 3
      })
    });

    if (result.success) {
      // Polling per lo stato
      pollBulkEmailStatus();
    }
  } catch (error) {
    alert('Errore: ' + error.message);
    document.getElementById('email-bulk-status').style.display = 'none';
    document.getElementById('btn-send-bulk').disabled = false;
  }
}

async function pollBulkEmailStatus() {
  try {
    const status = await fetchAPI('/email/bulk-status');

    const total = status.total || 1;
    const sent = status.sent || 0;
    const failed = status.failed || 0;
    const progress = ((sent + failed) / total) * 100;

    document.getElementById('email-progress-text').textContent =
      `${sent} / ${total} email inviate${failed > 0 ? ` (${failed} fallite)` : ''}`;
    document.getElementById('email-progress-bar').style.width = progress + '%';

    if (status.inProgress) {
      setTimeout(pollBulkEmailStatus, 2000);
    } else {
      // Completato
      document.getElementById('btn-send-bulk').disabled = false;

      if (failed === 0) {
        alert(`Invio completato! ${sent} email inviate con successo.`);
      } else {
        alert(`Invio completato: ${sent} successo, ${failed} fallite.`);
      }

      setTimeout(() => {
        document.getElementById('email-bulk-status').style.display = 'none';
        document.getElementById('email-progress-bar').style.width = '0%';
      }, 3000);
    }
  } catch (error) {
    console.error('Errore polling:', error);
    setTimeout(pollBulkEmailStatus, 3000);
  }
}

// Listener per filtro stato email
document.getElementById('email-filter-stato')?.addEventListener('change', loadEmailContatti);

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

// Load user info
async function loadUserInfo() {
  try {
    const response = await fetch('/auth/user');
    if (response.ok) {
      const user = await response.json();

      const nameEl = document.getElementById('user-name');
      const emailEl = document.getElementById('user-email');
      const avatarEl = document.getElementById('user-avatar');

      if (nameEl) nameEl.textContent = user.name || 'Utente';
      if (emailEl) emailEl.textContent = user.email || '';
      if (avatarEl && user.picture) {
        avatarEl.src = user.picture;
        avatarEl.style.display = 'block';
      }
    }
  } catch (error) {
    console.log('User info not available');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  loadDashboard();
});
