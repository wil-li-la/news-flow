import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MindMapNode, MindMapLink, SwipeAction } from '../types';
import { generateMindMapData, getCategoryColor, getRegionColor, getLinkColor, MindMapViewMode } from '../utils/mindMapUtils';
import { ZoomIn, ZoomOut, RotateCcw, Info, Brain, Building2, Globe } from 'lucide-react';

interface MindMapProps {
  swipeHistory: SwipeAction[];
}

const formatMiniDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


export const MindMap: React.FC<MindMapProps> = ({ swipeHistory }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<MindMapViewMode>('semantic');
  
  // Filter to only liked articles
  const likedSwipes = swipeHistory.filter(swipe => swipe.direction === 'right');

  useEffect(() => {
    if (!svgRef.current || likedSwipes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const { nodes, links } = generateMindMapData(swipeHistory, viewMode);

    if (nodes.length === 0) return;

    // Create zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    const container = svg.append('g');

    // Create force simulation
    const simulation = d3.forceSimulation<MindMapNode>(nodes)
      .force('link', d3.forceLink<MindMapNode, MindMapLink>(links)
        .id(d => d.id)
        .distance(d => 100 / (d.strength + 0.1))
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        const baseColor = getLinkColor(d.type);
        const opacity = 0.3 + d.strength * 0.7;
        return baseColor;
      })
      .attr('stroke-opacity', d => Math.max(0.2, 0.3 + d.strength * 0.7))
      .attr('stroke-width', d => Math.max(1, 1 + d.strength * 4))
      .style('filter', d => d.strength > 0.7 ? 'drop-shadow(0px 0px 3px rgba(59, 130, 246, 0.6))' : 'none');

    // Create nodes
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, MindMapNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => {
        const baseSize = 20;
        const sizeMultiplier = d.articleCount ? Math.min(2, 1 + (d.articleCount - 1) * 0.2) : 1;
        return baseSize * sizeMultiplier;
      })
      .attr('fill', d => viewMode === 'region' ? getRegionColor(d.region) : getCategoryColor(d.category))
      .attr('stroke', d => d.sentiment === 'liked' ? '#10B981' : '#EF4444')
      .attr('stroke-width', 3)
      .attr('opacity', 0.8);

    // Add labels
    node.append('text')
      .text(d => {
        const maxLength = viewMode === 'semantic' ? 15 : 12;
        return d.title.length > maxLength ? d.title.substring(0, maxLength) + '...' : d.title;
      })
      .attr('x', 0)
      .attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .attr('font-weight', '500');

    // Add category labels
    node.append('text')
      .text(d => {
        if (viewMode === 'semantic') return d.category;
        if (viewMode === 'category') return `${d.articleCount || 0} articles`;
        if (viewMode === 'region') return `${d.articleCount || 0} articles`;
        return '';
      })
      .attr('x', 0)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', '#6B7280')
      .attr('font-weight', '400');

    // Add click handler
    node.on('click', (event, d) => {
      setSelectedNode(d);
    });

    // Add hover effects
    node.on('mouseenter', function(event, d) {
      const currentRadius = d3.select(this).select('circle').attr('r');
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', parseFloat(currentRadius) + 5)
        .attr('opacity', 1);
    })
    .on('mouseleave', function(event, d) {
      const baseSize = 20;
      const sizeMultiplier = d.articleCount ? Math.min(2, 1 + (d.articleCount - 1) * 0.2) : 1;
      const originalRadius = baseSize * sizeMultiplier;
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', originalRadius)
        .attr('opacity', 0.8);
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as MindMapNode).x!)
        .attr('y1', d => (d.source as MindMapNode).y!)
        .attr('x2', d => (d.target as MindMapNode).x!)
        .attr('y2', d => (d.target as MindMapNode).y!);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [swipeHistory, viewMode]);

  const getViewModeIcon = (mode: MindMapViewMode) => {
    switch (mode) {
      case 'semantic': return Brain;
      case 'category': return Building2;
      case 'region': return Globe;
      default: return Brain;
    }
  };

  const getViewModeLabel = (mode: MindMapViewMode) => {
    switch (mode) {
      case 'semantic': return 'Semantic';
      case 'category': return 'Category';
      case 'region': return 'Region';
      default: return 'Semantic';
    }
  };

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.67);
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
    }
  };

  if (likedSwipes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-600 text-sm">Like some news articles to build your knowledge network</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* View Mode Controls */}
        <div className="flex gap-1 bg-white shadow-lg rounded-lg p-1">
          {(['semantic', 'category', 'region'] as MindMapViewMode[]).map((mode) => {
            const Icon = getViewModeIcon(mode);
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={`${getViewModeLabel(mode)} View`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        
        {/* Zoom Controls */}
        <div className="flex gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ZoomIn className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ZoomOut className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-sm">Legend</h4>
          <span className="text-xs text-gray-500">({getViewModeLabel(viewMode)} View)</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full border-2 border-green-500 ${
              viewMode === 'region' ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>
            <span>
              {viewMode === 'semantic' && 'Keywords'}
              {viewMode === 'category' && 'Categories'}
              {viewMode === 'region' && 'Regions'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-gray-400 rounded"></div>
            <span>Weak Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-600 rounded" style={{ height: '3px' }}></div>
            <span>Strong Connection</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>
                {viewMode === 'semantic' && 'Semantic'}
                {viewMode === 'category' && 'Category'}
                {viewMode === 'region' && 'Regional'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-white shadow-lg rounded-lg px-3 py-2">
        <span className="text-xs text-gray-600">
          {likedSwipes.length} articles • {getViewModeLabel(viewMode)} • {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        className="w-full h-full"
      />

      {/* Node details modal */}
      {selectedNode && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{
                    backgroundColor:
                      viewMode === 'region'
                        ? getRegionColor(selectedNode.region)
                        : getCategoryColor(selectedNode.category),
                  }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {selectedNode.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'semantic' && `${selectedNode.category} • ${selectedNode.region}`}
                    {(viewMode === 'category' || viewMode === 'region') &&
                      `${selectedNode.articleCount || 0} articles`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Badges */}
            <div className="mt-3">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {viewMode === 'semantic' && 'Keyword Hub'}
                {viewMode === 'category' && 'Category Hub'}
                {viewMode === 'region' && 'Regional Hub'}
              </span>
            </div>

            {/* Article list */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  Articles ({selectedNode.articleRefs?.length ?? 0})
                </h4>

                {selectedNode.articleRefs?.length ? (
                  <button
                    onClick={() => {
                      selectedNode.articleRefs!.forEach(a => {
                        if (a.url) window.open(a.url, '_blank', 'noopener,noreferrer');
                      });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Open all
                  </button>
                ) : null}
              </div>

              {selectedNode.articleRefs?.length ? (
                <ul className="mt-2 divide-y divide-gray-100 overflow-y-auto pr-1 space-y-0 max-h-[50vh]">
                  {selectedNode.articleRefs.map(ref => (
                    <li key={ref.id} className="py-3">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm font-medium text-gray-900 hover:underline"
                      >
                        {ref.title}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        {ref.source}
                        {ref.publishedAt ? ` • ${formatMiniDate(ref.publishedAt)}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  No articles attached to this node yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};