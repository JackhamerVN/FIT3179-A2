/* All charts share explicit page state; selections never change national totals. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const number = new Intl.NumberFormat('en-AU');
  const monthFormat = new Intl.DateTimeFormat('en-AU', {month: 'long', year: 'numeric', timeZone: 'UTC'});
  const state = {month: '2026-06-01', airport: '', region: '', mode: 'percent', group: '', bin: -1, route: ''};
  const files = ['national-monthly', 'routes-fy2026', 'routes-comparison', 'airports-activity', 'states-summary', 'route-groups', 'states-geometry', 'waterfall', 'route-share-tree', 'source-metadata', 'route-occupancy', 'trips-per-resident', 'airport-ranks'];
  const chartCount = 15;
  const dataset = {};
  const specs = new Map();
  const charts = new Map();
  const tableData = new Map();
  const titles = ['National history', 'Month by month', 'Offsetting changes', 'Route connections', 'Airport activity', 'National share', 'Comparable state change', 'State activity', 'Route differences', 'Connections and distance', 'Seat occupancy', 'Distance and change', 'Seat occupancy then and now', 'Trips per resident', 'Airport ranking'];
  const defaultState = {...state};
  let queue = Promise.resolve();
  let ready = false;
  const fmt = (value) => value == null ? 'Unavailable' : number.format(value);
  const million = (value) => `${(value / 1e6).toFixed(2)}m`;
  const pct = (value, signed = false) => `${signed && value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const routeLabel = (id) => dataset['routes-fy2026'].find((r) => r.route_id === id)?.route_name || (id === 'Remaining' ? 'All other national changes' : id);

  async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  }

  function enqueue(task) {
    queue = queue.then(task).catch((error) => {
      console.error(error);
      $('#app-status').textContent = 'A chart could not be updated. Its data table remains available.';
    });
    return queue;
  }

  function options(id, rows, value, label, first) {
    const select = $(id);
    if (first) select.append(new Option(first, ''));
    rows.forEach((row) => select.append(new Option(label(row), String(value(row)))));
  }

  function initialiseControls() {
    options('#month-select', dataset['national-monthly'], (r) => r.month, (r) => monthFormat.format(new Date(r.month)));
    options('#airport-select', [...dataset['airports-activity']].sort((a, b) => a.city.localeCompare(b.city)), (r) => r.airport_id, (r) => `${r.city} (${r.airport_id})`, 'All airports');
    options('#state-select', dataset['states-summary'], (r) => r.state_id, (r) => r.name, 'All states and territories');
    options('#group-select', dataset['route-groups'], (r) => r.group_id, (r) => `${r.relation} / ${r.distance_band}`, 'All route groups');
    $('#bin-select').append(new Option('All occupancy bands', '-1'));
    for (let n = 0; n < 100; n += 10) $('#bin-select').append(new Option(`${n}% to ${n === 90 ? '100%' : `under ${n + 10}%`}`, String(n)));
    options('#route-select', [...dataset['routes-comparison']].sort((a, b) => a.route_name.localeCompare(b.route_name)), (r) => r.route_id, (r) => r.route_name, 'All comparable routes');
    const controls = {'#month-select': 'month', '#airport-select': 'airport', '#state-select': 'region', '#group-select': 'group', '#bin-select': 'bin', '#route-select': 'route'};
    for (const [id, key] of Object.entries(controls)) {
      $(id).value = state[key];
      $(id).addEventListener('change', (event) => selectValue(key, key === 'bin' ? Number(event.target.value) : event.target.value));
    }
    document.querySelectorAll('[name="change-mode"]').forEach((input) => input.addEventListener('change', () => selectValue('mode', input.value)));
    $('#reset-all').addEventListener('click', () => enqueue(async () => {
      Object.assign(state, defaultState);
      for (const [id, key] of Object.entries(controls)) $(id).value = state[key];
      $('[name="change-mode"][value="percent"]').checked = true;
      await renderAll();
      updateDetails();
      updateTables();
      $('#app-status').textContent = 'All selections reset.';
    }));
  }

  const bindings = {
    month: {signal: 'selectedMonth', charts: [1, 2], control: '#month-select'},
    airport: {signal: 'selectedAirport', charts: [4, 5, 6], control: '#airport-select'},
    region: {signal: 'selectedState', charts: [7, 8], control: '#state-select'},
    group: {signal: 'selectedGroup', charts: [10], control: '#group-select'},
    bin: {signal: 'selectedBin', charts: [11], control: '#bin-select'},
    route: {signal: 'selectedRoute', charts: [12, 13], control: '#route-select'},
  };

  function selectValue(key, value) {
    return enqueue(async () => {
      state[key] = value;
      const binding = bindings[key];
      if (binding) {
        $(binding.control).value = value;
        for (const id of binding.charts) if (charts.has(id)) await charts.get(id).view.signal(binding.signal, value).runAsync();
      } else if (key === 'mode') {
        await renderChart(9);
      }
      updateDetails();
      updateTables();
    });
  }

  function onChartClick(id, item) {
    const raw = item?.datum;
    if (!raw) return;
    const datum = raw.datum || raw;
    if ((id === 1 || id === 2) && datum.month != null) {
      const date = new Date(datum.month);
      if (!Number.isNaN(date.valueOf())) selectValue('month', date.toISOString().slice(0, 10));
    }
    if ((id === 4 || id === 5) && datum.airport_id) selectValue('airport', state.airport === datum.airport_id ? '' : datum.airport_id);
    if ((id === 7 || id === 8) && datum.state_id) selectValue('region', state.region === datum.state_id ? '' : datum.state_id);
    if (id === 10 && datum.group_id) selectValue('group', state.group === datum.group_id ? '' : datum.group_id);
    if (id === 11 && Number.isFinite(datum.bin_start)) selectValue('bin', state.bin === datum.bin_start ? -1 : datum.bin_start);
    if ((id === 12 || id === 13) && datum.route_id) selectValue('route', state.route === datum.route_id ? '' : datum.route_id);
  }

  function chartHeight(id, width) {
    if (id === 4) return width < 550 ? 345 : 440;
    if (id === 8) return 350;
    if (id === 9) return width < 550 ? 485 : 425;
    if (id === 10) return width < 550 ? 380 : 360;
    if (id === 13) return width < 550 ? 420 : 460;
    return specs.get(id).height;
  }

  async function renderChart(id) {
    const element = $(`#chart-${String(id).padStart(2, '0')}`);
    const width = Math.floor(element.getBoundingClientRect().width);
    const spec = structuredClone(specs.get(id));
    const isLite = spec.$schema.includes('vega-lite');
    spec.width = isLite ? width : width - 16;
    spec.height = chartHeight(id, width);
    element.style.minHeight = `${spec.height}px`;
    for (const [key, binding] of Object.entries(bindings)) {
      const param = (spec.params || spec.signals || []).find((p) => p.name === binding.signal);
      if (param) param.value = state[key];
    }
    if (id === 9) {
      spec.params[0].value = state.mode;
      spec.encoding.x.axis.title = state.mode === 'percent' ? 'Change (%)' : 'Change in passenger trips';
      if (width < 550) {
        spec.encoding.y.axis.labelExpr = "split(datum.label,' - ')";
        spec.encoding.y.axis.labelFontSize = 10;
        spec.encoding.y.axis.labelLineHeight = 12;
        spec.encoding.y.axis.labelLimit = 100;
        spec.encoding.x.axis.tickCount = 5;
      }
    }
    if (id === 3 && width < 420) spec.layer.forEach((layer) => {
      if (layer.mark.type === 'bar') layer.mark.size = 28;
      if (layer.encoding.x?.axis) Object.assign(layer.encoding.x.axis, {labelFontSize: 9, labelExpr: "[['Karratha','Perth'],['Sunshine','Coast','Melb.'],['Melb.','Sydney'],['Brisbane','Sydney'],['All other','changes'],['Net','change']][datum.value]"});
    });
    const compact = (spec.params || []).find((p) => p.name === 'compactLabels');
    if (compact) compact.value = width < 550;
    if (id === 1 && width < 550) spec.layer.forEach((layer) => { if (layer.encoding.x?.axis) layer.encoding.x.axis.tickCount = 4; });
    charts.get(id)?.finalize();
    try {
      const result = await vegaEmbed(element, spec, {actions: false, renderer: 'svg', tooltip: {theme: 'light'}, defaultStyle: false});
      charts.set(id, result);
      result.view.addEventListener('click', (_event, item) => onChartClick(id, item));
      element.setAttribute('aria-busy', 'false');
      element.classList.remove('chart-error');
      element.dataset.renderedWidth = String(width);
    } catch (error) {
      charts.delete(id);
      element.setAttribute('aria-busy', 'false');
      element.classList.add('chart-error');
      element.innerHTML = 'This chart could not load. The data table below is still available.';
      console.error(`Chart ${id}:`, error);
    }
  }

  async function renderAll() {
    for (let id = 1; id <= chartCount; id++) await renderChart(id);
  }

  function updateDetails() {
    const month = dataset['national-monthly'].find((r) => r.month === state.month);
    $('#month-detail').innerHTML = `${monthFormat.format(new Date(month.month))}<strong>${fmt(month.passenger_trips)} trips</strong>`;
    const routes = dataset['routes-fy2026'].filter((r) => r.disclosure_status === 'reported' && (!state.airport || r.a === state.airport || r.b === state.airport)).sort((a, b) => b.passenger_trips - a.passenger_trips);
    $('#top-routes').innerHTML = routes.slice(0, 5).map((r) => `<li><span>${escapeHTML(r.route_name)}</span><strong>${million(r.passenger_trips)} <small>trips</small></strong></li>`).join('');
    const airport = dataset['airports-activity'].find((r) => r.airport_id === state.airport);
    $('#ranking-title').textContent = airport ? `${airport.city}: busiest links` : 'The busiest links';
    $('#airport-detail').textContent = airport ? `${airport.name}: ${fmt(airport.endpoint_movements)} endpoint movements across ${routes.length} disclosed routes.` : '62 disclosed routes account for 88.9% of all domestic trips.';
    const region = dataset['states-summary'].find((r) => r.state_id === state.region);
    $('#state-detail').textContent = region ? `${region.name}: ${pct(region.change_pct, true)} on comparable routes. Latest disclosed activity: ${million(region.endpoint_movements)} endpoint movements. These two measures use different route groups.` : 'Different denominators: the change map uses 57 comparable routes; the circle map uses 62 latest disclosed routes. Every trip contributes at both endpoints.';
    const group = dataset['route-groups'].find((r) => r.group_id === state.group);
    $('#group-detail').innerHTML = group ? `${group.route_ids.length} routes<strong>${fmt(group.passenger_trips)} trips</strong>` : `All disclosed routes<strong>53,982,647 trips</strong>`;
    const occupied = occupancyRows();
    $('#bin-detail').textContent = state.bin < 0 ? 'National seat occupancy: 80.7%. BITRE distance-weighted load factor: 82.2%.' : `${occupied.length} route${occupied.length === 1 ? '' : 's'} in this occupancy band. ${occupied.length ? 'Their annual figures are listed in the data table.' : 'No disclosed routes fall in this band.'}`;
    const route = dataset['routes-comparison'].find((r) => r.route_id === state.route);
    const occupancy = dataset['route-occupancy'];
    const seats = occupancy.find((r) => r.route_id === state.route);
    const fuller = occupancy.filter((r) => r.change_points > 0).length;
    $('#occupancy-detail').textContent = seats ? `${seats.route_name}: ${seats.occupancy_2019_pct.toFixed(1)}% of seats filled in FY2018-19; ${seats.occupancy_2026_pct.toFixed(1)}% in FY2025-26 (${seats.change_points > 0 ? '+' : ''}${seats.change_points.toFixed(1)} percentage points).` : `${fuller} of ${occupancy.length} comparable routes filled a larger share of seats than in FY2018-19; ${occupancy.length - fuller} filled a smaller share.`;
    $('#route-detail').textContent = route ? `${route.route_name}: ${fmt(route.distance_km)} km; ${pct(route.change_pct, true)}; ${fmt(route.baseline_trips)} to ${fmt(route.latest_trips)} trips.` : '57 comparable routes. Blue indicates growth; rust indicates decline.';
  }

  function occupancyRows() {
    return dataset['routes-fy2026'].filter((r) => r.disclosure_status === 'reported' && (state.bin < 0 || (r.occupancy_pct >= state.bin && (r.occupancy_pct < state.bin + 10 || (state.bin === 90 && r.occupancy_pct === 100)))));
  }

  function rowsFor(id) {
    const months = dataset['national-monthly'];
    const latest = dataset['routes-fy2026'].filter((r) => r.disclosure_status === 'reported');
    const compare = dataset['routes-comparison'];
    const routeColumns = ['Route', 'FY2018-19 trips', 'FY2025-26 trips', 'Change (%)'];
    const compareRow = (r) => [r.route_name, r.baseline_trips, r.latest_trips, Number(r.change_pct.toFixed(2))];
    if (id === 1 || id === 2) return {columns: ['Month', 'Passenger trips', 'Seats'], rows: months.map((r) => [r.month.slice(0, 7), r.passenger_trips, r.seats]), note: '144 months. Month values use UTC dates; counts are national totals.'};
    if (id === 3) return {columns: ['Route / group', 'Change in trips'], rows: dataset.waterfall.map((r) => [routeLabel(r.label), r.delta_trips]), note: 'These five components sum to -228,634 trips. The remainder is a national residual, not solely the other comparable routes.'};
    if (id === 4) return {columns: ['Route', 'Passenger trips'], rows: latest.filter((r) => r.rank <= 15 || (state.airport && (r.a === state.airport || r.b === state.airport))).sort((a, b) => a.rank - b.rank).map((r) => [r.route_name, r.passenger_trips]), note: 'Routes visible in the flow map: top 15, plus additional disclosed links at the selected airport.'};
    if (id === 5) return {columns: ['Airport', 'State', 'Endpoint movements'], rows: dataset['airports-activity'].map((r) => [r.name, r.state_id, r.endpoint_movements]), note: 'The 40 airports sum to 107,965,294 endpoint movements: twice the disclosed-route trip count.'};
    if (id === 6) {
      const tree = dataset['route-share-tree'];
      const groupName = Object.fromEntries(tree.filter((r) => r.parent === 'National').map((r) => [r.id, r.name]));
      return {columns: ['Route', 'Group', 'Trips', 'National share (%)'], rows: tree.filter((r) => groupName[r.parent]).map((r) => [r.name, groupName[r.parent], r.passenger_trips, Number((100 * r.passenger_trips / 60753164).toFixed(2))]), note: 'Two levels: three groups, then the routes inside each. Every trip is counted once and all tiles sum to the national total.'};
    }
    if (id === 7) return {columns: ['State / territory', '2018-19 endpoints', '2025-26 endpoints', 'Change (%)'], rows: dataset['states-summary'].map((r) => [r.name, r.baseline_comparable, r.latest_comparable, Number(r.change_pct.toFixed(2))]), note: 'Same 57 routes in both years. Within-state routes contribute two endpoints to that state.'};
    if (id === 8) return {columns: ['State / territory', 'Endpoint movements'], rows: dataset['states-summary'].map((r) => [r.name, r.endpoint_movements]), note: 'FY2025-26, 62 disclosed routes. Geographic displacement does not change circle area.'};
    if (id === 9) {
      const field = state.mode === 'percent' ? 'change_pct' : 'delta_trips';
      const rows = [...compare].sort((a, b) => Math.abs(b[field]) - Math.abs(a[field]) || a.route_id.localeCompare(b.route_id)).slice(0, 12).sort((a, b) => b[field] - a[field]);
      return {columns: [...routeColumns, 'Change in trips'], rows: rows.map((r) => [...compareRow(r), r.delta_trips]), note: `Twelve largest absolute changes by ${state.mode === 'percent' ? 'percentage' : 'trip count'}, sorted from largest increase to largest decline.`};
    }
    if (id === 10) {
      const group = dataset['route-groups'].find((r) => r.group_id === state.group);
      if (group) return {columns: ['Route', 'Distance (km)', 'Passenger trips'], rows: latest.filter((r) => group.route_ids.includes(r.route_id)).map((r) => [r.route_name, r.distance_km, r.passenger_trips]), note: `${group.relation}; ${group.distance_band}. Constituent routes of the selected ribbon.`};
      return {columns: ['State connection', 'Distance band', 'Passenger trips', 'Routes'], rows: dataset['route-groups'].map((r) => [r.relation, r.distance_band, r.passenger_trips, r.route_ids.length]), note: 'Each disclosed route belongs to one group. Ribbon totals sum to 53,982,647 trips.'};
    }
    if (id === 11) return {columns: ['Route', 'Trips', 'Seats', 'Occupancy (%)'], rows: occupancyRows().map((r) => [r.route_name, r.passenger_trips, r.seats, Number(r.occupancy_pct.toFixed(2))]), note: 'Lower band bound is inclusive; upper bound is exclusive, except 100% belongs to the final band. Unavailable annual totals are excluded, not set to zero.'};
    if (id === 13) return {columns: ['Route', 'FY2018-19 seats filled (%)', 'FY2025-26 seats filled (%)', 'Change (points)'], rows: dataset['route-occupancy'].filter((r) => !state.route || r.route_id === state.route).map((r) => [r.route_name, r.occupancy_2019_pct, r.occupancy_2026_pct, r.change_points]), note: 'Same 57 city pairs in both years, busiest first. Seats filled is passenger trips divided by seats flown. Label positions on the chart are spread apart; these are the plotted values.'};
    if (id === 14) return {columns: ['Financial year', 'Passenger trips', 'Residents at 31 December', 'Trips per resident'], rows: dataset['trips-per-resident'].map((r) => [r.fy, r.passenger_trips, r.population, Number(r.trips_per_resident.toFixed(2))]), note: 'Passenger trips: BITRE. Estimated resident population at the midpoint of each financial year: ABS. Trips include those taken by visitors.'};
    if (id === 15) return {columns: ['Airport', 'Financial year', 'Rank', 'Passenger movements'], rows: dataset['airport-ranks'].map((r) => [r.airport, r.fy, r.rank, r.passenger_movements]), note: 'Arrivals plus departures on scheduled domestic and regional flights. Ranks to FY2024-25 use every airport BITRE reports; FY2025-26 uses the monthly file for the 20 busiest airports.'};
    return {columns: ['Route', 'Distance (km)', 'Change (%)'], rows: compare.filter((r) => !state.route || r.route_id === state.route).map((r) => [r.route_name, r.distance_km, Number(r.change_pct.toFixed(2))]), note: 'Same 57 city pairs in both years. A route selection highlights a point without rescaling either axis.'};
  }

  function initialiseTables() {
    document.querySelectorAll('[data-chart]').forEach((figure) => {
      const id = Number(figure.dataset.chart);
      const footer = document.createElement('div');
      footer.className = 'chart-footer';
      footer.innerHTML = `<details><summary>Data &amp; definitions</summary><div class="data-region" tabindex="0" role="region" aria-label="${titles[id - 1]} data"></div><p class="data-note"></p></details><button type="button" class="icon-button" aria-label="Download ${titles[id - 1]} data as CSV" data-tip="Download data"><i data-lucide="download" aria-hidden="true"></i></button><a class="icon-button" href="specs/web/${String(id).padStart(2, '0')}.json" aria-label="${titles[id - 1]} chart specification" data-tip="Chart specification"><i data-lucide="file-json-2" aria-hidden="true"></i></a>`;
      footer.querySelector('button').addEventListener('click', () => downloadCSV(id));
      figure.append(footer);
    });
  }

  function updateTables() {
    for (let id = 1; id <= chartCount; id++) {
      const content = rowsFor(id);
      tableData.set(id, content);
      const figure = $(`[data-chart="${id}"]`);
      figure.querySelector('.data-note').textContent = content.note;
      const region = figure.querySelector('.data-region');
      region.innerHTML = content.rows.length ? `<table><caption>${escapeHTML(titles[id - 1])} &middot; ${content.rows.length} records</caption><thead><tr>${content.columns.map((name) => `<th scope="col">${escapeHTML(name)}</th>`).join('')}</tr></thead><tbody>${content.rows.map((row) => `<tr>${row.map((value, i) => `<${i === 0 ? 'th scope="row"' : 'td'}>${escapeHTML(typeof value === 'number' ? fmt(value) : value)}</${i === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="empty-data">No routes in this group.</p>';
    }
  }

  function downloadCSV(id) {
    const content = tableData.get(id);
    const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [content.columns, ...content.rows].map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `australian-air-travel-${String(id).padStart(2, '0')}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function start() {
    lucide.createIcons();
    try {
      await Promise.all(files.map(async (name) => { dataset[name] = await fetchJSON(`data/${name}.json`); }));
      await Promise.all(Array.from({length: chartCount}, async (_, index) => { specs.set(index + 1, await fetchJSON(`specs/web/${String(index + 1).padStart(2, '0')}.json`)); }));
      // Text is measured when a chart renders, so wait briefly for the web fonts.
      if (document.fonts) await Promise.race([Promise.all([document.fonts.load('12px "B612"'), document.fonts.load('700 12px "B612"')]).catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2500))]);
      initialiseControls();
      initialiseTables();
      updateTables();
      updateDetails();
      lucide.createIcons();
      await renderAll();
      document.querySelectorAll('select, input[type="radio"], #reset-all').forEach((control) => { control.disabled = false; });
      ready = true;
      document.documentElement.dataset.ready = 'true';
      $('#app-status').textContent = charts.size === chartCount ? 'All fifteen charts loaded.' : 'Some charts could not load. Data tables are available.';
      let resizeTimer;
      const observer = new ResizeObserver(() => {
        if (!ready) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => enqueue(async () => {
          for (let id = 1; id <= chartCount; id++) {
            const element = $(`#chart-${String(id).padStart(2, '0')}`);
            if (Math.floor(element.getBoundingClientRect().width) !== Number(element.dataset.renderedWidth)) await renderChart(id);
          }
        }), 150);
      });
      document.querySelectorAll('.chart').forEach((element) => observer.observe(element));
    } catch (error) {
      console.error(error);
      $('#app-status').textContent = 'The data story could not load.';
      const warning = document.createElement('p');
      warning.className = 'error-banner';
      warning.setAttribute('role', 'alert');
      warning.textContent = location.protocol === 'file:' ? 'Chart data requires a local web server. Run node serve.cjs from this project, then open the printed localhost address.' : 'The chart data could not load. Reload the page or consult the source files.';
      $('.introduction').append(warning);
      document.querySelectorAll('.chart').forEach((element) => {
        element.setAttribute('aria-busy', 'false');
        element.classList.add('chart-error');
        element.textContent = 'Chart data unavailable.';
      });
    }
    let scrollPending = false;
    const updateNavigation = () => {
      const visible = [...document.querySelectorAll('.chapter')].filter((chapter) => chapter.getBoundingClientRect().top <= 200).at(-1);
      document.querySelectorAll('nav a').forEach((link) => {
        if (visible && link.hash === `#${visible.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      scrollPending = false;
    };
    addEventListener('scroll', () => {
      if (!scrollPending) {
        scrollPending = true;
        requestAnimationFrame(updateNavigation);
      }
    }, {passive: true});
    updateNavigation();
  }
  start();
})();
