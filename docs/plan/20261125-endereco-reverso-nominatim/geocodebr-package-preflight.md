# GeocodeBR Python package preflight

**Checked:** 2026-11-26  
**Scope:** Official Ipea GeocodeBR reverse geocoding in an internal Python service; no code was changed, no dataset was downloaded or executed, and no coordinates were sent to any external service.

## Decision

- **GO, with constraints, for implementation and isolated tests:** the current official Python package exposes the needed reverse-geocoding API, supports Python 3.10+, accepts SIRGAS 2000 / EPSG:4674 points, and returns a nearest CNEFE logradouro result within a configurable radius. Implementation and tests must mock the API/data access so no real CNEFE files are downloaded.
- **PENDING for production or any real-data activation:** the checked official Ipea sources describe the CNEFE source and package cache, but do not establish CNEFE terms that authorize this application's download, local copy, transformed derivative, persistent Docker-volume storage, or any redistribution. The IBGE product page could not be fetched in this check (HTTP 403). Do not treat the Python package's MIT license as a license for CNEFE or its derived files.
- **Exact release blocker:** before downloading or storing real CNEFE data, obtain and record an authoritative IBGE/Ipea statement or applicable license/terms that explicitly cover this application's intended use, local caching and persistent hosting, and any distribution/redistribution involved. The application owner must approve release after that evidence and dataset readiness are recorded. Until then, keep production geocoding disabled and do not mount or populate a real-data cache.

## Package and API findings

The official project documents a Python package available from PyPI (`python -m pip install geocodebr`) and supports reverse lookup with the `geo` extra (`python -m pip install "geocodebr[geo]"`). The Python package metadata on the official repository specifies `requires-python = ">=3.10"`; it declares Python 3.10 through 3.14 classifiers. The reverse function needs GeoPandas, provided by the `geo` extra. This is compatible with a Python 3.10+ internal service in principle; the service should pin a reviewed package version and validate its exact runtime/dependency set in the eventual container.

`geocode_reverso(pontos, dist_max=1000, ...)` requires a GeoDataFrame of POINT geometries with CRS EPSG:4674 (SIRGAS 2000). It searches for the nearest address within `dist_max` meters; default is 1,000 m, with accepted values 500 through 100,000 m. It returns address fields (`estado`, `municipio`, `logradouro`, `cep`, `localidade`) and `distancia_metros`; points without a match inside the radius are omitted, and the function raises an error if no point matches. The returned geometry is the input point.

This is a nearest address/logradouro suggestion, not a guaranteed property address. In particular, the reverse implementation's selected output address fields do not include a property number. Keep the existing manual address/number entry available, label any result as an editable suggestion, and do not promise a building number.

## Code license and distribution

The official Python package is installable from PyPI or the Ipea repository source. Its `python-package/pyproject.toml` says `license = "MIT"` and identifies `python-package/LICENSE.txt`, which contains the MIT grant and notice-preservation condition. If using the package/code, retain the applicable copyright and license notice. The repository-level GitHub metadata is not a substitute for checking the Python subpackage's license: the MIT finding here is specifically for the Python package's own license file.

This grant applies to the software, not automatically to the source dataset or the processed Parquet files. Neither package metadata nor the Python package MIT license establishes that CNEFE data has MIT terms or that transformed CNEFE extracts may be redistributed.

## CNEFE origin, download/cache, storage and updates

The official Ipea project documentation identifies the Cadastro Nacional de Enderecos para Fins Estatisticos (CNEFE) as the primary source and says it is published by IBGE. The Ipea cache documentation states that GeocodeBR uses preprocessed/enriched CNEFE reference Parquet tables and downloads each function's needed table on first use. Reverse geocoding uses one table, documented as about 100 MB; all package cache tables total about 1.2 GB. These are upstream documented approximate sizes, not a measurement of a Docker volume or compressed download.

