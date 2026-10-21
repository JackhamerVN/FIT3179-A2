# Domestic air travel in Australia

A data story about domestic air travel in Australia, July 2014 to June 2026.
FIT3179 Data Visualisation 2, Volume 11, Topic 5: Domestic Air Travel.

- **Live page:** https://jackhamervn.github.io/FIT3179-A2/
- **Sketch:** [sketch/sketch.pdf](sketch/sketch.pdf)
- **Author:** Quy Duong Vu, 22 October 2026

## Charts

All charts are made with Vega-Lite or Vega. Specifications are in [`specs/web/`](specs/web/) (`01.json` to `14.json`, in page order); data is in [`data/`](data/).

| # | Idiom | # | Idiom |
|---|---|---|---|
| 1 | Line chart | 8 | Bar chart |
| 2 | Heatmap | 9 | Scatterplot |
| 3 | Bar chart (% change) | 10 | Choropleth map |
| 4 | Flow map | 11 | Dorling cartogram |
| 5 | Proportional symbol map | 12 | Bump chart |
| 6 | Treemap | 13 | Histogram |
| 7 | Alluvial diagram | 14 | Connected dot plot |

## Data sources

- BITRE, [Australian domestic aviation activity: time series](https://www.bitre.gov.au/publications/ongoing/domestic_airline_activity-time_series)
- BITRE, [Airport traffic data](https://www.bitre.gov.au/resource/aviation/airport-traffic-data)
- ABS, [National, state and territory population, March 2026](https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/mar-2026)
- [OurAirports](https://ourairports.com/data/) (airport locations) and [Natural Earth](https://www.naturalearthdata.com/) (state boundaries)
- Context in captions: ACCC domestic airline media releases (12 Aug 2025, 9 Dec 2025), WA Department of Mines, Petroleum and Exploration 2024–25 Statistics Digest, AAP (22 Sep 2023)

## Acknowledgements

OpenAI Codex and Anthropic Claude assisted with planning, data preparation, code and verification. Library licences are in `vendor/`.
