# Domestic air travel in Australia

An interactive data story about how Australians fly within the country, from July 2014 to June 2026.
Built for FIT3179 Data Visualisation (Monash University), Data Visualisation 2, Volume 11, Topic 5: Domestic Air Travel.

**Live page:** https://jackhamervn.github.io/FIT3179-A2/

**Design sketch:** [sketch/sketch.pdf](sketch/sketch.pdf) (hand-drawn, A4)

**Author:** Quy Duong Vu. **Prepared:** 4 October 2026. **Updated:** 14 October 2026.

## The charts

Every chart and map is drawn with Vega-Lite or Vega. Each has its own readable JSON specification, numbered as on the page.

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
| 10 | Most disclosed trips cross a state border | Alluvial diagram | [10.json](specs/web/10.json) |
| 11 | Half of all routes fill 80 to 90% of their seats | Histogram | [11.json](specs/web/11.json) |
| 12 | The steepest falls were on short routes | Scatterplot | [12.json](specs/web/12.json) |
| 13 | Fuller planes on most routes | Slope chart | [13.json](specs/web/13.json) |
| 14 | The population grew faster than flying | Line chart | [14.json](specs/web/14.json) |
| 15 | The same top seven, movement below | Bump chart | [15.json](specs/web/15.json) |

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
| `index.html` | The page: narrative, structure and controls |
| `assets/` | Stylesheet and the script that embeds the charts, tables and CSV downloads |
| `specs/web/` | The fifteen chart specifications |
| `data/` | Prepared JSON extracts |
| `sketch/sketch.pdf` | Hand-drawn A4 design sketch |
| `vendor/` | Pinned Vega 6.4.0, Vega-Lite 6.4.3, Vega-Embed 7.3.0 and Lucide 0.468.0, with their licences |

Typefaces (B612, B612 Mono and Source Serif 4) load from Google Fonts. The page fetches JSON, so it needs a web server; opening `index.html` as a file will not load the charts.

## Acknowledgements

AI tools were used: OpenAI Codex and Anthropic Claude assisted with planning, data preparation, code and verification. Charts use Vega and Vega-Lite; icons use Lucide. Library credits are in `vendor/NOTICE.txt`.