The Python package's downloader fetches its processed Parquet files from releases of `ipeaGIT/padronizacao_cnefe`; by default it writes them to the package's persistent user cache (via `platformdirs`). The cache API can select a custom directory. The cache documentation says data is versioned; when a package version uses a new data release, it downloads into a new release-specific subdirectory and removes older release data in the same cache directory. The docs also describe pre-downloading and a temporary non-cache mode.

Operational implication for a future Compose service: if and when data use is approved, configure a dedicated cache directory on an explicitly managed persistent volume so container replacement does not discard the cache and repeat downloads. Keep the dataset out of the application image/build artifact unless redistribution rights are independently established. Budget at least the documented approximate reverse-table size plus filesystem overhead, and confirm actual storage, download and update behavior against the approved release before rollout. Do not initialize this volume with real data before the terms gate is cleared.

**Terms gap:** the Ipea sources establish origin, download, cache, approximate sizes and version behavior, but the reviewed pages do not state a CNEFE license or explicit conditions for copying, persistent caching, processing, container hosting or redistribution. The official IBGE CNEFE product URL is linked below, but requests to it returned HTTP 403 in this check, so its current page contents and any linked terms could not be verified. No legal permission is inferred from the labels "publicado" or "dados abertos."

## Lifecycle and activity

The Python package metadata on PyPI and `pyproject.toml` classifies the package as **Alpha** (`Development Status :: 3 - Alpha`). The official project site also displays an experimental lifecycle badge. At the same time, the official repository API reported a recent push on 2026-11-23 and the project identifies itself as active. Recent activity does not remove the stability risk implied by Alpha/experimental status. Plan for version pinning, regression tests with mocked data access, and review of upstream changes before upgrades; do not make availability of a public user-facing feature depend on an unreviewed upgrade.

## Safe implementation boundary

The service can be implemented and tested without real CNEFE files: isolate the adapter around the official `geocode_reverso` call and mock the package/data boundary in automated tests. Tests should verify EPSG:4674 construction, the selected radius, nearest `logradouro` extraction, no-number behavior, no-match handling, and fail-closed behavior when package/data access is unavailable. Test setup must not call `download_cnefe()` or a real reverse lookup. Production activation must remain separately disabled until the terms blocker above is resolved and documented.

Keep the browser flow consent-based, route coordinates only through the application's own backend to the internal service, do not log coordinates, preserve manual entry, and present returned logradouro as a suggestion without a guaranteed number.

## Official sources checked

All sources below were checked on 2026-11-26.

1. Ipea project site, source identity and installation: <https://ipea.github.io/geocodebr/>
2. Ipea Python package README, installation, reverse usage, CRS, cache and sizes: <https://github.com/ipea/geocodebr/blob/main/python-package/README.md>
3. Ipea Python reverse implementation and docstrings: <https://github.com/ipea/geocodebr/blob/main/python-package/geocodebr/reverse.py> and <https://raw.githubusercontent.com/ipea/geocodebr/main/python-package/geocodebr/reverse.py>
4. Ipea Python package metadata, runtime, dependencies, alpha classifier and license declaration: <https://raw.githubusercontent.com/ipea/geocodebr/main/python-package/pyproject.toml>
5. Ipea Python package license: <https://github.com/ipea/geocodebr/blob/main/python-package/LICENSE.txt>
6. Official Ipea cache documentation: <https://ipea.github.io/geocodebr/articles/cache_dados.html>
7. Official Ipea downloader implementation, showing processed-data release source and cache/temp behavior: <https://raw.githubusercontent.com/ipea/geocodebr/main/python-package/geocodebr/download_cnefe.py>
8. PyPI package metadata: <https://pypi.org/project/geocodebr/> and <https://pypi.org/pypi/geocodebr/json>
9. Official IBGE CNEFE product page (Ipea identifies this as the publication source; page fetch returned HTTP 403 during this check): <https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-fins-estatisticos.html>
10. Official Ipea GitHub repository metadata/activity: <https://api.github.com/repos/ipea/geocodebr>

No IBGE CNEFE license, terms of use, or redistribution authorization was verified in this preflight. This is an unresolved production blocker, not evidence that such terms do not exist.
