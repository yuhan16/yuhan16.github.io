(function () {
  'use strict';

  var SEARCH_JSON  = '/assets/search.json';
  var PUB_JSON     = '/assets/pub.json';
  var LUNR_CDN     = 'https://cdn.jsdelivr.net/npm/lunr/lunr.min.js';
  var PUB_PAGE_URL = '/publications/';

  var lunrIndex = null;
  var allDocs   = null;

  var overlay   = document.getElementById('search-overlay');
  var inputEl   = document.getElementById('search-input');
  var resultsEl = document.getElementById('search-results');
  var toggleEl  = document.getElementById('search-toggle');
  var closeEl   = document.getElementById('search-close');

  // ── Open / close ──────────────────────────────────────────────────

  toggleEl.addEventListener('click', function (e) {
    e.preventDefault();
    overlay.style.display = 'flex';
    inputEl.focus();
    if (!allDocs) loadData();
  });

  closeEl.addEventListener('click', closeSearch);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSearch();
  });

  function closeSearch() {
    overlay.style.display = 'none';
    inputEl.value = '';
    resultsEl.innerHTML = '';
  }

  // ── Load data (lazy — only on first open) ─────────────────────────

  function loadData() {
    resultsEl.innerHTML = '<p class="search-no-results">Loading&hellip;</p>';
    loadScript(LUNR_CDN, function () {
      Promise.all([
        fetch(SEARCH_JSON).then(function (r) { return r.json(); }),
        fetch(PUB_JSON).then(function (r) { return r.json(); })
      ]).then(function (data) {
        var posts = data[0];
        var pubs  = (data[1].published || []).map(function (p, i) {
          return {
            id:      'pub-' + i,
            type:    'pub',
            title:   p.title   || '',
            url:     PUB_PAGE_URL,
            date:    p.journal || '',
            excerpt: p.abs ? (p.abs.length > 300 ? p.abs.slice(0, 300) + '...' : p.abs) : ''
          };
        });
        allDocs = posts.concat(pubs);
        buildIndex(allDocs);
      }).catch(function () {
        resultsEl.innerHTML = '<p class="search-no-results">Failed to load search data.</p>';
      });
    });
  }

  function loadScript(src, cb) {
    var s    = document.createElement('script');
    s.src    = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ── Build Lunr index ──────────────────────────────────────────────

  function buildIndex(docs) {
    lunrIndex = lunr(function () {
      this.ref('id');
      this.field('title',    { boost: 10 });
      this.field('category', { boost: 5  });
      this.field('tags',     { boost: 5  });
      this.field('excerpt');
      docs.forEach(function (d) { this.add(d); }, this);
    });
    resultsEl.innerHTML = '';
    if (inputEl.value.trim()) doSearch(inputEl.value.trim());
  }

  // ── Search ────────────────────────────────────────────────────────

  inputEl.addEventListener('input', function () {
    var q = this.value.trim();
    if (!q) { resultsEl.innerHTML = ''; return; }
    if (!lunrIndex) return;
    doSearch(q);
  });

  function doSearch(q) {
    var hits;
    try {
      // Try wildcard first for partial matching, fall back to exact
      hits = lunrIndex.search(q + '*');
      if (!hits.length) hits = lunrIndex.search(q);
    } catch (e) {
      hits = [];
    }
    renderResults(hits);
  }

  // ── Render results ────────────────────────────────────────────────

  function renderResults(hits) {
    if (!hits.length) {
      resultsEl.innerHTML = '<p class="search-no-results">No results found.</p>';
      return;
    }
    var html = '';
    hits.slice(0, 8).forEach(function (hit) {
      var doc = allDocs.find(function (d) { return d.id === hit.ref; });
      if (!doc) return;
      var badge = doc.type === 'pub'
        ? '<span class="search-badge search-badge-pub">Publication</span>'
        : '<span class="search-badge search-badge-post">Post</span>';
      html += '<a class="search-result-item" href="' + doc.url + '">';
      html += '<div class="search-result-title">' + badge + esc(doc.title) + '</div>';
      if (doc.date) html += '<div class="search-result-meta">' + esc(doc.date) + '</div>';
      if (doc.excerpt) html += '<div class="search-result-excerpt">' + esc(doc.excerpt) + '</div>';
      html += '</a>';
    });
    resultsEl.innerHTML = html;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
