import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { MPLADProject, RiskLevel } from '../types';
import { RiskBadge } from './RiskBadge';
import { getProjectCoordinates, ProjectLocationResult } from '../utils/geoCoordinates';
import {
  Search,
  RotateCcw,
  Layers,
  MapPin,
  AlertTriangle,
  ArrowUpRight,
  Crosshair,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Info,
} from 'lucide-react';

interface MapViewProps {
  projects: MPLADProject[];
  onSelectProject: (project: MPLADProject) => void;
}

interface MappedProject {
  project: MPLADProject;
  location: ProjectLocationResult;
}

interface StateSummary {
  name: string;
  totalProjects: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalAmountLakhs: number;
  avgRiskScore: number;
}

// Center of India and default zoom
const INDIA_CENTER: [number, number] = [22.8, 79.2];
const DEFAULT_ZOOM = 4.7;

export const MapView: React.FC<MapViewProps> = ({ projects, onSelectProject }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const clusterIndexRef = useRef<Supercluster | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'pins' | 'risk-distribution'>('pins');

  // UI Interactive States
  const [hoveredStateSummary, setHoveredStateSummary] = useState<StateSummary | null>(null);
  const [activeProject, setActiveProject] = useState<MPLADProject | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // 1. Resolve geographic coordinates for every project via getProjectCoordinates
  const resolvedProjects = useMemo<MappedProject[]>(() => {
    return projects.map((p) => {
      const loc = getProjectCoordinates(p);
      return { project: p, location: loc };
    });
  }, [projects]);

  // Statistics for Data Quality & Location Accuracy reporting
  const locationStats = useMemo(() => {
    let exactCount = 0;
    let districtCount = 0;
    let unavailableCount = 0;
    let invalidCount = 0;

    resolvedProjects.forEach(({ location }) => {
      if (location.accuracy === 'exact') exactCount++;
      else if (location.accuracy === 'district') districtCount++;
      else if (location.accuracy === 'invalid_region') invalidCount++;
      else unavailableCount++;
    });

    return {
      total: projects.length,
      mapped: exactCount + districtCount,
      exactCount,
      districtCount,
      unavailableCount,
      invalidCount,
    };
  }, [resolvedProjects, projects.length]);

  // Extract unique filter dropdown options from real dataset
  const filterOptions = useMemo(() => {
    const states = new Set<string>();
    const districts = new Set<string>();
    const categories = new Set<string>();
    const statuses = new Set<string>();

    projects.forEach((p) => {
      if (p.state) states.add(p.state);
      if (p.district) {
        if (selectedState === 'All' || p.state === selectedState) {
          districts.add(p.district);
        }
      }
      if (p.category) categories.add(p.category);
      if (p.status) statuses.add(p.status);
    });

    return {
      states: Array.from(states).sort(),
      districts: Array.from(districts).sort(),
      categories: Array.from(categories).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [projects, selectedState]);

  // 2. Filter projects based on active filters & search query
  const filteredMappedProjects = useMemo<MappedProject[]>(() => {
    return resolvedProjects.filter(({ project, location }) => {
      // Must have valid coordinates to render on map
      if (location.latitude === null || location.longitude === null) {
        return false;
      }

      // Risk level filter
      if (selectedRisk !== 'All' && project.riskLevel !== selectedRisk) {
        return false;
      }

      // State filter
      if (selectedState !== 'All' && project.state !== selectedState) {
        return false;
      }

      // District filter
      if (selectedDistrict !== 'All' && project.district !== selectedDistrict) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && project.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && project.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchableText = [
          project.title,
          project.workCode,
          project.district,
          project.state,
          project.constituency,
          project.mpName,
          project.contractorName,
          project.implementingAgency,
          project.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(q)) return false;
      }

      return true;
    });
  }, [
    resolvedProjects,
    selectedRisk,
    selectedState,
    selectedDistrict,
    selectedCategory,
    selectedStatus,
    searchQuery,
  ]);

  // Pre-calculate State Statistics from real project data for GeoJSON boundaries
  const stateSummaryMap = useMemo(() => {
    const summary = new Map<string, StateSummary>();

    projects.forEach((p) => {
      if (!p.state) return;
      const key = p.state.toLowerCase().trim();
      const existing = summary.get(key) || {
        name: p.state,
        totalProjects: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        totalAmountLakhs: 0,
        avgRiskScore: 0,
      };

      existing.totalProjects += 1;
      if (p.riskLevel === 'Critical') existing.criticalCount += 1;
      else if (p.riskLevel === 'High') existing.highCount += 1;
      else if (p.riskLevel === 'Medium') existing.mediumCount += 1;
      else existing.lowCount += 1;

      existing.totalAmountLakhs += Number(p.sanctionedAmountLakhs || 0);
      existing.avgRiskScore += Number(p.overallRiskScore || p.riskScore || 0);

      summary.set(key, existing);
    });

    // Compute averages
    summary.forEach((val) => {
      if (val.totalProjects > 0) {
        val.avgRiskScore = Math.round(val.avgRiskScore / val.totalProjects);
      }
    });

    return summary;
  }, [projects]);

  // Load India States GeoJSON
  useEffect(() => {
    let isMounted = true;
    fetch('/india-states.json')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load India boundaries GeoJSON');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setGeoJsonData(data);
        }
      })
      .catch((err) => {
        console.warn('GeoJSON loading warning:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: INDIA_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 3.5,
        maxZoom: 18,
        zoomControl: false, // We'll add custom positioned zoom controls
        attributionControl: false,
      });

      // Standard OpenStreetMap raster tiles - free, public, no API key required
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Attribution control in subtle bottom right
      L.control
        .attribution({
          position: 'bottomright',
          prefix: false,
        })
        .addTo(map);

      // Create a layer group for markers and clusters
      const markersLayerGroup = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = markersLayerGroup;

      mapInstanceRef.current = map;
    } catch (err: any) {
      console.error('Leaflet initialization error:', err);
      setMapError(err?.message || 'Failed to initialize geographic map engine');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle ResizeObserver so the map redraws when sidebar collapses or expands
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Helper for formatting Indian currency
  const formatLakhs = (lakhs: number) => {
    if (lakhs >= 100) {
      return `₹${(lakhs / 100).toFixed(2)} Cr`;
    }
    return `₹${lakhs.toFixed(1)} Lakhs`;
  };

  // Helper to find state summary from state name
  const getStateSummary = useCallback(
    (featureName: string): StateSummary | null => {
      if (!featureName) return null;
      const lower = featureName.toLowerCase().trim();

      // Direct match
      if (stateSummaryMap.has(lower)) {
        return stateSummaryMap.get(lower)!;
      }

      // Substring match
      for (const [key, val] of stateSummaryMap.entries()) {
        if (key.includes(lower) || lower.includes(key)) {
          return val;
        }
      }
      return null;
    },
    [stateSummaryMap]
  );

  // 4. Render GeoJSON State Boundaries
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    // Remove existing GeoJSON layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const stateName = feature?.properties?.name || '';
        const summary = getStateSummary(stateName);

        if (viewMode === 'risk-distribution') {
          // Color based on risk intensity
          if (!summary || summary.totalProjects === 0) {
            return {
              fillColor: '#f1f5f9',
              weight: 1,
              opacity: 0.7,
              color: '#cbd5e1',
              fillOpacity: 0.15,
            };
          }
          if (summary.criticalCount > 0 || summary.avgRiskScore >= 75) {
            return {
              fillColor: '#ef4444',
              weight: 1.5,
              opacity: 0.9,
              color: '#dc2626',
              fillOpacity: 0.35,
            };
          }
          if (summary.highCount > 0 || summary.avgRiskScore >= 55) {
            return {
              fillColor: '#f97316',
              weight: 1.5,
              opacity: 0.9,
              color: '#ea580c',
              fillOpacity: 0.3,
            };
          }
          if (summary.avgRiskScore >= 35) {
            return {
              fillColor: '#f59e0b',
              weight: 1.5,
              opacity: 0.8,
              color: '#d97706',
              fillOpacity: 0.25,
            };
          }
          return {
            fillColor: '#10b981',
            weight: 1.5,
            opacity: 0.8,
            color: '#059669',
            fillOpacity: 0.25,
          };
        }

        // Standard subtle administrative boundary
        return {
          fillColor: '#3b82f6',
          weight: 1.2,
          opacity: 0.5,
          color: '#64748b',
          fillOpacity: 0.04,
        };
      },
      onEachFeature: (feature, layer) => {
        const stateName = feature?.properties?.name || '';
        const summary = getStateSummary(stateName);

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 2.2,
              color: '#1e293b',
              fillOpacity: 0.35,
            });
            if (summary) {
              setHoveredStateSummary(summary);
            } else {
              setHoveredStateSummary({
                name: stateName,
                totalProjects: 0,
                criticalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                totalAmountLakhs: 0,
                avgRiskScore: 0,
              });
            }
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
            setHoveredStateSummary(null);
          },
          click: (e) => {
            map.fitBounds(e.target.getBounds(), { padding: [24, 24] });
            if (summary) {
              setSelectedState(summary.name);
            }
          },
        });
      },
    });

    geoJsonLayer.addTo(map);
    geoJsonLayerRef.current = geoJsonLayer;
  }, [geoJsonData, viewMode, getStateSummary]);

  // 5. Index projects into Supercluster
  useEffect(() => {
    const points: any[] = filteredMappedProjects.map(({ project, location }) => ({
      type: 'Feature',
      properties: {
        cluster: false,
        projectId: project.id,
        project,
        accuracy: location.accuracy,
        locationName: location.locationName,
        riskScore: project.overallRiskScore || project.riskScore || 0,
        riskLevel: project.riskLevel || 'Low',
      },
      geometry: {
        type: 'Point',
        coordinates: [location.longitude!, location.latitude!],
      },
    }));

    const index = new Supercluster({
      radius: 45,
      maxZoom: 16,
      minPoints: 2,
    });

    index.load(points);
    clusterIndexRef.current = index;

    updateVisibleMarkers();
  }, [filteredMappedProjects]);

  // 6. Update visible markers on map based on current zoom & pan bounds
  const updateVisibleMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerGroupRef.current;
    const clusterIndex = clusterIndexRef.current;

    if (!map || !markersLayer || !clusterIndex) return;

    markersLayer.clearLayers();

    const bounds = map.getBounds();
    const zoom = Math.round(map.getZoom());

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    let clusters: any[] = [];
    try {
      clusters = clusterIndex.getClusters(bbox, zoom);
    } catch (e) {
      console.warn('Clustering bbox calculation warning:', e);
      return;
    }

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;

      if (cluster.properties.cluster) {
        // Render Cluster Marker
        const count = cluster.properties.point_count;
        const clusterId = cluster.properties.cluster_id;

        // Custom HTML Cluster DivIcon
        const clusterIcon = L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
              <div class="w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold ring-4 ring-slate-900/20">
                ${count}
              </div>
              <div class="absolute -bottom-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-medium text-[8px] border border-white tracking-tight whitespace-nowrap shadow-xs">
                Works
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([lat, lng], { icon: clusterIcon });
        marker.on('click', () => {
          const expansionZoom = Math.min(
            clusterIndex.getClusterExpansionZoom(clusterId),
            17
          );
          map.setView([lat, lng], expansionZoom, { animate: true });
        });
        marker.addTo(markersLayer);
      } else {
        // Render Individual Project Marker
        const project: MPLADProject = cluster.properties.project;
        const accuracy: 'exact' | 'district' = cluster.properties.accuracy;
        const riskLevel: RiskLevel = project.riskLevel || 'Low';
        const score = project.overallRiskScore || project.riskScore || 0;

        // Color coding for risk level
        let colorBg = 'bg-emerald-600';
        let ringColor = 'ring-emerald-500/30';
        let pulseClass = '';

        if (riskLevel === 'Critical') {
          colorBg = 'bg-rose-600';
          ringColor = 'ring-rose-500/40';
          pulseClass = 'animate-ping opacity-60 bg-rose-500';
        } else if (riskLevel === 'High') {
          colorBg = 'bg-orange-500';
          ringColor = 'ring-orange-500/30';
          pulseClass = 'animate-ping opacity-50 bg-orange-400';
        } else if (riskLevel === 'Medium') {
          colorBg = 'bg-amber-500';
          ringColor = 'ring-amber-500/30';
        }

        // District approximate marker has dashed ring indicator
        const borderStyle =
          accuracy === 'district'
            ? 'border-2 border-dashed border-white'
            : 'border-2 border-white';

        const customIcon = L.divIcon({
          className: 'custom-project-marker',
          html: `
            <div class="relative group cursor-pointer flex items-center justify-center">
              ${
                pulseClass
                  ? `<span class="absolute -inset-1 rounded-full ${pulseClass}"></span>`
                  : ''
              }
              <div class="w-8 h-8 rounded-full ${colorBg} ${borderStyle} text-white font-extrabold text-[11px] shadow-lg flex items-center justify-center ring-4 ${ringColor} transition-transform group-hover:scale-125">
                ${score}
              </div>
              ${
                accuracy === 'district'
                  ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" title="Approximate district location"></span>`
                  : ''
              }
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Clean popup on marker click
        marker.on('click', () => {
          setActiveProject(project);
        });

        marker.addTo(markersLayer);
      }
    });
  }, []);

  // Listen to map move and zoom to recalculate visible clusters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.on('moveend', updateVisibleMarkers);
    map.on('zoomend', updateVisibleMarkers);

    return () => {
      map.off('moveend', updateVisibleMarkers);
      map.off('zoomend', updateVisibleMarkers);
    };
  }, [updateVisibleMarkers]);

  // If search query or filters change, fit bounds to matching projects
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || filteredMappedProjects.length === 0) return;

    // Only auto-pan when user performs active search or selects specific state/district
    if (searchQuery.trim() || selectedState !== 'All' || selectedDistrict !== 'All') {
      const latLngs = filteredMappedProjects.map((p) => [
        p.location.latitude!,
        p.location.longitude!,
      ]);
      const bounds = L.latLngBounds(latLngs as any);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [searchQuery, selectedState, selectedDistrict, filteredMappedProjects]);

  // Reset Map View
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView(INDIA_CENTER, DEFAULT_ZOOM, { animate: true });
    setSelectedRisk('All');
    setSelectedState('All');
    setSelectedDistrict('All');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSearchQuery('');
    setActiveProject(null);
  };

  // Zoom In / Out Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div
      id="mplads-geographic-map-view"
      className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-[780px] select-none"
    >
      {/* 1. Header & Filter Bar */}
      <div className="p-4 border-b border-slate-200/90 bg-slate-50/80 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Title & Coverage Indicator */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Geographic Project Monitoring
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {locationStats.mapped} of {locationStats.total} Works Mapped
                </span>
                {locationStats.districtCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-600" />
                    <span>{locationStats.districtCount} Approx. District</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic geographic coordinates with automated district resolution & state boundaries
              </p>
            </div>
          </div>

          {/* Search Field & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="map-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district, constituency, village or project..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Pins vs Risk Distribution */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('pins')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'pins'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View project markers and clusters"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Project Pins</span>
              </button>
              <button
                onClick={() => setViewMode('risk-distribution')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'risk-distribution'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View state risk intensity choropleth"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Risk Distribution</span>
              </button>
            </div>

            <button
              id="map-reset-btn"
              onClick={handleResetView}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
              title="Reset view to India"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Bar: Risk Level + Categorical Dropdowns */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-200/70">
          {/* Risk Level Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((lvl) => {
              const isSelected = selectedRisk === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedRisk(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? lvl === 'Critical'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : lvl === 'High'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : lvl === 'Medium'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : lvl === 'Low'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* State Dropdown */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All');
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="All">All States ({filterOptions.states.length})</option>
              {filterOptions.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* District Dropdown */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs max-w-[160px] truncate"
            >
              <option value="All">All Districts</option>
              {filterOptions.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs max-w-[160px] truncate hidden md:block"
            >
              <option value="All">All Sectors</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs max-w-[160px] truncate hidden lg:block"
            >
              <option value="All">All Statuses</option>
              {filterOptions.statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Interactive Map Container */}
      <div className="relative flex-1 bg-slate-100 overflow-hidden">
        {/* Real Leaflet Map Render Canvas */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Error Fallback Banner */}
        {mapError && (
          <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Map Loading Notice</h4>
              <p className="text-xs text-slate-600">{mapError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Reload View
              </button>
            </div>
          </div>
        )}

        {/* Empty State Banner when filters return 0 results */}
        {filteredMappedProjects.length === 0 && !mapError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg px-4 py-2.5 rounded-2xl flex items-center gap-2 z-30 pointer-events-auto">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-slate-800">
              No projects with valid coordinates match the selected filters.
            </span>
            <button
              onClick={handleResetView}
              className="text-xs font-bold text-blue-600 hover:underline ml-1"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-xl border border-slate-200 shadow-lg z-30">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors"
            title="Zoom in"
          >
            <span className="text-sm font-bold">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors"
            title="Zoom out"
          >
            <span className="text-sm font-bold">−</span>
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors text-[10px] font-bold text-center border-t border-slate-200/80"
            title="Reset to India center"
          >
            <Crosshair className="w-3.5 h-3.5 mx-auto" />
          </button>
        </div>

        {/* Color Legend (Government Style) */}
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm border border-slate-200 p-3 rounded-2xl shadow-lg text-slate-800 text-[11px] space-y-1.5 z-30 hidden sm:block max-w-xs">
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <span>Risk Indicators</span>
            <span className="text-[10px] text-slate-500 font-normal">Score (0–100)</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-2xs shrink-0" />
              <span>Critical (81–100)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-2xs shrink-0" />
              <span>High (61–80)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-2xs shrink-0" />
              <span>Medium (31–60)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-2xs shrink-0" />
              <span>Low (0–30)</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-600 bg-white" />
              <span>Exact GPS</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-slate-600 bg-white" />
              <span>District Approx</span>
            </div>
          </div>
        </div>

        {/* Hovered State Statistics Overlay (Requirement 10) */}
        {hoveredStateSummary && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-3.5 z-30 max-w-xs w-full animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  State Vigilance Summary
                </span>
                <h4 className="text-sm font-bold text-slate-900">{hoveredStateSummary.name}</h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {hoveredStateSummary.totalProjects} Works
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">Total Allocation</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {formatLakhs(hoveredStateSummary.totalAmountLakhs)}
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500">Avg Risk Index</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {hoveredStateSummary.avgRiskScore}/100
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 text-slate-600">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>{hoveredStateSummary.criticalCount} Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>{hoveredStateSummary.highCount} High</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{hoveredStateSummary.lowCount} Low</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Project Clean Information Popup (Requirement 6) */}
        {activeProject && (
          <div className="absolute top-4 right-4 max-w-sm w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 z-40 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-blue-700">
                  <span>{activeProject.workCode || activeProject.id}</span>
                  {getProjectCoordinates(activeProject).accuracy === 'exact' ? (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans text-[9px] font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Exact GPS
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-sans text-[9px] font-semibold flex items-center gap-0.5">
                      <Info className="w-2.5 h-2.5" /> Approx District
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                  {activeProject.title}
                </h4>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>
                    {activeProject.district || activeProject.constituency}, {activeProject.state}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close project details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financials & Progress */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Amount</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  ₹{Number(activeProject.sanctionedAmountLakhs || 0).toFixed(1)} Lakhs
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Spent: ₹{Number(activeProject.expenditureAmountLakhs || 0).toFixed(1)}L
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Completion</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {activeProject.completionPercentage ?? 0}%
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  Status: {activeProject.status}
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">
                  Vigilance Risk Score
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {activeProject.overallRiskScore || activeProject.riskScore || 0}
                  <span className="text-xs text-slate-400 font-normal"> / 100</span>
                </div>
              </div>
              <RiskBadge level={activeProject.riskLevel || 'Low'} size="sm" />
            </div>

            {/* Primary Anomaly Flag if present */}
            {activeProject.mainAnomaly && (
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{activeProject.mainAnomaly}</span>
              </div>
            )}

            {/* View Project Details Button */}
            <button
              id="map-view-project-details-btn"
              onClick={() => {
                onSelectProject(activeProject);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <span>View Project Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
