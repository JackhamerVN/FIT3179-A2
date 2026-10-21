# Domestic air travel in Australia

An interactive data story about domestic air travel in Australia, from July 2014 to June 2026.
Built for FIT3179 Data Visualisation (Monash University), Data Visualisation 2, Volume 11, Topic 5: Domestic Air Travel.

**Live page:** https://jackhamervn.github.io/FIT3179-A2/

**Design sketch:** [sketch/sketch.pdf](sketch/sketch.pdf) (hand-drawn, A4)

**Author:** Quy Duong Vu. **Prepared:** 4 October 2026. **Updated:** 22 October 2026.

## The charts

Every chart and map is drawn with Vega-Lite or Vega. Each has its own readable JSON specification, numbered as on the page. Charts 4, 6, 8 and 10 use Vega because they need layouts that Vega-Lite does not provide (curved flow links, a two-level treemap, force-separated circles and alluvial ribbons); the others use Vega-Lite.

| # | Chart | Idiom | Specification |
|---|---|---|---|
| 1 | A 97% fall in two months, then a long climb back | Line chart | [01.json](specs/web/01.json) |
| 2 | Two years stand out from a steady seasonal rhythm | Heatmap | [02.json](specs/web/02.json) |
| 3 | Growth did not happen everywhere | Waterfall chart | [03.json](specs/web/03.json) |
| 4 | The busiest links run along the east coast | Flow map | [04.json](specs/web/04.json) |
| 5 | Three airports handle three-fifths of the traffic | Proportional symbol map | [05.json](specs/web/05.json) |
| 6 | Ten routes, half the traffic | Treemap | [06.json](specs/web/06.json) |
| 7 | Up in the west, down in the south-east | Choropleth map | [07.json](specs/web/07.json) |
| 8 | Three eastern states carry three-quarters of the activity | Dorling cartogram | [08.json](specs/web/08.json) |
| 9 | Karratha–Perth gained most; Sydney and Melbourne routes lost most | Bar chart | [09.json](specs/web/09.json) |
| 10 | 83% of disclosed trips cross a state or territory border | Alluvial diagram | [10.json](specs/web/10.json) |
| 11 | Half of all routes fill 80 to 90% of their seats | Histogram | [11.json](specs/web/11.json) |
| 12 | The steepest falls were on short routes | Scatterplot | [12.json](specs/web/12.json) |
| 13 | Fuller planes on most routes | Slope chart | [13.json](specs/web/13.json) |
| 14 | Trips per resident remain 10% below 2018–19 | Line chart | [14.json](specs/web/14.json) |
| 15 | The top seven returned to their earlier order | Bump chart | [15.json](specs/web/15.json) |

## How the page works

`index.html` embeds each chart in the usual way: `vegaEmbed('#chart-01', 'specs/web/01.json')`. Each specification loads its data with `"data": {"url": "data/...json"}`. Nothing else runs on the page.

The specifications are self-contained:

- **Size:** Vega-Lite charts use `"width": "container"`; the Vega charts read the container width through a `width` signal, so every chart fits a phone or a laptop.
- **Interaction:** menus and buttons are Vega-Lite `bind` parameters or Vega signal bindings, and highlighting uses selection parameters. Hover the line (1) or the heatmap (2); choose an airport (4, 15), a route (12), a route group (10) or the ranking measure (9); click an airport (5), a state (7, 8), a histogram bar (11) or a line (13, 15) to highlight it. Double-click clears a selection.

## Data sources

- Bureau of Infrastructure and Transport Research Economics (BITRE), [Australian domestic aviation activity: time series](https://www.bitre.gov.au/publications/ongoing/domestic_airline_activity-time_series), Top routes workbook, July 2014 to June 2026.
- BITRE, [Airport traffic data](https://www.bitre.gov.au/resource/aviation/airport-traffic-data), financial years to 2024–25 and monthly figures for the 20 busiest airports to June 2026 (chart 15).
- Australian Bureau of Statistics, [National, state and territory population, March 2026](https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/mar-2026), estimated resident population (chart 14).
- [OurAirports](https://ourairports.com/data/), airport coordinates and state identifiers.
- [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/), state and territory boundaries.

The page loads small prepared extracts from `data/` (about 200 KB in total). `data/source-metadata.json` and `data/extra-metadata.json` record definitions, caveats and the checksums of the source files.

## Files

| Path | Contents |
|---|---|
| `index.html` | The page: narrative, layout and the `vegaEmbed` calls |
| `assets/styles.css` | Layout, typography and colour |
| `specs/web/` | The fifteen chart specifications (Vega-Lite and Vega JSON) |
| `data/` | Prepared JSON extracts |
| `sketch/sketch.pdf` | Hand-drawn A4 design sketch |
| `vendor/` | Pinned Vega 6.4.0, Vega-Lite 6.4.3 and Vega-Embed 7.3.0, with their licences |

Typefaces (B612, B612 Mono and Source Serif 4) load from Google Fonts. GitHub Pages serves the page. Browsers block JSON requests from a page opened directly from disk, so to view it locally run any static server in this folder (for example `python3 -m http.server`).

## Acknowledgements

AI tools were used: OpenAI Codex and Anthropic Claude assisted with planning, data preparation, code and verification. Charts use Vega and Vega-Lite; the plane icon is from Lucide. Library credits are in `vendor/NOTICE.txt`.
